import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  const sessionStorage = new Map<string, string>();
  const storage = {
    getItem: (key: string) => sessionStorage.get(key) ?? null,
    setItem: (key: string, value: string) => sessionStorage.set(key, value),
    removeItem: (key: string) => sessionStorage.delete(key),
    clear: () => sessionStorage.clear(),
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    localStorage.removeItem('user_info');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem('user_info');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('stores the login role and bearer token in the session', async () => {
    const login = service.Login({ email: 'admin@example.com', password: 'secret' });
    const request = httpTesting.expectOne(`${environment.apiUrl}/public/auth/login`);
    expect(request.request.method).toBe('POST');
    request.flush({
      userId: 1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      phoneNumber: '1234567890',
      role: 'ADMIN',
      token: 'access-token',
    });

    await login;

    expect(service.isLoggedIn()).toBe(true);
    expect(service.userInfo()?.role).toBe('ADMIN');
    expect(service.userInfo()?.token).toBe('access-token');
    expect(JSON.parse(localStorage.getItem('user_info') ?? '{}').token).toBe('access-token');
  });
});
