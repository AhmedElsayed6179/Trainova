import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Exercises } from './features/exercises/exercises';
import { Contact } from './features/contact/contact';
import { Privacy } from './features/privacy/privacy';
import { About } from './features/about/about';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ForgotPassword } from './features/auth/forgot-password/forgot-password';
import { Dashboard } from './features/dashboard/dashboard';
import { Workout } from './features/workout/workout';
import { Profile } from './features/profile/profile';
import { ExerciseCard } from './shared/components/exercise-card/exercise-card';
import { AuthGuard } from './core/guards/auth-guard';
import { GuestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },

  {
    path: 'exercises',
    component: Exercises
  },

  {
    path: 'contact',
    component: Contact
  },

  {
    path: 'privacy',
    component: Privacy
  },

  {
    path: 'about',
    component: About
  },

  {
    path: 'exercises/:category',
    component: ExerciseCard,
    canActivate: [AuthGuard]
  },

  {
    path: 'login',
    component: Login,
    canActivate: [GuestGuard]
  },

  {
    path: 'register',
    component: Register,
    canActivate: [GuestGuard]
  },

  {
    path: 'forgot-password',
    component: ForgotPassword,
    canActivate: [GuestGuard]
  },

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [AuthGuard]
  },

  {
    path: 'workout',
    component: Workout,
    canActivate: [AuthGuard]
  },

  {
    path: 'profile',
    component: Profile,
    canActivate: [AuthGuard]
  },

  // Fallback route
  {
    path: '**',
    redirectTo: ''
  }
];
