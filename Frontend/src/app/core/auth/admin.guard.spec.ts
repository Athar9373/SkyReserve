import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from './auth';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  it('allows a signed-in admin', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            userInfo: () => ({ role: 'ADMIN', token: 'token' }),
          },
        },
      ],
    });

    expect(
      TestBed.runInInjectionContext(() =>
        adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      ),
    ).toBe(true);
  });

  it('redirects a non-admin away from the admin route', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            userInfo: () => ({ role: 'USER', token: 'token' }),
          },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(result).toBeInstanceOf(UrlTree);
    if (result instanceof UrlTree) {
      expect(TestBed.inject(Router).serializeUrl(result)).toBe('/');
    }
  });
});
