import { NgOptimizedImage } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeart, lucideLuggage, lucideMenu, lucideX } from '@ng-icons/lucide';
import { Avatar } from './avtaar/avtaar';
import { DesktopNavActions } from './desktop-nav-actions/desktop-nav-actions';
import { MobileNavActions } from './mobile-nav-actions/mobile-nav-actions';
import { AuthService } from '../../../core/auth/auth';
import { HlmSkeleton } from '../../../../../shared/skeleton/src';

@Component({
  imports: [
    RouterLink,
    Avatar,
    NgIcon,
    NgOptimizedImage,
    DesktopNavActions,
    MobileNavActions,
    HlmSkeleton,
  ],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  providers: [provideIcons({ lucideHeart, lucideLuggage, lucideMenu, lucideX })],
  templateUrl: './navbar.html',
})
export class Navbar {
  private readonly auth = inject(AuthService);

  showLoginModel = this.auth.showLoginModal;
  isLoggedIn = this.auth.isLoggedIn;
  isAdmin = () => this.auth.userInfo()?.role === 'ADMIN';
  isHidden = input<boolean>(false);
  isMobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((val) => !val);
  }
}
