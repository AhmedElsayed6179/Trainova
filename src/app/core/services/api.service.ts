import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChangePasswordResponse, CheckResponse, LoginResponse, RegisterResponse, UpdateProfileResponse, UploadImageResponse, User, UserStats } from '../models/user-profile';
import { Exercise } from '../models/exercise';
import { CategoryDistribution, DailyWorkout, WeeklyProgress, WorkoutDay, WorkoutExercise, WorkoutPlan, WorkoutSession, WorkoutStats } from '../models/daily-workout';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = `${environment.apiUrl}`;
  private baseUrl = `${environment.baseUrl}`;

  constructor(private http: HttpClient) { }

  // ==================== Auth APIs ====================
  checkUsername(username: string): Observable<CheckResponse> {
    return this.http.post<CheckResponse>(`${this.apiUrl}/check-username`, { username });
  }

  checkEmail(email: string): Observable<CheckResponse> {
    return this.http.post<CheckResponse>(`${this.apiUrl}/check-email`, { email });
  }

  checkPhone(phone: string): Observable<CheckResponse> {
    return this.http.post<CheckResponse>(`${this.apiUrl}/check-phone`, { phone });
  }

  registerUser(userData: any): Observable<RegisterResponse> {
    const { confirmPassword, ...dataToSend } = userData;
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, dataToSend);
  }

  login(identifier: string, password: string, recaptchaToken: string = ''): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { identifier, password, recaptchaToken });
  }

  forgotPassword(identifier: string, lang: string = 'en', recaptchaToken: string = ''): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { identifier, lang, recaptchaToken });
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify-email?token=${token}`);
  }

  resendVerification(identifier: string, lang: string = 'en', recaptchaToken: string = ''): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification`, { identifier, lang, recaptchaToken });
  }

  resetPassword(token: string, newPassword: string, recaptchaToken: string = ''): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword, recaptchaToken });
  }

  changePassword(userId: string, passwordData: { currentPassword: string; newPassword: string }): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(`${this.apiUrl}/change-password/${userId}`, passwordData);
  }

  // ==================== Contact API ====================
  sendContactMessage(data: { name: string; email: string; subject: string; message: string; recaptchaToken: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/contact`, data);
  }

  // ==================== Profile APIs ====================
  getUserProfile(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile/${userId}`);
  }

  updateProfile(userId: string, data: Partial<User>): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(`${this.apiUrl}/profile/${userId}`, data);
  }

  uploadProfileImageFile(userId: string, file: File): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post<UploadImageResponse>(`${this.apiUrl}/profile/${userId}/upload-image`, formData);
  }

  deleteProfileImage(userId: string): Observable<UpdateProfileResponse> {
    return this.http.delete<UpdateProfileResponse>(`${this.apiUrl}/profile/${userId}/image`);
  }

  // ==================== Exercises APIs ====================
  getAllExercises(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`${this.apiUrl}/exercises`);
  }

  getExercisesByCategory(category: string): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`${this.apiUrl}/exercises/category/${category}`);
  }

  getExerciseById(exerciseId: string): Observable<Exercise> {
    return this.http.get<Exercise>(`${this.apiUrl}/exercises/${exerciseId}`);
  }

  // ==================== Workout APIs ====================
  getUserStats(userId: string): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/user/stats/${userId}`);
  }

  getWorkoutHistory(userId: string, period: 'week' | 'month' | 'year'): Observable<{ history: WorkoutSession[]; stats: any }> {
    return this.http.get<{ history: WorkoutSession[]; stats: any }>(`${this.apiUrl}/workout/history/${userId}?period=${period}`);
  }

  generateDailyWorkout(userId: string, category?: string): Observable<DailyWorkout> {
    return this.http.post<DailyWorkout>(`${this.apiUrl}/workout/generate/${userId}`, { category });
  }

  getTodaysWorkout(userId: string): Observable<DailyWorkout> {
    return this.http.get<DailyWorkout>(`${this.apiUrl}/workout/today/${userId}`);
  }

  getWorkoutStats(userId: string): Observable<WorkoutStats> {
    return this.http.get<WorkoutStats>(`${this.apiUrl}/workout/stats/${userId}`);
  }

  completeExercise(workoutId: string, exerciseId: string, setData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/workout/complete-exercise`, { workoutId, exerciseId, ...setData });
  }

  completeWorkout(workoutId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/workout/complete/${workoutId}`, {});
  }

  // ==================== 30 Days Workout Plan APIs ====================

  getWorkoutPlan(userId: string): Observable<WorkoutPlan> {
    return this.http.get<WorkoutPlan>(`${this.apiUrl}/workout/plan/${userId}`);
  }

  generateWorkoutPlan(userId: string, goal: string): Observable<WorkoutPlan> {
    return this.http.post<WorkoutPlan>(`${this.apiUrl}/workout/plan/generate/${userId}`, { goal });
  }

  getWorkoutDay(userId: string, dayNumber: number): Observable<{ day: WorkoutDay; exercises: WorkoutExercise[] }> {
    return this.http.get<{ day: WorkoutDay; exercises: WorkoutExercise[] }>(`${this.apiUrl}/workout/day/${userId}/${dayNumber}`);
  }

  completeExerciseInDay(userId: string, dayNumber: number, exerciseId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/workout/day/${userId}/${dayNumber}/exercise/${exerciseId}`, data);
  }

  completeWorkoutDay(userId: string, dayNumber: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/workout/day/${userId}/${dayNumber}/complete`, data);
  }

  resetWorkoutDay(userId: string, dayNumber: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/workout/day/${userId}/${dayNumber}/reset`, {});
  }

  navigateToDay(userId: string, dayNumber: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/workout/day/${userId}/${dayNumber}/navigate`, {});
  }

  updateWorkoutProgress(userId: string, dayNumber: number, progress: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/workout/progress/${userId}/${dayNumber}`, progress);
  }

  // ==================== Dashboard APIs ====================
  getDashboardStats(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/stats/${userId}`);
  }

  getWeeklyProgress(userId: string): Observable<WeeklyProgress[]> {
    return this.http.get<WeeklyProgress[]>(`${this.apiUrl}/dashboard/weekly/${userId}`);
  }

  getCategoryDistribution(userId: string): Observable<CategoryDistribution> {
    return this.http.get<CategoryDistribution>(`${this.apiUrl}/dashboard/categories/${userId}`);
  }

  // ==================== Test API ====================
  testConnection(): Observable<{ message: string; dbStatus: string }> {
    return this.http.get<{ message: string; dbStatus: string }>(`${this.apiUrl}/test`);
  }

  // ==================== Local Storage Helpers ====================
  getCurrentUser(): User | null {
    const user = localStorage.getItem('currentUser');
    if (!user) return null;
    try {
      return JSON.parse(user) as User;
    } catch {
      return null;
    }
  }

  updateUserData(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'currentUser',
      newValue: JSON.stringify(user)
    }));
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'currentUser',
      newValue: null
    }));
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getFullImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return 'assets/default-avatar.png';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return `${this.baseUrl}${imageUrl}`;
    if (imageUrl.startsWith('data:image')) return imageUrl;
    return `${this.baseUrl}/${imageUrl}`;
  }

  checkUserExists(identifier: string): Observable<{ exists: boolean }> {
    return this.http.post<{ exists: boolean }>(`${this.apiUrl}/check-user`, { identifier });
  }
}
