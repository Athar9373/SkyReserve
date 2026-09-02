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

  // General & Modal State Signals
  readonly errorMessage = signal<string | null>(null);
  readonly isLoggedIn = signal<boolean>(false);
  readonly showLoginModal = signal<boolean>(false);
  readonly showSignUpModal = signal<boolean>(false);
  readonly showForgotPasswordModal = signal<boolean>(false);

  // Granular Error State Signals for fine-grained UI error handling
  readonly sendOtpError = signal<string | null>(null);
  readonly verifyOtpError = signal<string | null>(null);
  readonly resetPasswordError = signal<string | null>(null);

  async Login(loginFormData: LoginFormType): Promise<void> {
    this.errorMessage.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/login`, loginFormData),
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

  async Signup(signupFormData: SignupFormType): Promise<void> {
    this.errorMessage.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/signup`, signupFormData),
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

  async SendOtp(email: string): Promise<void> {
    this.sendOtpError.set(null);
    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/send-otp`, { email }),
      );
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(
        err,
        "Failed to send OTP. Please try again.",
      );
      this.sendOtpError.set(msg);
      throw err;
    }
  }

  async VerifyOtp(otpData: { email: string; otp: string }): Promise<void> {
    this.verifyOtpError.set(null);
    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/verify-otp`, otpData),
      );
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(
        err,
        "Invalid or expired verification code.",
      );
      this.verifyOtpError.set(msg);
      throw err;
    }
  }

  async ResetPassword(resetData: ResetPasswordType): Promise<void> {
    this.resetPasswordError.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(
          `${this.API_URL}/reset-password`,
          resetData,
        ),
      );
      console.log("Password reset successful:", response);
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(
        err,
        "Password reset failed. Please try again.",
      );
      this.resetPasswordError.set(msg);
      throw err;
    }
  }

  Logout(): void {
    this.isLoggedIn.set(false);
  }
  private extractErrorMessage(err: unknown, fallbackMessage: string): string {
    if (err instanceof HttpErrorResponse) {
      const backendMsg = err.error?.message || err.error;
      if (typeof backendMsg === "string" && backendMsg.trim().length > 0) {
        return backendMsg;
      }
    } else if (err instanceof Error && err.message) {
      return err.message;
    }
    return fallbackMessage;
  }
}
