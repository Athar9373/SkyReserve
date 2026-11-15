import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { loginFormType, authResponse, signupFormType, authError } from './model/AuthTypes';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/public/auth`;

  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<authError['validationErrors']>(null);
  readonly isLoggedIn = signal<boolean>(false);
  readonly showLoginModal = signal<boolean>(false);
  readonly showSignUpModal = signal<boolean>(false);
  readonly showForgotPasswordModal = signal<boolean>(false);
  readonly userInfo = signal<authResponse | null>(null);

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
      try {
        const savedSession = JSON.parse(savedUser) as authResponse;
        if (typeof savedSession.token === 'string' && savedSession.token.trim()) {
          this.userInfo.set(savedSession);
          this.isLoggedIn.set(true);
        } else {
          this.Logout();
        }
      } catch {
        this.Logout();
      }
    }
  }

  async Login(loginFormData: loginFormType): Promise<void> {
    this.errorMessage.set(null);
    this.validationErrors.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<authResponse>(`${this.API_URL}/login`, loginFormData),
      );

      if (!response.token?.trim()) {
        throw new Error('Login response did not include an access token.');
      }

      localStorage.setItem('user_info', JSON.stringify(response));
      this.userInfo.set(response);
      this.isLoggedIn.set(true);
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Login failed. Please try again.');
      this.errorMessage.set(msg);
      throw err;
    }
  }

  async Signup(signupFormData: signupFormType): Promise<void> {
    this.errorMessage.set(null);
    this.validationErrors.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<authResponse>(`${this.API_URL}/register`, signupFormData),
      );

      localStorage.setItem('user_info', JSON.stringify(response));
      this.userInfo.set(response);
      this.isLoggedIn.set(true);
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Registration failed. Please try again.');
      this.errorMessage.set(msg);
      throw err;
    }
  }

  Logout(): void {
    localStorage.removeItem('user_info');
    this.userInfo.set(null);
    this.isLoggedIn.set(false);
  }

  private extractErrorMessage(err: unknown, fallbackMessage: string): string {
    if (err instanceof HttpErrorResponse) {
      const backendError = err.error as authError | undefined;

      if (backendError) {
        if (backendError.validationErrors) {
          this.validationErrors.set(backendError.validationErrors);
        }
        if (backendError.message && backendError.message.trim().length > 0) {
          return backendError.message;
        }
        if (backendError.error && backendError.error.trim().length > 0) {
          return backendError.error;
        }
      }
    } else if (err instanceof Error && err.message) {
      return err.message;
    }

    return fallbackMessage;
  }
}
