export interface Exercise {
  id: string;
  name: string;
  name_ar?: string;
  category: 'abs' | 'legs' | 'full-body' | 'all';
  description: string;
  description_ar?: string;
  imageUrl?: string;
  videoUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  defaultSets: number;
  defaultReps: number | string;
  caloriesPerSet?: number;
  instructions?: string[];
  instructions_ar?: string[];
  tips?: string[];
  tips_ar?: string[];
  muscles?: string[];
  muscles_ar?: string[];
}

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weight?: number;
  completed: boolean;
  completedAt?: Date;
}

export interface DailyExercise {
  exercise_id: string;
  exercise_name: string;
  exercise?: Exercise;
  sets: number;
  reps: number | string;
  completed: boolean;
  completed_at?: Date;
  notes?: string;
}
