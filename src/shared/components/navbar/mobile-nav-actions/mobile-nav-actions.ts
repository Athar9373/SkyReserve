import { Component, input, model, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  imports: [NgIcon],
  selector: 'app-mobile-nav-actions',
  styleUrl: './mobile-nav-actions.css',
  template: `
    <!-- Mobile Dropdown Menu -->
    @if (isMobileMenuOpen()) {
      <div
        class="md:hidden max-w-7xl mx-auto w-[95%] bg-black/90 rounded-xl mt-1 p-4 flex flex-col gap-4 border border-white/10 shadow-xl backdrop-blur-md"
      >
        <a
          routerLink="/mytrip"
          (click)="closeMobileMenu()"
          class="flex items-center gap-3 text-white hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white/10"
        >
          <div
            class="bg-white/20 rounded-full w-8 h-8 p-1 flex items-center justify-center shrink-0"
          >
            <ng-icon
              name="lucideLuggage"
              class="text-gray-700 [&>svg]:fill-yellow-500 [&>svg]:stroke-gray-700"
              size="20"
            />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-semibold">My Trips</span>
            <span class="text-xs text-white/70">Manage Your Bookings</span>
          </div>
        </a>

        <a
          routerLink="wishlist"
          (click)="closeMobileMenu()"
          class="flex items-center gap-3 text-white hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white/10"
        >
          <div
            class="bg-white/20 rounded-full w-8 h-8 p-1 flex items-center justify-center shrink-0"
          >
            <ng-icon
              name="lucideHeart"
              class="text-red-500 [&>svg]:fill-red-500 [&>svg]:stroke-red-500"
            />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-semibold">Wishlist</span>
            <span class="text-xs text-white/70">Save favourites</span>
          </div>
        </a>

        @if (!isLoggedIn()) {
          <button
            hlmBtn
            variant="outline"
            size="lg"
            (click)="openLoginFromMobile()"
            class="w-full text-white active:scale-[0.98] text-xs flex justify-center items-center cursor-pointer py-2.5 border-0 font-bold rounded-xl bg-linear-to-r from-blue-400 to-blue-600 hover:opacity-90 transition-opacity"
          >
            Login or Create Account
          </button>
        }
      </div>
    }
  `,
})
export class MobileNavActions {
  isLoggedIn = input.required<boolean>();
  showLoginModel = model.required<boolean>();
  isMobileMenuOpen = model.required<boolean>();

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((val) => !val);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  openLoginFromMobile(): void {
    this.closeMobileMenu();
    this.showLoginModel.set(true);
  }
}
