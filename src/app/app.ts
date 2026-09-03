import { Component, inject, signal } from "@angular/core";
import { LoginDialog } from "./features/auth/login-dialog/login-dialog";
import { SignUpDialog } from "./features/auth/sign-up-dialog/sign-up-dialog";
import { HlmToasterImports } from "@spartan-ng/helm/sonner";
import { RouterOutlet } from "@angular/router";
import { AuthService } from "./core/auth/auth";

@Component({
  selector: "app-root",
  imports: [LoginDialog, SignUpDialog, HlmToasterImports, RouterOutlet],
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
