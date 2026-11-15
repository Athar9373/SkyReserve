import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth';
import {
  AdminAnalytics,
  AdminBooking,
  AdminFlight,
  AdminService,
  CreateFlightRequest,
  ManagedUser,
} from '../../core/admin/admin.service';
import { Airport, FlightDetails } from '../../core/api/flight/model/types';
import { FlightService } from '../../core/api/flight/flightService';
import { AdminAnalyticsComponent } from './admin-analytics';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DatePipe, FormsModule, AdminAnalyticsComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly flightService = inject(FlightService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly users = signal<ManagedUser[]>([]);
  readonly bookings = signal<AdminBooking[]>([]);
  readonly flights = signal<AdminFlight[]>([]);
  readonly analytics = signal<AdminAnalytics | null>(null);
  readonly airports = this.flightService.airports;
  readonly isUsersLoading = signal(true);
  readonly isBookingsLoading = signal(true);
  readonly isFlightsLoading = signal(true);
  readonly isAnalyticsLoading = signal(true);
  readonly isAirportsLoading = signal(true);
  readonly deletingUserId = signal<number | null>(null);
  readonly cancellingBookingId = signal<number | null>(null);
  readonly cancellingFlightId = signal<number | null>(null);
  readonly isAddingFlight = signal(false);
  readonly usersError = signal<string | null>(null);
  readonly bookingsError = signal<string | null>(null);
  readonly flightsError = signal<string | null>(null);
  readonly analyticsError = signal<string | null>(null);
  readonly airportsError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly userSuccess = signal<string | null>(null);
  readonly operationNotice = signal<string | null>(null);
  readonly operationError = signal<string | null>(null);
  readonly flightError = signal<string | null>(null);
  readonly flightSuccess = signal<string | null>(null);
  readonly flightValidationError = signal<string | null>(null);
  readonly lastCreatedFlight = signal<FlightDetails | null>(null);
  readonly showAllUsers = signal(false);
  readonly showAllFlights = signal(false);
  readonly showAllBookings = signal(false);
  readonly userSearch = signal('');
  readonly flightSearch = signal('');
  readonly bookingSearch = signal('');
  readonly userRoleFilter = signal<'ALL' | 'USER' | 'ADMIN'>('ALL');
  readonly userPage = signal(1);
  readonly userPageSize = signal(5);
  readonly flightPage = signal(1);
  readonly flightPageSize = signal(5);
  readonly bookingPage = signal(1);
  readonly bookingPageSize = signal(5);
  readonly filteredUsers = computed(() => {
    const search = this.userSearch().trim().toLowerCase();
    const role = this.userRoleFilter();
    return this.users().filter((user) => {
      const matchesSearch =
        !search ||
        `${user.firstName} ${user.lastName} ${user.email} ${user.phoneNumber}`
          .toLowerCase()
          .includes(search);
      return matchesSearch && (role === 'ALL' || user.role === role);
    });
  });
  readonly userPageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredUsers().length / this.userPageSize())),
  );
  readonly paginatedUsers = computed(() => {
    const start = (this.userPage() - 1) * this.userPageSize();
    return this.filteredUsers().slice(start, start + this.userPageSize());
  });
  readonly userPageNumbers = computed(() =>
    Array.from({ length: this.userPageCount() }, (_, index) => index + 1),
  );
  readonly previewUsers = computed(() => this.users().slice(0, 5));
  readonly newestFlights = computed(() =>
    [...this.flights()].sort((a, b) => b.flightId - a.flightId),
  );
  readonly filteredFlights = computed(() => {
    const search = this.flightSearch().trim().toLowerCase();
    return this.newestFlights().filter((flight) => {
      const searchable = (
        `${flight.flightNum} ${flight.airlineName} ${flight.airlineCode} ` +
        `${flight.sourceAirport.airportCode} ${flight.sourceAirport.city} ` +
        `${flight.destAirport.airportCode} ${flight.destAirport.city} ${flight.status}`
      ).toLowerCase();
      return !search || searchable.includes(search);
    });
  });
  readonly flightPageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredFlights().length / this.flightPageSize())),
  );
  readonly paginatedFlights = computed(() => {
    const start = (this.flightPage() - 1) * this.flightPageSize();
    return this.filteredFlights().slice(start, start + this.flightPageSize());
  });
  readonly flightPageNumbers = computed(() =>
    Array.from({ length: this.flightPageCount() }, (_, index) => index + 1),
  );
  readonly previewFlights = computed(() => this.newestFlights().slice(0, 5));
  readonly newestBookings = computed(() =>
    [...this.bookings()].sort(
      (a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime(),
    ),
  );
  readonly filteredBookings = computed(() => {
    const search = this.bookingSearch().trim().toLowerCase();
    return this.newestBookings().filter((booking) => {
      const searchable = (
        `${booking.pnr} ${booking.user.name} ${booking.user.email} ` +
        `${booking.flight.flightNumber} ${booking.flight.sourceAirportCode} ` +
        `${booking.flight.destAirportCode} ${booking.status}`
      ).toLowerCase();
      return !search || searchable.includes(search);
    });
  });
  readonly bookingPageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredBookings().length / this.bookingPageSize())),
  );
  readonly paginatedBookings = computed(() => {
    const start = (this.bookingPage() - 1) * this.bookingPageSize();
    return this.filteredBookings().slice(start, start + this.bookingPageSize());
  });
  readonly bookingPageNumbers = computed(() =>
    Array.from({ length: this.bookingPageCount() }, (_, index) => index + 1),
  );
  readonly previewBookings = computed(() => this.newestBookings().slice(0, 5));

  ngOnInit(): void {
    void this.loadUsers();
    void this.loadAirports();
    void this.loadBookings();
    void this.loadFlights();
    void this.loadAnalytics();
  }

  async loadUsers(): Promise<void> {
    this.isUsersLoading.set(true);
    this.usersError.set(null);
    try {
      this.users.set(await this.adminService.getUsers());
      this.userPage.set(1);
    } catch (error: unknown) {
      this.usersError.set(this.adminService.getErrorMessage(error, 'Could not load users.'));
      this.handleUnauthorized(error);
    } finally {
      this.isUsersLoading.set(false);
    }
  }

  async loadAirports(): Promise<void> {
    this.isAirportsLoading.set(true);
    this.airportsError.set(null);
    const selectedFrom = this.flightService.fromCity();
    const selectedTo = this.flightService.toCity();
    const airports = await this.flightService.fetchAirports();
    this.flightService.fromCity.set(selectedFrom);
    this.flightService.toCity.set(selectedTo);
    if (!airports.length) {
      this.airportsError.set(
        this.flightService.airportsError() ?? 'No airports are available for flight creation.',
      );
    }
    this.isAirportsLoading.set(false);
  }

  async loadBookings(): Promise<void> {
    this.isBookingsLoading.set(true);
    this.bookingsError.set(null);
    try {
      this.bookings.set(await this.adminService.getBookings());
    } catch (error: unknown) {
      this.bookingsError.set(this.adminService.getErrorMessage(error, 'Could not load bookings.'));
      this.handleUnauthorized(error);
    } finally {
      this.isBookingsLoading.set(false);
    }
  }

  async loadFlights(): Promise<void> {
    this.isFlightsLoading.set(true);
    this.flightsError.set(null);
    try {
      this.flights.set(await this.adminService.getFlights());
    } catch (error: unknown) {
      this.flightsError.set(this.adminService.getErrorMessage(error, 'Could not load flights.'));
      this.handleUnauthorized(error);
    } finally {
      this.isFlightsLoading.set(false);
    }
  }

  async loadAnalytics(): Promise<void> {
    this.isAnalyticsLoading.set(true);
    this.analyticsError.set(null);
    try {
      this.analytics.set(await this.adminService.getAnalytics());
    } catch (error: unknown) {
      this.analyticsError.set(this.adminService.getErrorMessage(error, 'Could not load analytics.'));
      this.handleUnauthorized(error);
    } finally {
      this.isAnalyticsLoading.set(false);
    }
  }

  setUserSearch(value: string): void {
    this.userSearch.set(value);
    this.userPage.set(1);
  }

  setFlightSearch(value: string): void {
    this.flightSearch.set(value);
    this.flightPage.set(1);
  }

  setFlightPageSize(value: string): void {
    const size = Number(value);
    if (size === 5 || size === 10 || size === 20) {
      this.flightPageSize.set(size);
      this.flightPage.set(1);
    }
  }

  setBookingSearch(value: string): void {
    this.bookingSearch.set(value);
    this.bookingPage.set(1);
  }

  setBookingPageSize(value: string): void {
    const size = Number(value);
    if (size === 5 || size === 10 || size === 20) {
      this.bookingPageSize.set(size);
      this.bookingPage.set(1);
    }
  }

  canCancelBeforeDeparture(departureTime: string): boolean {
    return new Date(departureTime).getTime() > Date.now();
  }

  setUserRole(value: string): void {
    this.userRoleFilter.set(value === 'ADMIN' || value === 'USER' ? value : 'ALL');
    this.userPage.set(1);
  }

  setUserPageSize(value: string): void {
    const size = Number(value);
    if (size === 5 || size === 10 || size === 20) {
      this.userPageSize.set(size);
      this.userPage.set(1);
    }
  }

  isAdmin(user: ManagedUser): boolean {
    return user.role === 'ADMIN';
  }

  isCurrentUser(user: ManagedUser): boolean {
    const currentUser = this.auth.userInfo();
    return (
      user.email === currentUser?.email ||
      (currentUser?.userId !== undefined && user.userId === currentUser.userId)
    );
  }

  async deleteUser(user: ManagedUser): Promise<void> {
    if (
      this.isAdmin(user) ||
      this.isCurrentUser(user) ||
      !window.confirm(`Delete ${user.firstName} ${user.lastName}?`)
    ) {
      return;
    }

    this.deleteError.set(null);
    this.userSuccess.set(null);
    this.deletingUserId.set(user.userId);
    try {
      await this.adminService.deleteUser(user.userId);
      this.users.update((users) => users.filter((entry) => entry.userId !== user.userId));
      this.userPage.set(Math.min(this.userPage(), this.userPageCount()));
      this.userSuccess.set(`${user.firstName} ${user.lastName} was deleted.`);
    } catch (error: unknown) {
      this.deleteError.set(this.adminService.getErrorMessage(error, 'Could not delete this user.'));
      this.handleUnauthorized(error);
    } finally {
      this.deletingUserId.set(null);
    }
  }

  async cancelAdminTicket(booking: AdminBooking, ticketId: number): Promise<void> {
    if (!this.canCancelBeforeDeparture(booking.flight.departureTime)) {
      this.operationError.set('Tickets cannot be cancelled after the flight has departed.');
      return;
    }
    const reason = window.prompt(
      `Administrative reason for cancelling ticket ${ticketId}:`,
      'Customer requested',
    );
    if (!reason?.trim()) return;
    this.cancellingBookingId.set(booking.bookingId);
    this.operationError.set(null);
    this.operationNotice.set(null);
    try {
      const result = await this.adminService.cancelBooking(booking.bookingId, reason, [ticketId]);
      this.operationNotice.set(
        `Ticket cancelled. Refund ₹${result.refundAmount.toFixed(2)} (${result.refundStatus}).`,
      );
      await Promise.all([this.loadBookings(), this.loadFlights(), this.loadAnalytics()]);
    } catch (error: unknown) {
      this.operationError.set(this.adminService.getErrorMessage(error, 'Could not cancel ticket.'));
      this.handleUnauthorized(error);
    } finally {
      this.cancellingBookingId.set(null);
    }
  }

  async cancelAdminBooking(booking: AdminBooking): Promise<void> {
    if (!this.canCancelBeforeDeparture(booking.flight.departureTime)) {
      this.operationError.set('Tickets cannot be cancelled after the flight has departed.');
      return;
    }
    const reason = window.prompt(
      `Administrative reason for cancelling booking ${booking.pnr}:`,
      'Customer requested',
    );
    if (!reason?.trim()) return;
    this.cancellingBookingId.set(booking.bookingId);
    this.operationError.set(null);
    this.operationNotice.set(null);
    try {
      const result = await this.adminService.cancelBooking(booking.bookingId, reason);
      this.operationNotice.set(
        `Booking cancelled. Refund ₹${result.refundAmount.toFixed(2)} (${result.refundStatus}).`,
      );
      await Promise.all([this.loadBookings(), this.loadFlights(), this.loadAnalytics()]);
    } catch (error: unknown) {
      this.operationError.set(this.adminService.getErrorMessage(error, 'Could not cancel booking.'));
      this.handleUnauthorized(error);
    } finally {
      this.cancellingBookingId.set(null);
    }
  }

  async cancelAdminFlight(flight: AdminFlight): Promise<void> {
    if (!this.canCancelBeforeDeparture(flight.departureTime)) {
      this.operationError.set('Flights cannot be cancelled after departure.');
      return;
    }
    const confirmed = window.confirm(
      `HIGH PRIORITY: Cancelling Flight ${flight.flightNum} impacts ` +
        `${flight.bookedPassengerCount} passengers across ${flight.bookingCount} bookings. Continue?`,
    );
    if (!confirmed) return;
    const reason = window.prompt(
      `Administrative reason for cancelling Flight ${flight.flightNum}:`,
      'Schedule change',
    );
    if (!reason?.trim()) return;

    this.cancellingFlightId.set(flight.flightId);
    this.operationError.set(null);
    this.operationNotice.set(null);
    try {
      const result = await this.adminService.cancelFlight(flight.flightId, reason);
      this.operationNotice.set(
        `${result.notice ?? 'Flight cancelled.'} Impact: ${result.impactedPassengers} passengers, ` +
          `${result.impactedBookings} bookings; refunds ₹${result.refundAmount.toFixed(2)}.`,
      );
      await Promise.all([this.loadBookings(), this.loadFlights(), this.loadAnalytics()]);
    } catch (error: unknown) {
      this.operationError.set(this.adminService.getErrorMessage(error, 'Could not cancel flight.'));
      this.handleUnauthorized(error);
    } finally {
      this.cancellingFlightId.set(null);
    }
  }

  async addFlight(form: NgForm): Promise<void> {
    this.flightValidationError.set(null);
    if (form.invalid) {
      this.flightValidationError.set('Complete all required fields with valid values before adding the flight.');
      return;
    }
    if (this.isAddingFlight()) return;

    const value = form.value as {
      flightNum: string;
      airlineCode: string;
      airlineName: string;
      sourceAirportCode: string;
      destAirportCode: string;
      departureTime: string;
      arrivalTime: string;
      price: number;
    };
    const sourceAirport = this.airports().find(
      (airport) => airport.airportCode === value.sourceAirportCode,
    );
    const destAirport = this.airports().find(
      (airport) => airport.airportCode === value.destAirportCode,
    );
    const departure = new Date(value.departureTime);
    const arrival = new Date(value.arrivalTime);
    const price = Number(value.price);

    if (!value.flightNum.trim() || !value.airlineCode.trim() || !value.airlineName.trim()) {
      this.flightValidationError.set('Flight number, airline code, and airline name are required.');
      return;
    }
    if (!sourceAirport || !destAirport || sourceAirport.airportCode === destAirport.airportCode) {
      this.flightValidationError.set('Choose different origin and destination airports.');
      return;
    }
    if (
      Number.isNaN(departure.getTime()) ||
      Number.isNaN(arrival.getTime()) ||
      arrival <= departure
    ) {
      this.flightValidationError.set('Arrival must be later than departure.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      this.flightValidationError.set('Enter a price greater than zero.');
      return;
    }

    const request: CreateFlightRequest = {
      flightNum: value.flightNum.trim(),
      airlineCode: value.airlineCode.trim(),
      airlineName: value.airlineName.trim(),
      sourceAirport: { airportCode: sourceAirport.airportCode },
      destAirport: { airportCode: destAirport.airportCode },
      departureTime: departure.toISOString(),
      arrivalTime: arrival.toISOString(),
      durationMinutes: Math.round((arrival.getTime() - departure.getTime()) / 60_000),
      price,
    };

    this.isAddingFlight.set(true);
    this.flightError.set(null);
    this.flightSuccess.set(null);
    this.lastCreatedFlight.set(null);
    try {
      const createdFlight = await this.adminService.addFlight(request);
      this.lastCreatedFlight.set(createdFlight);
      this.flightSuccess.set('Flight added successfully.');
      form.resetForm();
    } catch (error: unknown) {
      this.flightError.set(this.adminService.getErrorMessage(error, 'Could not add this flight.'));
      this.handleUnauthorized(error);
    } finally {
      this.isAddingFlight.set(false);
    }
  }

  async verifyFlightInSearch(): Promise<void> {
    const flight = this.lastCreatedFlight();
    if (!flight) return;

    this.flightError.set(null);
    this.flightService.fromCity.set(flight.sourceAirport);
    this.flightService.toCity.set(flight.destAirport);
    this.flightService.startDate.set(new Date(flight.departureTime));
    this.flightService.totalCount.set(1);

    const results = await this.flightService.fetchFlightSearchResults();
    if (!results.some((result) => result.flightId === flight.flightId)) {
      if (this.flightService.flightsErrorStatus() === 401) {
        this.handleUnauthorized(new HttpErrorResponse({ status: 401 }));
      }
      this.flightError.set(
        this.flightService.flightsError()
          ? `Flight search failed: ${this.flightService.flightsError()}`
          : 'Flight was created, but it was not returned by flight search.',
      );
      return;
    }

    await this.router.navigateByUrl('/');
  }

  private handleUnauthorized(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.auth.Logout();
      this.auth.showLoginModal.set(true);
      void this.router.navigateByUrl('/');
    }
  }
}
