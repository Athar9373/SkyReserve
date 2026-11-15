import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth';
import { MyTrips } from './my-trips';
import { environment } from '../../../../environments/environment';

describe('MyTrips', () => {
  let service: MyTrips;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { Logout: vi.fn(), showLoginModal: { set: vi.fn() } },
        },
      ],
    });
    service = TestBed.inject(MyTrips);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('cancels only selected tickets and keeps the other passengers confirmed', async () => {
    service.myTrips.set([
      {
        bookingId: 10,
        pnr: 'ABC123',
        bookingDate: '2030-01-01T00:00:00.000Z',
        totalFare: 1000,
        status: 'CONFIRMED',
        flight: {
          flightNumber: 'FX-102',
          sourceAirportCode: 'PNQ',
          destAirportCode: 'DEL',
          departureTime: '2030-01-10T12:00:00.000Z',
          arrivalTime: '2030-01-10T14:00:00.000Z',
        },
        tickets: [
          { ticketId: 1, passengerName: 'Ari Patel', seatNumber: '1A', status: 'CONFIRMED' },
          { ticketId: 2, passengerName: 'Sam Lee', seatNumber: '1B', status: 'CONFIRMED' },
        ],
      },
    ]);

    const cancellation = service.cancelTickets(10, [1]);
    const request = httpTesting.expectOne(`${environment.apiUrl}/bookings/10/cancel`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ ticketIds: [1] });
    request.flush({
      bookingId: 10,
      status: 'CONFIRMED',
      cancelledTickets: [
        {
          ticketId: 1,
          passengerName: 'Ari Patel',
          seatNumber: '1A',
          status: 'CANCELLED',
          refundAmount: 500,
        },
      ],
      refundAmount: 500,
      cancellationFee: 0,
      refundStatus: 'PENDING',
      refundNotice: 'Refund request queued.',
    });

    await expect(cancellation).resolves.toBe(true);
    expect(service.myTrips()[0].status).toBe('CONFIRMED');
    expect(service.myTrips()[0].tickets.map((ticket) => ticket.status)).toEqual([
      'CANCELLED',
      'CONFIRMED',
    ]);
    expect(service.cancellationNotice()).toContain('500.00');
  });
});
