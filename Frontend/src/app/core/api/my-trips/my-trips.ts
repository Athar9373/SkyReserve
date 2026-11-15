import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  BookingResponseDto,
  CancellationQuoteDto,
  CancellationResponseDto,
} from './model';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth';

@Injectable({
  providedIn: 'root',
})
export class MyTrips {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly bookingApiUrl = `${environment.apiUrl}/bookings`;

  public readonly myTrips = signal<BookingResponseDto[]>([]);
  public readonly isLoadingTrips = signal<boolean>(false);
  public readonly isCancellingTrip = signal<boolean>(false);
  public readonly tripsError = signal<string | null>(null);
  public readonly cancellationQuote = signal<CancellationQuoteDto | null>(null);
  public readonly cancellationError = signal<string | null>(null);
  public readonly cancellationNotice = signal<string | null>(null);
  public readonly isQuotingCancellation = signal(false);
  private cancellationQuoteRequestId = 0;

  public async getMyTrips(): Promise<BookingResponseDto[]> {
    this.isLoadingTrips.set(true);
    this.tripsError.set(null);

    try {
      const trips = await firstValueFrom(this.http.get<BookingResponseDto[]>(this.bookingApiUrl));
      const data = trips || [];
      this.myTrips.set(data);
      return data;
    } catch (err: unknown) {
      this.tripsError.set(this.getErrorMessage(err));
      return [];
    } finally {
      this.isLoadingTrips.set(false);
    }
  }

  public async cancelBooking(bookingId: number): Promise<boolean> {
    return this.cancelTickets(bookingId, [], true);
  }

  public async quoteCancellation(
    bookingId: number,
    ticketIds: number[],
  ): Promise<CancellationQuoteDto | null> {
    const requestId = ++this.cancellationQuoteRequestId;
    this.cancellationError.set(null);
    this.cancellationQuote.set(null);
    this.isQuotingCancellation.set(true);
    try {
      const quote = await firstValueFrom(
        this.http.post<CancellationQuoteDto>(
          `${this.bookingApiUrl}/${bookingId}/cancellation-quote`,
          { ticketIds },
        ),
      );
      if (requestId === this.cancellationQuoteRequestId) {
        this.cancellationQuote.set(quote);
      }
      return quote;
    } catch (error: unknown) {
      if (requestId === this.cancellationQuoteRequestId) {
        this.cancellationError.set(this.getErrorMessage(error));
      }
      return null;
    } finally {
      if (requestId === this.cancellationQuoteRequestId) {
        this.isQuotingCancellation.set(false);
      }
    }
  }

  public async cancelTickets(
    bookingId: number,
    ticketIds: number[],
    cancelEntireTrip = false,
  ): Promise<boolean> {
    this.isCancellingTrip.set(true);
    this.cancellationError.set(null);
    this.cancellationNotice.set(null);
    try {
      const response = await firstValueFrom(
        this.http.post<CancellationResponseDto>(
          `${this.bookingApiUrl}/${bookingId}/cancel`,
          cancelEntireTrip ? { cancelEntireTrip: true } : { ticketIds },
        ),
      );
      const cancelledIds = new Set(response.cancelledTickets.map((ticket) => ticket.ticketId));
      this.myTrips.update((trips) => trips.map((trip) => {
        if (trip.bookingId !== bookingId) return trip;
        const tickets = trip.tickets.map((ticket) =>
          cancelledIds.has(ticket.ticketId)
            ? {
                ...ticket,
                status: response.cancelledTickets.find(
                  (cancelled) => cancelled.ticketId === ticket.ticketId,
                )?.status ?? 'CANCELLED',
              }
            : ticket,
        );
        return { ...trip, status: response.status, tickets };
      }));
      this.cancellationNotice.set(
        `${response.refundNotice} Refund amount: ₹${response.refundAmount.toFixed(2)}.`,
      );
      this.cancellationQuote.set(null);
      return true;
    } catch (error: unknown) {
      this.cancellationError.set(this.getErrorMessage(error));
      return false;
    } finally {
      this.isCancellingTrip.set(false);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error as { message?: string; error?: string } | undefined;
      if (payload?.message) return payload.message;
      if (payload?.error) return payload.error;
      switch (error.status) {
        case 401:
          this.auth.Logout();
          this.auth.showLoginModal.set(true);
          return 'Your session has expired. Please sign in again.';
        case 404:
          return 'This booking or ticket could not be found.';
        case 409:
          return 'Cancellation is unavailable for this booking.';
      }
    }
    if (error instanceof Error) return error.message || 'The request failed. Please try again.';
    return 'The request failed. Please try again.';
  }
}
