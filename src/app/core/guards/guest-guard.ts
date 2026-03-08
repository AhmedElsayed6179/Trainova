import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

export const GuestGuard: CanActivateFn = () => {
  const apiService = inject(ApiService);
  const router = inject(Router);

  if (!apiService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
