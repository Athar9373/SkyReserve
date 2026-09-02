import { Component, inject, signal } from "@angular/core";
import { Navbar } from "../shared/components/navbar/navbar";
import { Auth } from "./core/auth/auth";
import { LoginDialog } from "./features/auth/login-dialog/login-dialog";

@Component({
  selector: "app-root",
  imports: [Navbar, LoginDialog],
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
