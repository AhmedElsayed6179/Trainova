export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  phone: string;
  goal: 'abs' | 'legs' | 'full-body' | 'all';
  profileImage?: string | null;
  completed_days: number;
  total_workouts: number;
  current_streak: number;
  last_workout_date?: Date;
  created_at: Date;
}

export interface UserStats {
  completed_days: number;
  total_workouts: number;
  current_streak: number;
  monthly: number;
  weekly: number;
  goal: string;
  byCategory?: { [key: string]: number };
  recentWorkouts?: any[];
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: User;
  token?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
  userId?: string;
  user?: User;
  token?: string;
}

export interface CheckResponse {
  exists: boolean;
}

export interface UploadImageResponse {
  success: boolean;
  imageUrl: string;
  user: User;
}

export interface UpdateProfileResponse {
  success: boolean;
  user: User;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}
