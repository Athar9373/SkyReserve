import { inject, Service, signal } from "@angular/core";
import { AuthResponse, LoginFormType, SignupFormType } from "./model/AuthTypes";
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
      if (err instanceof HttpErrorResponse) {
        const backendMsg =
          err.error?.message || err.error || "Login failed. Please try again.";

        this.errorMessage.set(
          typeof backendMsg === "string" ? backendMsg : "Invalid credentials.",
        );
      } else if (err instanceof Error) {
        this.errorMessage.set(err.message);
      } else {
        this.errorMessage.set("An unexpected error occurred.");
      }
      throw err;
    }
  }

  Logout() {}
  Signup(SignupformData: SignupFormType) {
    console.log(SignupformData);
  }
}
