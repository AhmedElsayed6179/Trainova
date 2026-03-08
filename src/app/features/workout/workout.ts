// src/app/features/workout/workout.ts
// ✅ v3.0: Professional workout logic — rest timer per exercise, auto-advance,
//          30-day cycle reset, real-time UI, full DB sync

import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import Swal from 'sweetalert2';
import { User } from '../../core/models/user-profile';
import { WorkoutPlan, WorkoutDay, WorkoutExercise } from '../../core/models/daily-workout';
import { firstValueFrom, Subscription, interval } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../core/services/state-service';

// ✅ Reliable exercise images from wger.de
const EXERCISE_IMAGES: Record<string, string> = {
  'crunch': 'https://wger.de/static/images/exercises/small/246.png',
  'leg-raises': 'https://wger.de/static/images/exercises/small/91.png',
  'plank': 'https://wger.de/static/images/exercises/small/222.png',
  'russian-twist': 'https://wger.de/static/images/exercises/small/307.png',
  'bicycle-crunch': 'https://wger.de/static/images/exercises/small/247.png',
  'heel-touch': 'https://wger.de/static/images/exercises/small/246.png',
  'mountain-climber': 'https://wger.de/static/images/exercises/small/343.png',
  'hollow-hold': 'https://wger.de/static/images/exercises/small/222.png',
  'dead-bug': 'https://wger.de/static/images/exercises/small/222.png',
  'v-ups': 'https://wger.de/static/images/exercises/small/91.png',
  'side-plank': 'https://wger.de/static/images/exercises/small/222.png',
  'flutter-kicks': 'https://wger.de/static/images/exercises/small/91.png',
  'bodyweight-squat': 'https://wger.de/static/images/exercises/small/8.png',
  'forward-lunge': 'https://wger.de/static/images/exercises/small/33.png',
  'reverse-lunge': 'https://wger.de/static/images/exercises/small/33.png',
  'calf-raises': 'https://wger.de/static/images/exercises/small/18.png',
  'wall-sit': 'https://wger.de/static/images/exercises/small/8.png',
  'glute-bridge': 'https://wger.de/static/images/exercises/small/75.png',
  'single-leg-glute-bridge': 'https://wger.de/static/images/exercises/small/75.png',
  'sumo-squat': 'https://wger.de/static/images/exercises/small/8.png',
  'step-up': 'https://wger.de/static/images/exercises/small/33.png',
  'lateral-lunge': 'https://wger.de/static/images/exercises/small/33.png',
  'jump-squat': 'https://wger.de/static/images/exercises/small/8.png',
  'donkey-kick': 'https://wger.de/static/images/exercises/small/75.png',
  'pushup': 'https://wger.de/static/images/exercises/small/141.png',
  'wide-pushup': 'https://wger.de/static/images/exercises/small/141.png',
  'diamond-pushup': 'https://wger.de/static/images/exercises/small/141.png',
  'incline-pushup': 'https://wger.de/static/images/exercises/small/141.png',
  'decline-pushup': 'https://wger.de/static/images/exercises/small/141.png',
  'dips': 'https://wger.de/static/images/exercises/small/90.png',
  'burpee': 'https://wger.de/static/images/exercises/small/343.png',
  'pike-pushup': 'https://wger.de/static/images/exercises/small/76.png',
  'plank-to-pushup': 'https://wger.de/static/images/exercises/small/222.png',
  'superman-push': 'https://wger.de/static/images/exercises/small/222.png',
  'pull-up': 'https://wger.de/static/images/exercises/small/3.png',
  'superman': 'https://wger.de/static/images/exercises/small/222.png',
  'inverted-row': 'https://wger.de/static/images/exercises/small/3.png',
  'bent-over-row': 'https://wger.de/static/images/exercises/small/73.png',
  'muscle-up': 'https://wger.de/static/images/exercises/small/3.png',
};

