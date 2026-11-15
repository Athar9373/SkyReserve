import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    return true;
  }

  // User is not logged in
  authService.showLoginModal.set(true);

  return false;
};
