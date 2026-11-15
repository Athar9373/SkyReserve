import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FlightDetails } from '../api/flight/model/types';

export interface ManagedUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role?: string;
}

export interface CreateFlightRequest {
  flightNum: string;
  airlineCode: string;
  airlineName: string;
  sourceAirport: { airportCode: string };
  destAirport: { airportCode: string };
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  price: number;
}

export interface AdminBooking {
  bookingId: number;
  pnr: string;
  status: string;
  bookingDate: string;
  totalFare: number;
  user: { userId: number; name: string; email: string };
  flight: {
    flightId: number;
    flightNumber: string;
    airlineName: string;
    sourceAirportCode: string;
    destAirportCode: string;
    departureTime: string;
    status: string;
  };
  tickets: Array<{
    ticketId: number;
    passengerName: string;
    seatNumber: string;
    status: string;
  }>;
}

export interface AdminFlight extends FlightDetails {
  status: string;
  bookedPassengerCount: number;
  bookingCount: number;
}

export interface AdminAnalytics {
  ticketSalesTrend: Array<{ date: string; bookings: number; cancellations: number }>;
  revenueByMonth: Array<{ month: string; revenue: number; tickets: number }>;
  flightStatusDistribution: Record<string, number>;
  topRoutes: Array<{ route: string; bookings: number; revenue: number }>;
}

export interface AdminCancellationResult {
  bookingId?: number;
  flightId?: number;
  status?: string;
  cancelledTickets?: Array<{ ticketId: number; status: string }>;
  impactedPassengers?: number;
  impactedBookings?: number;
  refundAmount: number;
  refundStatus: string;
  refundNotice?: string;
  notice?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  getUsers(): Promise<ManagedUser[]> {
    return firstValueFrom(this.http.get<ManagedUser[]>(`${this.apiUrl}/users`));
  }

  deleteUser(userId: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/users/${userId}`));
  }

  addFlight(flight: CreateFlightRequest): Promise<FlightDetails> {
    return firstValueFrom(this.http.post<FlightDetails>(`${this.apiUrl}/flights`, flight));
  }

  getBookings(): Promise<AdminBooking[]> {
    return firstValueFrom(this.http.get<AdminBooking[]>(`${this.apiUrl}/bookings`));
  }

  cancelBooking(bookingId: number, reason: string, ticketIds?: number[]): Promise<AdminCancellationResult> {
    return firstValueFrom(
      this.http.post<AdminCancellationResult>(`${this.apiUrl}/bookings/${bookingId}/cancel`, {
        reason,
        ...(ticketIds ? { ticketIds } : {}),
      }),
    );
  }

  getFlights(): Promise<AdminFlight[]> {
    return firstValueFrom(this.http.get<AdminFlight[]>(`${this.apiUrl}/flights`));
  }

  cancelFlight(flightId: number, reason: string): Promise<AdminCancellationResult> {
    return firstValueFrom(
      this.http.post<AdminCancellationResult>(`${this.apiUrl}/flights/${flightId}/cancel`, {
        reason,
      }),
    );
  }

  getAnalytics(): Promise<AdminAnalytics> {
    return firstValueFrom(this.http.get<AdminAnalytics>(`${this.apiUrl}/analytics`));
  }

  getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error as { message?: string; error?: string } | undefined;
      if (payload?.message?.trim()) return payload.message;
      if (payload?.error?.trim()) return payload.error;

      switch (error.status) {
        case 0:
          return 'Cannot reach the server. Check your connection and try again.';
        case 400:
          return 'The request is invalid. Check the submitted details and try again.';
        case 401:
          return 'Your session has expired. Sign in again to continue.';
        case 403:
          return 'Your account does not have permission to perform this action.';
        case 404:
          return 'The requested user or resource was not found.';
        case 409:
          return 'This action conflicts with existing data or related records.';
      }
    }

    if (error instanceof Error && error.message) return error.message;
    return fallback;
  }
}
