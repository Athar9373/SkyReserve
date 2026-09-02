import { Component, inject, signal } from "@angular/core";
import { Auth } from "./core/auth/auth";
import { LoginDialog } from "./features/auth/login-dialog/login-dialog";
import { SignUpDialog } from "./features/auth/sign-up-dialog/sign-up-dialog";
import { Navbar } from "./features/shared/navbar/navbar";

@Component({
  selector: "app-root",
  imports: [Navbar, LoginDialog, SignUpDialog],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  protected readonly title = signal("SkyReserve");
  AuthService = inject(Auth);
  readonly isLoggedIn = this.AuthService.isLoggedIn;
  readonly showLoginModal = this.AuthService.showLoginModal;
  readonly showSignUpModal = this.AuthService.showSignUpModal;
}
