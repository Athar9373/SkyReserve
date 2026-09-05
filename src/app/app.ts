import { Component, inject, signal } from "@angular/core";
import { LoginDialog } from "./features/auth/login-dialog/login-dialog";
import { SignUpDialog } from "./features/auth/sign-up-dialog/sign-up-dialog";
import { RouterOutlet } from "@angular/router";
import { AuthService } from "./core/auth/auth";
import { HlmToaster, HlmToasterImports } from "../shared/sonner/src";

@Component({
  selector: "app-root",
  imports: [
    LoginDialog,
    SignUpDialog,
    HlmToasterImports,
    RouterOutlet,
    HlmToaster,
  ],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  protected readonly title = signal("SkyReserve ");
  AuthService = inject(AuthService);
  readonly isLoggedIn = this.AuthService.isLoggedIn;
  readonly showLoginModal = this.AuthService.showLoginModal;
  readonly showSignUpModal = this.AuthService.showSignUpModal;
  readonly showPassModal = this.AuthService.showForgotPasswordModal;
}