function getExerciseImage(exercise: any): string {
  const id = (exercise.id || '').toLowerCase().replace(/\s+/g, '-');
  const name = (exercise.name || '').toLowerCase().replace(/\s+/g, '-');
  return EXERCISE_IMAGES[id] || EXERCISE_IMAGES[name] ||
    exercise.gifUrl || exercise.gif_url ||
    'https://wger.de/static/images/exercises/small/141.png';
}

@Component({
  selector: 'app-workout',
  templateUrl: './workout.html',
  styleUrls: ['./workout.css'],
  standalone: true,
  imports: [CommonModule, TranslatePipe, FormsModule]
})
export class Workout implements OnInit, OnDestroy, AfterViewInit {
  user: User | null = null;
  workoutPlan: WorkoutPlan | null = null;
  currentDay: WorkoutDay | null = null;

  selectedDay: number = 1;
  days: number[] = Array.from({ length: 30 }, (_, i) => i + 1);
  completedDays: Set<number> = new Set();
  dayExercises: { [key: number]: WorkoutExercise[] } = {};

  // ── Rest Timer State ──────────────────────────────────────────
  isResting = false;
  restTimer: number = 0;
  restingExerciseName: string = '';
  private restSub?: Subscription;

  // ── Workout State ─────────────────────────────────────────────
  currentExerciseIndex = 0;
  totalExercises = 0;
  completedExercises = 0;
  progressPercentage = 0;

  workoutTimer: number = 0;
  private timerSub?: Subscription;
  isWorkoutActive = false;

  isLoadingDay = false;
  isLoading = true;
  isArabic = false;

  private subscriptions = new Subscription();

