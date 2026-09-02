import { inject, Service, signal } from "@angular/core";
import {
  AuthResponse,
  LoginFormType,
  ResetPasswordType,
  SignupFormType,
} from "./model/AuthTypes";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

@Service()
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly API_URL = "http://localhost:8080";

  readonly errorMessage = signal<string | null>("");
  isLoggedIn = signal<boolean>(false);
  showLoginModal = signal<boolean>(false);
  showSignUpModal = signal<boolean>(false);
  showForgotPasswordModal = signal<boolean>(false);

  async Login(loginFormData: LoginFormType): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/login`, loginFormData),
      );
      console.log("Login successful:", response);
      this.isLoggedIn.set(true);
    } catch (err: unknown) {
      this.handleError(err, "Login failed. Please try again.");
      throw err;
    }
  }

  async Signup(signupFormData: SignupFormType): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/signup`, signupFormData),
      );

      console.log("Signup successful:", response);
      this.isLoggedIn.set(true);
    } catch (err: unknown) {
      this.handleError(err, "Registration failed. Please try again.");
      throw err;
    }
  }

  private handleError(err: unknown, fallbackMessage: string): void {
    if (err instanceof HttpErrorResponse) {
      const backendMsg = err.error?.message || err.error || fallbackMessage;
      this.errorMessage.set(
        typeof backendMsg === "string" ? backendMsg : fallbackMessage,
      );
    } else if (err instanceof Error) {
      this.errorMessage.set(err.message);
    } else {
      this.errorMessage.set("An unexpected error occurred.");
    }
  }

  Logout(): void {
    this.isLoggedIn.set(false);
  }

  async ResetPassword(resetData: ResetPasswordType): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(
          `${this.API_URL}/reset-password`,
          resetData,
        ),
      );
      console.log("Password reset successful:", response);
    } catch (err: unknown) {
      this.handleError(err, "Password reset failed. Please try again.");
      throw err;
    }
  }
}
