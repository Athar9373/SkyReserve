import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../core/auth/auth';
import { AdminService, ManagedUser } from '../../core/admin/admin.service';
import { FlightService } from '../../core/api/flight/flightService';
import { Airport } from '../../core/api/flight/model/types';
import { AdminComponent } from './admin';

describe('AdminComponent', () => {
  let fixture: ComponentFixture<AdminComponent>;
  let component: AdminComponent;
  let adminService: {
    getUsers: ReturnType<typeof vi.fn>;
    getBookings: ReturnType<typeof vi.fn>;
    getFlights: ReturnType<typeof vi.fn>;
    getAnalytics: ReturnType<typeof vi.fn>;
    deleteUser: ReturnType<typeof vi.fn>;
    addFlight: ReturnType<typeof vi.fn>;
    cancelFlight: ReturnType<typeof vi.fn>;
    getErrorMessage: ReturnType<typeof vi.fn>;
  };
  let airports: Airport[];
  let flightService: {
    airports: ReturnType<typeof signal<Airport[]>>;
    fromCity: ReturnType<typeof signal<Airport | null>>;
    toCity: ReturnType<typeof signal<Airport | null>>;
    startDate: ReturnType<typeof signal<Date>>;
    totalCount: ReturnType<typeof signal<number>>;
    flightsError: ReturnType<typeof signal<string | null>>;
    flightsErrorStatus: ReturnType<typeof signal<number | null>>;
    fetchAirports: ReturnType<typeof vi.fn>;
    fetchFlightSearchResults: ReturnType<typeof vi.fn>;
  };
  let authService: {
    userInfo: ReturnType<typeof signal>;
    Logout: ReturnType<typeof vi.fn>;
    showLoginModal: ReturnType<typeof signal<boolean>>;
  };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };
  const managedUser: ManagedUser = {
    userId: 2,
    firstName: 'Sam',
    lastName: 'Lee',
    email: 'sam@example.com',
    phoneNumber: '1234567890',
    role: 'USER',
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    airports = [
      { airportCode: 'PNQ', city: 'Pune', country: 'India', name: 'Pune Airport' },
      { airportCode: 'DEL', city: 'Delhi', country: 'India', name: 'Delhi Airport' },
    ];
    adminService = {
      getUsers: vi.fn().mockResolvedValue([managedUser]),
      getBookings: vi.fn().mockResolvedValue([]),
      getFlights: vi.fn().mockResolvedValue([]),
      getAnalytics: vi.fn().mockResolvedValue({
        ticketSalesTrend: [],
        revenueByMonth: [],
        flightStatusDistribution: {},
        topRoutes: [],
      }),
      deleteUser: vi.fn().mockResolvedValue(undefined),
      addFlight: vi.fn().mockResolvedValue({
        flightId: 51,
        flightNum: 'AI-852',
        airlineCode: 'AI',
        airlineName: 'Air India',
        sourceAirport: airports[0],
        destAirport: airports[1],
        departureTime: '2026-10-20T09:00:00.000Z',
        arrivalTime: '2026-10-20T11:15:00.000Z',
        durationMinutes: 135,
        price: 5400,
      }),
      cancelFlight: vi.fn().mockResolvedValue({
        refundAmount: 0,
        refundStatus: 'NOT_APPLICABLE',
      }),
      getErrorMessage: vi.fn().mockReturnValue('API request failed'),
    };
    flightService = {
      airports: signal(airports),
      fromCity: signal(null),
      toCity: signal(null),
      startDate: signal(new Date()),
      totalCount: signal(1),
      flightsError: signal(null),
      flightsErrorStatus: signal(null),
      fetchAirports: vi.fn().mockResolvedValue(airports),
      fetchFlightSearchResults: vi.fn().mockResolvedValue([{ flightId: 51 }]),
    };
    authService = {
      userInfo: signal({
        userId: 1,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        phoneNumber: '1234567890',
        role: 'ADMIN',
        token: 'token',
      }),
      Logout: vi.fn(),
      showLoginModal: signal(false),
    };
    router = { navigateByUrl: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AdminService, useValue: adminService },
        { provide: FlightService, useValue: flightService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await component.loadUsers();
    fixture.detectChanges();
  });

  it('loads and renders the public user list', () => {
    expect(adminService.getUsers).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('sam@example.com');
    expect(fixture.nativeElement.textContent).toContain('1234567890');
  });

  it('confirms and deletes only the selected user with feedback', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await component.deleteUser(managedUser);

    expect(adminService.deleteUser).toHaveBeenCalledWith(2);
    expect(component.users()).toEqual([]);
    expect(component.userSuccess()).toContain('Sam Lee was deleted');
  });

  it('prevents deleting any administrator account', async () => {
    const adminUser = { ...managedUser, role: 'ADMIN' };
    const confirm = vi.spyOn(window, 'confirm');

    await component.deleteUser(adminUser);

    expect(confirm).not.toHaveBeenCalled();
    expect(adminService.deleteUser).not.toHaveBeenCalled();
  });

  it('previews the five newest flights, searches all flights, and paginates', async () => {
    const flights = Array.from({ length: 7 }, (_, index) => ({
      flightId: index + 1,
      flightNum: `FX-${index + 1}`,
      airlineCode: 'FX',
      airlineName: 'Example Air',
      sourceAirport: airports[0],
      destAirport: airports[1],
      departureTime: '2030-10-20T09:00:00.000Z',
      arrivalTime: '2030-10-20T11:00:00.000Z',
      durationMinutes: 120,
      price: 4000,
      status: 'SCHEDULED',
      bookedPassengerCount: 0,
      bookingCount: 0,
    }));
    component.flights.set(flights);
    expect(component.previewFlights().map((flight) => flight.flightId)).toEqual([7, 6, 5, 4, 3]);

    component.setFlightSearch('fx-2');
    expect(component.filteredFlights().map((flight) => flight.flightId)).toEqual([2]);
    component.setFlightSearch('');
    component.showAllFlights.set(true);
    component.setFlightPageSize('5');
    component.flightPage.set(2);
    expect(component.paginatedFlights().map((flight) => flight.flightId)).toEqual([2, 1]);
  });

  it('previews the five newest bookings, searches all bookings, and paginates', () => {
    const bookings = Array.from({ length: 7 }, (_, index) => ({
      bookingId: index + 1,
      pnr: `PNR-${index + 1}`,
      status: 'CONFIRMED',
      bookingDate: new Date(Date.UTC(2030, 0, index + 1)).toISOString(),
      totalFare: 4000,
      user: { userId: index + 2, name: `Passenger ${index + 1}`, email: `p${index + 1}@example.com` },
      flight: {
        flightId: index + 10,
        flightNumber: `FX-${index + 1}`,
        airlineName: 'Example Air',
        sourceAirportCode: 'PNQ',
        destAirportCode: 'DEL',
        departureTime: '2030-10-20T09:00:00.000Z',
        status: 'SCHEDULED',
      },
      tickets: [],
    }));
    component.bookings.set(bookings);
    expect(component.previewBookings().map((booking) => booking.bookingId)).toEqual([7, 6, 5, 4, 3]);

    component.setBookingSearch('PNR-2');
    expect(component.filteredBookings().map((booking) => booking.bookingId)).toEqual([2]);
    component.setBookingSearch('');
    component.showAllBookings.set(true);
    component.bookingPage.set(2);
    expect(component.paginatedBookings().map((booking) => booking.bookingId)).toEqual([2, 1]);
  });

  it('does not ask for cancellation reason or call the API after flight departure', async () => {
    const prompt = vi.spyOn(window, 'prompt');
    const flight = {
      flightId: 50,
      flightNum: 'FX-102',
      airlineCode: 'FX',
      airlineName: 'Example Air',
      sourceAirport: airports[0],
      destAirport: airports[1],
      departureTime: new Date(Date.now() - 1000).toISOString(),
      arrivalTime: new Date(Date.now() + 60_000).toISOString(),
      durationMinutes: 61,
      price: 4000,
      status: 'SCHEDULED',
      bookedPassengerCount: 3,
      bookingCount: 2,
    };

    await component.cancelAdminFlight(flight);

    expect(prompt).not.toHaveBeenCalled();
    expect(adminService.cancelFlight).not.toHaveBeenCalled();
    expect(component.operationError()).toContain('after departure');
  });

  it('keeps the user listed and displays the API error when deletion fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    adminService.deleteUser.mockRejectedValueOnce(new HttpErrorResponse({ status: 409 }));
    adminService.getErrorMessage.mockReturnValueOnce('User has related records');

    await component.deleteUser(managedUser);

    expect(component.users()).toEqual([managedUser]);
    expect(component.deleteError()).toBe('User has related records');
  });

  it('shows validation errors and does not submit an invalid flight', async () => {
    const form = {
      invalid: true,
      value: {},
      resetForm: vi.fn(),
    } as unknown as NgForm;

    await component.addFlight(form);

    expect(component.flightValidationError()).toContain('Complete all required fields');
    expect(adminService.addFlight).not.toHaveBeenCalled();
  });

  it('submits a valid flight using airport codes and a positive price', async () => {
    const form = {
      invalid: false,
      value: {
        flightNum: 'AI-852',
        airlineCode: 'AI',
        airlineName: 'Air India',
        sourceAirportCode: 'PNQ',
        destAirportCode: 'DEL',
        departureTime: '2026-10-20T09:00',
        arrivalTime: '2026-10-20T11:15',
        price: '5400',
      },
      resetForm: vi.fn(),
    } as unknown as NgForm;

    await component.addFlight(form);

    expect(adminService.addFlight).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceAirport: { airportCode: 'PNQ' },
        destAirport: { airportCode: 'DEL' },
        price: 5400,
        durationMinutes: 135,
      }),
    );
    expect(component.flightSuccess()).toBe('Flight added successfully.');
    expect(component.lastCreatedFlight()?.flightId).toBe(51);
    expect(form.resetForm).toHaveBeenCalledOnce();
  });

  it('does not submit a flight with the same origin and destination', async () => {
    const form = {
      invalid: false,
      value: {
        flightNum: 'AI-852',
        airlineCode: 'AI',
        airlineName: 'Air India',
        sourceAirportCode: 'PNQ',
        destAirportCode: 'PNQ',
        departureTime: '2026-10-20T09:00',
        arrivalTime: '2026-10-20T11:15',
        price: '5400',
      },
      resetForm: vi.fn(),
    } as unknown as NgForm;

    await component.addFlight(form);

    expect(component.flightValidationError()).toContain('different origin');
    expect(adminService.addFlight).not.toHaveBeenCalled();
  });

  it('does not submit a flight with a non-positive price', async () => {
    const form = {
      invalid: false,
      value: {
        flightNum: 'AI-852',
        airlineCode: 'AI',
        airlineName: 'Air India',
        sourceAirportCode: 'PNQ',
        destAirportCode: 'DEL',
        departureTime: '2026-10-20T09:00',
        arrivalTime: '2026-10-20T11:15',
        price: '0',
      },
      resetForm: vi.fn(),
    } as unknown as NgForm;

    await component.addFlight(form);

    expect(component.flightValidationError()).toContain('greater than zero');
    expect(adminService.addFlight).not.toHaveBeenCalled();
  });

  it('logs out and requests sign-in again after an expired admin session', async () => {
    adminService.getUsers.mockRejectedValueOnce(new HttpErrorResponse({ status: 401 }));

    await component.loadUsers();

    expect(authService.Logout).toHaveBeenCalledOnce();
    expect(authService.showLoginModal()).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('uses the existing flight search flow to verify a created flight', async () => {
    component.lastCreatedFlight.set({
      flightId: 51,
      flightNum: 'AI-852',
      airlineCode: 'AI',
      airlineName: 'Air India',
      sourceAirport: airports[0],
      destAirport: airports[1],
      departureTime: '2026-10-20T09:00:00.000Z',
      arrivalTime: '2026-10-20T11:15:00.000Z',
      durationMinutes: 135,
      price: 5400,
    });

    await component.verifyFlightInSearch();

    expect(flightService.fromCity()).toEqual(airports[0]);
    expect(flightService.toCity()).toEqual(airports[1]);
    expect(flightService.fetchFlightSearchResults).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
