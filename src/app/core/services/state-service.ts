import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user-profile';
import { WorkoutPlan, WorkoutStats } from '../models/daily-workout';

export interface AppState {
  user: User | null;
  workoutPlan: WorkoutPlan | null;
  workoutStats: WorkoutStats | null;
  isLoading: boolean;
  lastUpdated: Date | null;
}

const initialState: AppState = {
  user: null,
  workoutPlan: null,
  workoutStats: null,
  isLoading: false,
  lastUpdated: null
};

@Injectable({ providedIn: 'root' })
export class StateService {

  private stateSubject = new BehaviorSubject<AppState>(initialState);
  public state$ = this.stateSubject.asObservable();

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  private workoutPlanSubject = new BehaviorSubject<WorkoutPlan | null>(null);
  public workoutPlan$ = this.workoutPlanSubject.asObservable();

  private workoutStatsSubject = new BehaviorSubject<WorkoutStats | null>(null);
  public workoutStats$ = this.workoutStatsSubject.asObservable();

  private dayCompletedSubject = new BehaviorSubject<number | null>(null);
  public dayCompleted$ = this.dayCompletedSubject.asObservable();

  private profileUpdatedSubject = new BehaviorSubject<boolean>(false);
  public profileUpdated$ = this.profileUpdatedSubject.asObservable();

  private goalChangedSubject = new BehaviorSubject<string | null>(null);
  public goalChanged$ = this.goalChangedSubject.asObservable();

  private imageUpdatedSubject = new BehaviorSubject<string | null>(null);
  public imageUpdated$ = this.imageUpdatedSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();

    window.addEventListener('storage', (event) => {
      if (event.key === 'currentUser') {
        if (event.newValue) {
          try {
            const user = JSON.parse(event.newValue) as User;
            this.userSubject.next(user);
            this.updateState({ user });
          } catch { }
        } else {
          this.userSubject.next(null);
          this.updateState({ user: null });
        }
      }
    });
  }

  private loadUserFromStorage(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        this.setUser(user);
      } catch { }
    }
  }

  // ── USER ──────────────────────────────────────────────

  getUser(): User | null {
    return this.userSubject.getValue();
  }

  setUser(user: User | null): void {
    this.userSubject.next(user);
    this.updateState({ user });
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }

  updateUser(partialUser: Partial<User>): void {
    const current = this.getUser();
    if (!current) return;
    const updated = { ...current, ...partialUser };
    this.setUser(updated);
  }

  // ── WORKOUT PLAN ──────────────────────────────────────

  getWorkoutPlan(): WorkoutPlan | null {
    return this.workoutPlanSubject.getValue();
  }

  setWorkoutPlan(plan: WorkoutPlan | null): void {
    this.workoutPlanSubject.next(plan);
    this.updateState({ workoutPlan: plan });
  }

  // ── WORKOUT STATS ─────────────────────────────────────

  getWorkoutStats(): WorkoutStats | null {
    return this.workoutStatsSubject.getValue();
  }

  setWorkoutStats(stats: WorkoutStats | null): void {
    this.workoutStatsSubject.next(stats);
    this.updateState({ workoutStats: stats });
  }

  // ── EVENTS / NOTIFICATIONS ────────────────────────────

  notifyDayCompleted(dayNumber: number): void {
    console.log(`📢 Day ${dayNumber} completed`);
    this.dayCompletedSubject.next(dayNumber);

    // Optimistically update user counters
    const user = this.getUser();
    if (user) {
      this.updateUser({
        completed_days: (user.completed_days || 0) + 1,
        total_workouts: (user.total_workouts || 0) + 1
      });
    }
  }

  notifyProfileUpdated(updatedUser: User): void {
    console.log(`📢 Profile updated`);
    this.setUser(updatedUser);
    this.profileUpdatedSubject.next(true);
    setTimeout(() => this.profileUpdatedSubject.next(false), 100);
  }

  /** Called when fitness goal changes → Workout regenerates plan */
  notifyGoalChanged(newGoal: string): void {
    console.log(`📢 Goal changed to ${newGoal}`);
    this.goalChangedSubject.next(newGoal);
    setTimeout(() => this.goalChangedSubject.next(null), 200);
  }

  notifyImageUpdated(imageUrl: string | null): void {
    this.imageUpdatedSubject.next(imageUrl);
    const user = this.getUser();
    if (user) {
      this.updateUser({ profileImage: imageUrl });
    }
  }

  notifyStreakUpdated(newStreak: number): void {
    const user = this.getUser();
    if (user) {
      this.updateUser({ current_streak: newStreak });
    }
  }

  // ── LOADING ───────────────────────────────────────────

  setLoading(loading: boolean): void {
    this.updateState({ isLoading: loading });
  }

  // ── LOGOUT ────────────────────────────────────────────

  clearState(): void {
    this.stateSubject.next(initialState);
    this.userSubject.next(null);
    this.workoutPlanSubject.next(null);
    this.workoutStatsSubject.next(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }

  private updateState(partial: Partial<AppState>): void {
    const current = this.stateSubject.getValue();
    this.stateSubject.next({ ...current, ...partial, lastUpdated: new Date() });
  }
}
