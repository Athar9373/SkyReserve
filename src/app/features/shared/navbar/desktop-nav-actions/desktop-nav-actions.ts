import { Component, input, model } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideHeart, lucideLuggage, lucideShieldCheck } from "@ng-icons/lucide";
import { Avatar } from "../avtaar/avtaar";

@Component({
  imports: [NgIcon, Avatar, RouterLink],
  providers: [provideIcons({ lucideHeart, lucideLuggage, lucideShieldCheck })],
  selector: "app-desktop-nav-actions",
  templateUrl: "desktop-nav-actions.html",
})
export class DesktopNavActions {
  isLoggedIn = input.required<boolean>();
  isAdmin = input<boolean>(false);
  showLoginModel = model.required<boolean>();
}
