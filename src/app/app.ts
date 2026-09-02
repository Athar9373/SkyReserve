import { Component, inject, signal, ViewContainerRef } from "@angular/core";
import { Auth } from "./core/auth/auth";
import { LoginDialog } from "./features/auth/login-dialog/login-dialog";
import { SignUpDialog } from "./features/auth/sign-up-dialog/sign-up-dialog";
import { HlmToasterImports } from "@spartan-ng/helm/sonner";
import { ResetPassword } from "./features/auth/reset-password/reset-password";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  imports: [
    LoginDialog,
    SignUpDialog,
    HlmToasterImports,
    ResetPassword,
    RouterOutlet,
    RouterOutlet,
  ],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  protected readonly title = signal("SkyReserve ");
  AuthService = inject(Auth);
  readonly isLoggedIn = this.AuthService.isLoggedIn;
  readonly showLoginModal = this.AuthService.showLoginModal;
  readonly showSignUpModal = this.AuthService.showSignUpModal;
  readonly showPassModal = this.AuthService.showForgotPasswordModal;
}
