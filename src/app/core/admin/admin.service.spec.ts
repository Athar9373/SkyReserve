import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from './admin.service';
import { authInterceptor } from '../../auth.interceptor';
import { environment } from '../../../environments/environment';

describe('AdminService', () => {
  let service: AdminService;
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
    localStorage.setItem(
      'user_info',
      JSON.stringify({ token: 'admin-token', role: 'ADMIN', userId: 1 }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AdminService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem('user_info');
  });

  it('loads the public user list using the bearer token', async () => {
    const resultPromise = service.getUsers();
    const request = httpTesting.expectOne(`${environment.apiUrl}/admin/users`);

    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer admin-token');
    expect(request.request.headers.has('user_Id')).toBe(false);
    request.flush([
      {
        userId: 4,
        firstName: 'Ari',
        lastName: 'Patel',
        email: 'ari@example.com',
        phoneNumber: '1234567890',
        role: 'USER',
      },
    ]);

    await expect(resultPromise).resolves.toHaveLength(1);
  });

  it('deletes one user and creates a flight with airport codes', async () => {
    const deletion = service.deleteUser(4);
    const deleteRequest = httpTesting.expectOne(`${environment.apiUrl}/admin/users/4`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null, { status: 204, statusText: 'No Content' });
    await expect(deletion).resolves.toBeNull();

    const payload = {
      flightNum: 'AI-852',
      airlineCode: 'AI',
      airlineName: 'Air India',
      sourceAirport: { airportCode: 'PNQ' },
      destAirport: { airportCode: 'DEL' },
      departureTime: '2026-10-20T09:00:00.000Z',
      arrivalTime: '2026-10-20T11:15:00.000Z',
      durationMinutes: 135,
      price: 5400,
    };
    const creation = service.addFlight(payload);
    const createRequest = httpTesting.expectOne(`${environment.apiUrl}/admin/flights`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(payload);
    expect(createRequest.request.headers.get('Authorization')).toBe('Bearer admin-token');
    createRequest.flush({ flightId: 51, ...payload });
    await expect(creation).resolves.toMatchObject({ flightId: 51 });
  });

  it('loads booking and flight management data and includes admin cancellation reason', async () => {
    const bookingsPromise = service.getBookings();
    const bookingsRequest = httpTesting.expectOne(`${environment.apiUrl}/admin/bookings`);
    bookingsRequest.flush([]);
    await expect(bookingsPromise).resolves.toEqual([]);

    const flightsPromise = service.getFlights();
    const flightsRequest = httpTesting.expectOne(`${environment.apiUrl}/admin/flights`);
    flightsRequest.flush([]);
    await expect(flightsPromise).resolves.toEqual([]);

    const cancellation = service.cancelBooking(9, 'Schedule change', [20]);
    const cancelRequest = httpTesting.expectOne(`${environment.apiUrl}/admin/bookings/9/cancel`);
    expect(cancelRequest.request.body).toEqual({
      reason: 'Schedule change',
      ticketIds: [20],
    });
    expect(cancelRequest.request.headers.get('Authorization')).toBe('Bearer admin-token');
    cancelRequest.flush({
      refundAmount: 5400,
      refundStatus: 'PENDING',
      cancelledTickets: [{ ticketId: 20, status: 'CANCELLED' }],
    });
    await expect(cancellation).resolves.toMatchObject({ refundAmount: 5400 });
  });

  it('provides useful errors for common admin API statuses', () => {
    expect(
      service.getErrorMessage(new HttpErrorResponse({ status: 401 }), 'fallback'),
    ).toContain('session has expired');
    expect(
      service.getErrorMessage(new HttpErrorResponse({ status: 409 }), 'fallback'),
    ).toContain('conflicts');
    expect(
      service.getErrorMessage(
        new HttpErrorResponse({ status: 403, error: { message: 'Admin only' } }),
        'fallback',
      ),
    ).toBe('Admin only');
    expect(
      service.getErrorMessage(new HttpErrorResponse({ status: 400 }), 'fallback'),
    ).toContain('request is invalid');
    expect(
      service.getErrorMessage(new HttpErrorResponse({ status: 404 }), 'fallback'),
    ).toContain('not found');
  });
});
