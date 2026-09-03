import { inject, Service, signal } from "@angular/core";
import {
  loginFormType,
  authResponse,
  signupFormType,
  authError,
} from "./model/AuthTypes";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = "http://localhost:8080/au";

  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<authError["validationErrors"]>(null);
  readonly isLoggedIn = signal<boolean>(false);
  readonly showLoginModal = signal<boolean>(false);
  readonly showSignUpModal = signal<boolean>(false);
  readonly showForgotPasswordModal = signal<boolean>(false);

  async Login(loginFormData: loginFormType): Promise<void> {
    this.errorMessage.set(null);
    this.validationErrors.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<authResponse>(`${this.API_URL}/login`, loginFormData),
      );
      console.log("Login successful:", response);
      this.isLoggedIn.set(true);
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(
        err,
        "Login failed. Please try again.",
      );
      this.errorMessage.set(msg);
      throw err;
    }
  }

  async Signup(signupFormData: signupFormType): Promise<void> {
    this.errorMessage.set(null);
    this.validationErrors.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<authResponse>(`${this.API_URL}/signup`, signupFormData),
      );
      console.log("Signup successful:", response);
      this.isLoggedIn.set(true);
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(
        err,
        "Registration failed. Please try again.",
      );
      this.errorMessage.set(msg);
      throw err;
    }
  }

  Logout(): void {
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
