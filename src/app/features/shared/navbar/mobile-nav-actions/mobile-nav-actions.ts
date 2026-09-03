import { Component, input, model } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideHeart, lucideLuggage } from "@ng-icons/lucide";

@Component({
  imports: [NgIcon, RouterLink],
  providers: [provideIcons({ lucideHeart, lucideLuggage })],
  selector: "app-mobile-nav-actions",
  styleUrl: "./mobile-nav-actions.css",
  templateUrl: "mobile-nav-actions.html",
})
export class MobileNavActions {
  isLoggedIn = input.required<boolean>();
  showLoginModel = model.required<boolean>();
  isMobileMenuOpen = model.required<boolean>();

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  openLoginFromMobile(): void {
    this.closeMobileMenu();
    this.showLoginModel.set(true);
  }
}
