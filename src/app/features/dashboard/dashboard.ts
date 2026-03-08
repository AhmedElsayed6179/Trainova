// src/app/features/dashboard/dashboard.ts
// ✅ FIXED: Auto-refresh on workout completion, profile updates, real-time stats

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import Chart from 'chart.js/auto';
import { User } from '../../core/models/user-profile';
import { DailyWorkout, WorkoutStats, RecentWorkout } from '../../core/models/daily-workout';
import { firstValueFrom, Subscription } from 'rxjs';
import { StateService } from '../../core/services/state-service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule, TranslatePipe]
})
export class Dashboard implements OnInit, OnDestroy {
  user: User | null = null;
  workoutStats: WorkoutStats | null = null;
  todayWorkout: DailyWorkout | null = null;
  weeklyData: number[] = [0, 0, 0, 0, 0, 0, 0];
  categoryData: { [key: string]: number } = {};
  recentWorkouts: RecentWorkout[] = [];

  achievements = {
    totalWorkouts: 0,
    totalExercises: 0,
    totalCalories: 0,
    totalMinutes: 0,
    bestStreak: 0,
    currentStreak: 0
  };

  greeting: string = '';
  private charts: Chart[] = [];
  private subscriptions = new Subscription();

  constructor(
    private apiService: ApiService,
    private stateService: StateService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.user = this.stateService.getUser();
    if (!this.user) {
      window.location.href = '/login';
      return;
    }

    this.setGreeting();
    this.loadDashboardData();

    const daySub = this.stateService.dayCompleted$.subscribe(dayNumber => {
      if (dayNumber !== null) {
        console.log(`📊 Dashboard refreshing after day ${dayNumber} completed`);
        this.refreshData();
      }
    });
    this.subscriptions.add(daySub);

    const userSub = this.stateService.user$.subscribe(user => {
      if (user) {
        this.user = user;
        this.achievements.currentStreak = user.current_streak || 0;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.add(userSub);

    const statsSub = this.stateService.workoutStats$.subscribe(stats => {
      if (stats) {
        this.workoutStats = stats;
        this.updateAchievements(stats);
        this.rebuildCharts();
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.add(statsSub);

    const profileSub = this.stateService.profileUpdated$.subscribe(updated => {
      if (updated) {
        this.user = this.stateService.getUser();
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.add(profileSub);
  }

  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
    this.subscriptions.unsubscribe();
  }

  async loadDashboardData() {
    try {
      await Promise.all([
        this.loadWorkoutStats(),
        this.loadTodayWorkout(),
        this.loadWeeklyProgress(),
        this.loadCategoryDistribution(),
        this.loadRecentWorkouts()
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setTimeout(() => this.initCharts(), 100);
    }
  }

  async refreshData() {
    await Promise.all([
      this.loadWorkoutStats(),
      this.loadTodayWorkout(),
      this.loadWeeklyProgress(),
      this.loadCategoryDistribution(),
      this.loadRecentWorkouts()
    ]);
    this.rebuildCharts();
    this.cdr.detectChanges();
  }

  async loadWorkoutStats() {
    try {
      const stats = await firstValueFrom(this.apiService.getWorkoutStats(this.user!._id));
      this.workoutStats = stats;
      this.stateService.setWorkoutStats(stats);
      this.updateAchievements(stats);
    } catch (e) { console.error(e); }
  }

  updateAchievements(stats: WorkoutStats) {
    this.achievements = {
      totalWorkouts: stats.total_workouts || 0,
      totalExercises: stats.total_exercises || 0,
      totalCalories: stats.total_calories || 0,
      totalMinutes: Math.floor((stats.total_duration || 0) / 60),
      bestStreak: stats.best_streak || 0,
      currentStreak: stats.current_streak || this.user?.current_streak || 0
    };
  }

  async loadTodayWorkout() {
    try {
      this.todayWorkout = await firstValueFrom(this.apiService.getTodaysWorkout(this.user!._id));
    } catch (e) { console.error(e); }
  }

  async loadWeeklyProgress() {
    try {
      const data = await firstValueFrom(this.apiService.getWeeklyProgress(this.user!._id));
      if (data?.length) {
        this.weeklyData = data.map(d => d.count);
      }
    } catch (e) { console.error(e); }
  }

  async loadCategoryDistribution() {
    try {
      this.categoryData = await firstValueFrom(this.apiService.getCategoryDistribution(this.user!._id));
    } catch (e) { console.error(e); }
  }

  async loadRecentWorkouts() {
    try {
      const history = await firstValueFrom(this.apiService.getWorkoutHistory(this.user!._id, 'week'));
      if (history?.history) {
        this.recentWorkouts = history.history.slice(0, 5).map((item: any) => ({
          exercise_name: item.exercise_name,
          completed_at: item.completed_at,
          category: item.category,
          sets: item.sets,
          reps: item.reps
        }));
      }
    } catch (e) {
      this.recentWorkouts = [];
    }
  }

  rebuildCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    setTimeout(() => this.initCharts(), 50);
  }

  setGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'DASHBOARD.GREETING.MORNING';
    else if (hour < 18) this.greeting = 'DASHBOARD.GREETING.AFTERNOON';
    else this.greeting = 'DASHBOARD.GREETING.EVENING';
  }

  initCharts() {
    this.initWeeklyChart();
    this.initCategoryChart();
  }

  initWeeklyChart() {
    const ctx = document.getElementById('weeklyChart') as HTMLCanvasElement;
    if (!ctx) return;
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.getWeekDays(),
        datasets: [{
          label: this.translate.instant('DASHBOARD.CHARTS.WEEKLY_LABEL'),
          data: this.weeklyData,
          backgroundColor: '#ffc107',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
    this.charts.push(chart);
  }

  initCategoryChart() {
    const ctx = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!ctx) return;
    const categories = Object.keys(this.categoryData || {});
    const values = Object.values(this.categoryData || {});
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories.map(c => this.translate.instant(`EXERCISES.CATEGORIES.${c.toUpperCase()}`)),
        datasets: [{
          data: values,
          backgroundColor: ['#ffc107', '#28a745', '#17a2b8', '#dc3545', '#6f42c1'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        cutout: '65%'
      }
    });
    this.charts.push(chart);
  }

  getWeekDays(): string[] {
    const days = [];
    const today = new Date().getDay();
    const dayNames = this.translate.instant('DAYS.SHORT');
    for (let i = 6; i >= 0; i--) {
      const index = (today - i + 7) % 7;
      days.push(dayNames[index] || '');
    }
    return days;
  }

  getProgressPercentage(): number {
    if (!this.todayWorkout) return 0;
    return (this.todayWorkout.total_completed / this.todayWorkout.total_exercises) * 100;
  }

  formatNumber(num: number): string {
    return num?.toLocaleString() || '0';
  }

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  startWorkout() {
    window.location.href = '/workout';
  }
}