  constructor(
    private apiService: ApiService,
    private stateService: StateService,
    private translate: TranslateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.user = this.stateService.getUser();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    // ── Language: initialize + react to changes ──────────────────
    this.isArabic = (this.translate.currentLang || this.translate.defaultLang || localStorage.getItem('lang') || 'en') === 'ar';
    const langSub = this.translate.onLangChange.subscribe(event => {
      this.isArabic = event.lang === 'ar';
      this.cdr.detectChanges();
    });
    this.subscriptions.add(langSub);

    const goalSub = this.stateService.goalChanged$.subscribe(newGoal => {
      if (newGoal && this.user) this.generateNewPlan();
    });
    this.subscriptions.add(goalSub);

    const profileSub = this.stateService.profileUpdated$.subscribe(updated => {
      if (updated) {
        this.user = this.stateService.getUser();
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.add(profileSub);

    this.loadWorkoutPlan();
  }

  ngAfterViewInit() {
    this.initializeAnimations();
  }

  ngOnDestroy() {
    this.clearAllTimers();
    this.subscriptions.unsubscribe();
  }

  initializeAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('animated');
      });
    }, { threshold: 0.1 });
    elements.forEach(el => observer.observe(el));
  }

  // ── Plan Normalization ─────────────────────────────────────────

  normalizePlan(raw: any): WorkoutPlan {
    return {
      ...raw,
      currentDay: raw.currentDay ?? raw.current_day ?? 1,
      days: (raw.days || []).map((d: any) => ({
        ...d,
        dayNumber: d.dayNumber ?? d.day_number,
        completed: d.completed ?? false,
        exercises: (d.exercises || []).map((e: any) => ({
          ...e,
          gifUrl: getExerciseImage(e),
          restTime: e.restTime ?? e.rest_time ?? 60,
          completed: e.completed ?? false,
        }))
      }))
    } as WorkoutPlan;
  }

  // ── Plan Loading ───────────────────────────────────────────────

  async loadWorkoutPlan() {
    this.isLoading = true;
    try {
      const raw = await firstValueFrom(this.apiService.getWorkoutPlan(this.user!._id));
      const plan = raw ? this.normalizePlan(raw) : null;

      if (plan && plan.days && plan.days.length > 0) {
        this.workoutPlan = plan;
        this.stateService.setWorkoutPlan(plan);
        this.selectedDay = plan.currentDay || 1;
        this.completedDays = new Set(
          plan.days.filter((d: any) => d.completed).map((d: any) => d.dayNumber)
        );
        await this.loadAllDaysExercises();
        this.loadDay(this.selectedDay);
      } else {
        await this.generateNewPlan();
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      await this.generateNewPlan();
    } finally {
      this.isLoading = false;
    }
  }

  async generateNewPlan() {
    try {
      const raw = await firstValueFrom(
        this.apiService.generateWorkoutPlan(this.user!._id, this.user!.goal)
      );
      const plan = this.normalizePlan(raw);
      this.workoutPlan = plan;
      this.stateService.setWorkoutPlan(plan);
      this.selectedDay = 1;
      this.completedDays.clear();
      this.dayExercises = {};
      await this.loadAllDaysExercises();
      this.loadDay(1);

      Swal.fire({
        icon: 'success',
        title: this.translate.instant('WORKOUT.PLAN_GENERATED'),
        text: this.translate.instant('WORKOUT.PLAN_GENERATED_TEXT'),
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error generating plan:', error);
    }
  }

  async loadAllDaysExercises() {
    if (!this.workoutPlan) return;
    await Promise.all(this.workoutPlan.days.map(day => this.loadDayExercises(day.dayNumber)));
  }

  async loadDayExercises(dayNumber: number) {
    if (!this.user) return;
    try {
      const response = await firstValueFrom(this.apiService.getWorkoutDay(this.user._id, dayNumber));
      if (response?.exercises) {
        this.dayExercises[dayNumber] = response.exercises.map((e: any) => ({
          ...e,
          gifUrl: getExerciseImage(e),
          restTime: e.restTime ?? e.rest_time ?? 60,
          completed: e.completed ?? false,
        }));
      } else {
        this.dayExercises[dayNumber] = [];
      }
    } catch {
      this.dayExercises[dayNumber] = [];
    }
  }

  async loadDay(dayNumber: number) {
    if (!this.workoutPlan) return;
    this.isLoadingDay = true;

    if (!this.dayExercises[dayNumber]) {
      await this.loadDayExercises(dayNumber);
    }

    const day = this.workoutPlan.days.find(d => d.dayNumber === dayNumber);
    if (day) {
      this.currentDay = { ...day, exercises: this.dayExercises[dayNumber] || [] };
      this.totalExercises = this.currentDay.exercises?.length || 0;
      this.completedExercises = this.currentDay.exercises?.filter(e => e.completed).length || 0;
      this.updateProgress();
    }

    // ✅ Resume from first uncompleted exercise
    const firstUncompleted = this.currentDay?.exercises.findIndex(e => !e.completed) ?? 0;
    this.currentExerciseIndex = firstUncompleted >= 0 ? firstUncompleted : 0;

    this.isWorkoutActive = false;
    this.isResting = false;
    this.clearAllTimers();
    this.isLoadingDay = false;
    this.cdr.detectChanges();
  }

  // ── Day Selection ──────────────────────────────────────────────

  selectDay(dayNumber: number) {
    if (dayNumber < 1 || dayNumber > 30) return;
    if (this.isWorkoutActive) return;
    if (this.canAccessDay(dayNumber)) {
      this.selectedDay = dayNumber;
      this.loadDay(dayNumber);
    } else {
      Swal.fire({
        icon: 'warning',
        title: this.translate.instant('WORKOUT.CANNOT_ACCESS'),
        text: this.translate.instant('WORKOUT.COMPLETE_PREVIOUS_DAYS'),
        confirmButtonColor: '#ffc107'
      });
    }
  }

  canAccessDay(dayNumber: number): boolean {
    if (dayNumber < 1 || dayNumber > 30) return false;
    if (dayNumber === 1) return true;
    const currentDay = this.workoutPlan?.currentDay || 1;
    return (
      this.completedDays.has(dayNumber) ||
      this.completedDays.has(dayNumber - 1) ||
      dayNumber <= currentDay
    );
  }

  getDayStatus(day: number): string {
    if (this.completedDays.has(day)) return 'completed';
    if (day === this.selectedDay) return 'current';
    if (!this.canAccessDay(day)) return 'locked';
    return 'available';
  }

  // ── Navigation ─────────────────────────────────────────────────

  async navigateToPreviousDay() {
    if (this.selectedDay <= 1 || this.isWorkoutActive) return;
    this.selectedDay--;
    await this.loadDay(this.selectedDay);
  }

  async navigateToNextDay() {
    if (this.selectedDay >= 30 || this.isWorkoutActive) return;
    const targetDay = this.selectedDay + 1;
    if (!this.canAccessDay(targetDay)) {
      Swal.fire({
        icon: 'warning',
        title: this.translate.instant('WORKOUT.CANNOT_ACCESS'),
        text: this.translate.instant('WORKOUT.COMPLETE_PREVIOUS_DAYS'),
        confirmButtonColor: '#ffc107'
      });
      return;
    }
    this.selectedDay = targetDay;
    await this.loadDay(targetDay);
  }

  // ── Workout Session ────────────────────────────────────────────

  startWorkout() {
    if (!this.currentDay || this.currentDay.completed) return;

    this.isWorkoutActive = true;
    this.workoutTimer = 0;

    // ✅ Resume from first uncompleted exercise
    const firstUncompleted = this.currentDay.exercises.findIndex(e => !e.completed);
    this.currentExerciseIndex = firstUncompleted >= 0 ? firstUncompleted : 0;

    // ✅ Real-time workout timer
    this.timerSub?.unsubscribe();
    this.timerSub = interval(1000).subscribe(() => {
      this.workoutTimer++;
      this.cdr.detectChanges();
    });
  }

  // ── Exercise Completion ────────────────────────────────────────

  async completeExercise(exercise: WorkoutExercise) {
    if (!this.currentDay || !this.user || exercise.completed || this.isResting) return;

    // ✅ Instant UI — no API wait
    exercise.completed = true;
    this.completedExercises++;
    this.updateProgress();
    this.cdr.detectChanges();

    // ✅ Fire-and-forget save to DB
    this.apiService.completeExerciseInDay(
      this.user._id,
      this.currentDay.dayNumber,
      exercise.id,
      { sets: exercise.sets, reps: exercise.reps, completedAt: new Date() }
    ).subscribe({ error: (e) => console.error('Exercise save error:', e) });

    // ✅ All exercises done → show "Complete Day" button
    if (this.completedExercises >= this.totalExercises) {
      this.isResting = false;
      this.clearRestTimer();
      this.cdr.detectChanges();
      return;
    }

    // ✅ Advance index to next exercise
    this.currentExerciseIndex++;

    // ✅ Start rest countdown using THIS exercise's restTime
    const restDuration = exercise.restTime > 0 ? exercise.restTime : 45;
    this.startRest(restDuration, this.getExerciseName(exercise));
  }

  // ── Rest Timer ─────────────────────────────────────────────────

  startRest(seconds: number, exerciseName: string = '') {
    this.isResting = true;
    this.restTimer = seconds;
    this.restingExerciseName = exerciseName;
    this.clearRestTimer();
    this.cdr.detectChanges();

    this.restSub = interval(1000).subscribe(() => {
      this.restTimer--;
      this.cdr.detectChanges();

      if (this.restTimer <= 0) {
        this.isResting = false;
        this.restingExerciseName = '';
        this.clearRestTimer();
        this.cdr.detectChanges();
      }
    });
  }

  skipRest() {
    this.isResting = false;
    this.restTimer = 0;
    this.restingExerciseName = '';
    this.clearRestTimer();
    this.cdr.detectChanges();
  }

  // ── Day Completion ─────────────────────────────────────────────

  async completeDay() {
    if (!this.currentDay || !this.user || !this.workoutPlan) return;

    // ✅ Instant UI update
    this.currentDay.completed = true;
    this.completedDays.add(this.selectedDay);
    this.isResting = false;
    this.clearAllTimers();
    this.isWorkoutActive = false;
    this.cdr.detectChanges();

    try {
      const result = await firstValueFrom(this.apiService.completeWorkoutDay(
        this.user._id,
        this.selectedDay,
        { duration: this.workoutTimer, completedAt: new Date() }
      ));

      const nextDay = result?.current_day || Math.min(30, this.selectedDay + 1);
      this.workoutPlan.currentDay = nextDay;

      // ✅ Notify dashboard for real-time refresh
      this.stateService.notifyDayCompleted(this.selectedDay);
      await this.refreshUserStats();

      // ✅ 30-day cycle completion check
      if (this.completedDays.size >= 30) {
        await this.handlePlanCompletion();
      } else {
        this.showCompletionCelebration();
      }
    } catch (error) {
      console.error('Error completing day:', error);
      this.showCompletionCelebration();
    }
  }

  // ✅ All 30 days done → offer new cycle
  async handlePlanCompletion() {
    this.launchConfetti();

    const result = await Swal.fire({
      icon: 'success',
      title: '🏆 Challenge Complete!',
      html: `
        <p style="font-size:1rem">You've crushed the entire 30-day challenge!</p>
        <p style="color:#ffc107;font-size:1.4rem;font-weight:800;margin:12px 0">
          ${this.completedDays.size} / 30 Days Complete
        </p>
        <p style="color:rgba(255,255,255,0.6)">Ready to start the next cycle?</p>
      `,
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '🔄 Start New Cycle',
      cancelButtonText: 'Stay Here'
    });

    if (result.isConfirmed) {
      await this.generateNewPlan();
    }
  }

  showCompletionCelebration() {
    this.launchConfetti();
    Swal.fire({
      icon: 'success',
      title: this.translate.instant('WORKOUT.DAY_COMPLETED'),
      text: this.translate.instant('WORKOUT.DAY_COMPLETED_TEXT'),
      confirmButtonColor: '#ffc107',
      confirmButtonText: this.translate.instant('WORKOUT.CONTINUE')
    }).then(result => {
      if (result.isConfirmed && this.selectedDay < 30) {
        this.selectDay(this.selectedDay + 1);
      }
    });
  }

  launchConfetti() {
    for (let i = 0; i < 60; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed; top: -10px; left: ${Math.random() * 100}%;
          width: ${6 + Math.random() * 8}px; height: ${6 + Math.random() * 8}px;
          background: hsl(${Math.random() * 360}, 100%, 55%);
          border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
          animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
          z-index: 9999; pointer-events: none;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
      }, i * 50);
    }
  }

  // ── Reset Day ──────────────────────────────────────────────────

  async resetDay(dayNumber: number) {
    if (!this.user) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: this.translate.instant('WORKOUT.RESET_DAY_TITLE'),
      text: this.translate.instant('WORKOUT.RESET_DAY_CONFIRM'),
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: this.translate.instant('WORKOUT.RESET_YES'),
      cancelButtonText: this.translate.instant('WORKOUT.RESET_NO')
    });

    if (result.isConfirmed) {
      try {
        await firstValueFrom(this.apiService.resetWorkoutDay(this.user._id, dayNumber));
        this.completedDays.delete(dayNumber);
        if (this.dayExercises[dayNumber]) {
          this.dayExercises[dayNumber].forEach(e => e.completed = false);
        }
        if (this.selectedDay === dayNumber) await this.loadDay(dayNumber);

        const stats = await firstValueFrom(this.apiService.getWorkoutStats(this.user._id));
        this.stateService.setWorkoutStats(stats);
        this.cdr.detectChanges();

        Swal.fire({
          icon: 'success',
          title: this.translate.instant('WORKOUT.DAY_RESET'),
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Reset error:', error);
      }
    }
  }

  // ── Refresh Stats ──────────────────────────────────────────────

  async refreshUserStats() {
    if (!this.user) return;
    try {
      const [stats, profile] = await Promise.all([
        firstValueFrom(this.apiService.getWorkoutStats(this.user._id)),
        firstValueFrom(this.apiService.getUserProfile(this.user._id))
      ]);
      this.stateService.setWorkoutStats(stats);
      this.stateService.notifyProfileUpdated(profile);
    } catch (e) {
      console.error('Error refreshing stats:', e);
    }
  }

  // ── Exercise Details Modal ─────────────────────────────────────

  async showExerciseDetails(exercise: WorkoutExercise) {
    const ar = this.isArabic;
    const name = ar ? ((exercise as any).name_ar || exercise.name) : exercise.name;
    const instructions = ar ? ((exercise as any).instructions_ar || exercise.instructions) : exercise.instructions;
    const tips = ar ? ((exercise as any).tips_ar || exercise.tips) : exercise.tips;
    const imgUrl = exercise.gifUrl || getExerciseImage(exercise);

    Swal.fire({
      title: name,
      html: `
        ${imgUrl ? `<img src="${imgUrl}" alt="${name}"
          style="width:100%;max-width:280px;border-radius:12px;margin:10px auto;display:block;object-fit:cover"
          onerror="this.style.display='none'">` : ''}
        <div style="text-align:${ar ? 'right' : 'left'};direction:${ar ? 'rtl' : 'ltr'};padding:0 8px">
          <p style="margin:6px 0"><strong>${ar ? 'المجموعات' : 'Sets'}:</strong> ${exercise.sets}</p>
          <p style="margin:6px 0"><strong>${ar ? 'التكرارات' : 'Reps'}:</strong> ${exercise.reps}</p>
          <p style="margin:6px 0"><strong>${ar ? 'وقت الراحة' : 'Rest'}:</strong> ${exercise.restTime}s</p>
          ${instructions?.length ? `
            <hr style="opacity:0.2;margin:12px 0">
            <h6 style="color:var(--primary);margin-bottom:8px">${ar ? 'التعليمات' : 'Instructions'}:</h6>
            <ul style="padding-${ar ? 'right' : 'left'}:18px;margin:0">
              ${instructions.map((i: string) => `<li style="margin-bottom:4px">${i}</li>`).join('')}
            </ul>` : ''}
          ${tips?.length ? `
            <hr style="opacity:0.2;margin:12px 0">
            <h6 style="color:var(--primary);margin-bottom:8px">${ar ? 'نصائح' : 'Tips'}:</h6>
            <ul style="padding-${ar ? 'right' : 'left'}:18px;margin:0">
              ${tips.map((t: string) => `<li style="margin-bottom:4px">${t}</li>`).join('')}
            </ul>` : ''}
        </div>
      `,
      confirmButtonColor: '#ffc107',
      width: '560px'
    });
  }

  // ── Helper: exercise name respects active language ─────────────
  getExerciseName(exercise: WorkoutExercise): string {
    return this.isArabic ? ((exercise as any).name_ar || exercise.name) : exercise.name;
  }

  // ── Helpers ────────────────────────────────────────────────────

  hasExercises(day: number): boolean {
    return !!(this.dayExercises[day]?.length);
  }

  getCompletedCount(day: number): number {
    return this.dayExercises[day]?.filter(e => e.completed).length || 0;
  }

  getTotalCount(day: number): number {
    return this.dayExercises[day]?.length || 0;
  }

  updateProgress() {
    this.progressPercentage = this.totalExercises > 0
      ? (this.completedExercises / this.totalExercises) * 100
      : 0;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  clearRestTimer() {
    this.restSub?.unsubscribe();
    this.restSub = undefined;
  }

  clearAllTimers() {
    this.timerSub?.unsubscribe();
    this.timerSub = undefined;
    this.clearRestTimer();
  }
}
