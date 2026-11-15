import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { lucideLogOut, lucideSettings, lucideUser } from '@ng-icons/lucide';
import { HlmAvatarImports } from '../../../../../../shared/avatar/src';
import { HlmButtonImports } from '../../../../../../shared/button/src';
import { HlmDropdownMenuImports } from '../../../../../../shared/dropdown-menu/src';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth';

@Component({
  selector: 'spartan-avatar',
  imports: [HlmAvatarImports, HlmDropdownMenuImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideUser, lucideSettings, lucideLogOut })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'avtaar.html',
})
export class Avatar {
  authService = inject(AuthService);
  private router = inject(Router);

  Profile() {
    this.router.navigate(['/profile']);
  }

  Settings() {
    this.router.navigate(['/settings']);
  }

  Logout() {
    this.authService.Logout();
  }
}
