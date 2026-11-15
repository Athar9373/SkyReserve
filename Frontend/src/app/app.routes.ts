import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'booking',
    loadComponent: () => import('./features/booking/booking').then((m) => m.Booking),
    canActivate: [authGuard],
  },
  {
    path: 'booking-success',
    loadComponent: () =>
      import('./features/booking-success/booking-success').then((m) => m.BookingSuccessComponent),
    canActivate: [authGuard],
  },
  {
    path: 'mytrip',
    loadComponent: () => import('./features/my-trips/my-trips').then((m) => m.MyTripsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin').then((m) => m.AdminComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
