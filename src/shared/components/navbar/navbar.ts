import { NgOptimizedImage } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from './avtaar/avtaar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeart, lucideLuggage, lucideMenu, lucideX } from '@ng-icons/lucide';
import { Auth } from '../../../app/core/auth/auth';
import { DesktopNavActions } from './desktop-nav-actions/desktop-nav-actions';
import { MobileNavActions } from './mobile-nav-actions/mobile-nav-actions';

@Component({
  imports: [RouterLink, Avatar, NgIcon, NgOptimizedImage, DesktopNavActions, MobileNavActions],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  providers: [provideIcons({ lucideHeart, lucideLuggage, lucideMenu, lucideX })],
  templateUrl: './navbar.html',
})
export class Navbar {
  private readonly auth = inject(Auth);

  showLoginModel = this.auth.showLoginModal;
  isLoggedIn = this.auth.isLoggedIn();
  isHidden = input();
  isMobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((val) => !val);
  }
}
