import { DailyExercise } from "./exercise";

export interface DailyWorkout {
daynumber: any;
  _id: string;
  user_id: string;
  date: Date;
  exercises: DailyExercise[];
  total_completed: number;
  total_exercises: number;
  completed: boolean;
  duration?: number;
  calories_burned?: number;
  notes?: string;
}

export interface WorkoutHistory {
  _id: string;
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  category: string;
  sets: number;
  reps: number;
  duration?: number;
  calories_burned?: number;
  completed_at: Date;
}

export interface WorkoutStats {
  total_workouts: number;
  total_exercises: number;
  total_calories: number;
  total_duration: number;
  average_per_day: number;
  best_streak: number;
  current_streak: number;
  weekly_stats: { day: string; count: number }[];
  category_stats: { category: string; count: number }[];
  recent_workouts?: RecentWorkout[];
}

export interface WeeklyProgress {
  day: string;
  count: number;
  date: Date;
}

export interface CategoryDistribution {
  [category: string]: number;
}

export interface RecentWorkout {
  exercise_name: string;
  completed_at: Date | string;
  category?: string;
  sets?: number;
  reps?: number;
}

export interface WorkoutDay {
  dayNumber: number;
  date: Date;
  completed: boolean;
  exercises: WorkoutExercise[];
  totalExercises: number;
  completedExercises: number;
  duration?: number;
  caloriesBurned?: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  name_ar?: string;
  category: string;
  sets: number;
  reps: number | string;
  restTime: number;
  gifUrl?: string;
  videoUrl?: string;
  instructions?: string[];
  instructions_ar?: string[];
  tips?: string[];
  tips_ar?: string[];
  completed: boolean;
  completedSets?: {
    setNumber: number;
    reps: number;
    completedAt: Date;
  }[];
}

export interface WorkoutPlan {
  userId: string;
  startDate: Date;
  currentDay: number;
  days: WorkoutDay[];
  totalDays: number;
  completedDays: number;
}

export interface WorkoutSession {
  _id: string;
  userId: string;
  dayNumber: number;
  startTime: Date;
  endTime?: Date;
  exercises: WorkoutExercise[];
  completed: boolean;
  duration?: number;
  caloriesBurned?: number;
}
