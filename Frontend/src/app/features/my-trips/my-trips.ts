import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucidePlane,
  lucideTicket,
  lucideCalendar,
  lucideUser,
  lucideClock,
  lucideArrowRight,
  lucideTrash2,
  lucideAlertTriangle,
  lucideX,
} from '@ng-icons/lucide';
import { HlmSpinnerImports } from '../../../../shared/spinner/src';
import { HlmButtonImports } from '../../../../shared/button/src';

import { BookingResponseDto } from '../../core/api/my-trips/model';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { BrnDialogImports } from '@spartan-ng/brain/dialog'; // 👈 Import Brain Dialog
import { MyTrips } from '../../core/api/my-trips/my-trips';

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    HlmSpinnerImports,
    HlmButtonImports,
    HlmDialogImports,
    BrnDialogImports, // 👈 Register Brain Dialog
  ],
  providers: [
    provideIcons({
      lucidePlane,
      lucideTicket,
      lucideCalendar,
      lucideUser,
      lucideClock,
      lucideArrowRight,
      lucideTrash2,
      lucideAlertTriangle,
      lucideX,
    }),
  ],
  templateUrl: './my-trips.html',
})
export class MyTripsComponent implements OnInit {
  public readonly MyTrips = inject(MyTrips);

  public readonly trips = this.MyTrips.myTrips;
  public readonly isLoading = this.MyTrips.isLoadingTrips;
  public readonly isCancelling = this.MyTrips.isCancellingTrip;
  public readonly error = this.MyTrips.tripsError;
  public readonly cancellationError = this.MyTrips.cancellationError;
  public readonly cancellationNotice = this.MyTrips.cancellationNotice;
  public readonly cancellationQuote = this.MyTrips.cancellationQuote;
  public readonly isQuotingCancellation = this.MyTrips.isQuotingCancellation;

  public selectedTripToCancel = signal<BookingResponseDto | null>(null);
  public selectedTicketIds = signal<number[]>([]);
  public entireTripQuote = signal<number | null>(null);

  ngOnInit(): void {
    this.MyTrips.getMyTrips();
  }

  public openCancelDialog(trip: BookingResponseDto): void {
    this.selectedTripToCancel.set(trip);
    this.selectedTicketIds.set(
      trip.tickets
        .filter((ticket) => ticket.status === 'CONFIRMED' || ticket.status === 'PENDING')
        .map((ticket) => ticket.ticketId),
    );
    this.entireTripQuote.set(null);
    this.refreshCancellationQuotes(trip);
  }

  public isTicketSelected(ticketId: number): boolean {
    return this.selectedTicketIds().includes(ticketId);
  }

  public async toggleTicketSelection(
    trip: BookingResponseDto,
    ticketId: number,
    selected: boolean,
  ): Promise<void> {
    this.selectedTicketIds.update((ids) =>
      selected ? [...new Set([...ids, ticketId])] : ids.filter((id) => id !== ticketId),
    );
    await this.MyTrips.quoteCancellation(trip.bookingId, this.selectedTicketIds());
  }

  private async refreshCancellationQuotes(trip: BookingResponseDto): Promise<void> {
    const activeIds = trip.tickets
      .filter((ticket) => ticket.status === 'CONFIRMED' || ticket.status === 'PENDING')
      .map((ticket) => ticket.ticketId);
    const quote = await this.MyTrips.quoteCancellation(trip.bookingId, activeIds);
    this.entireTripQuote.set(quote?.refundAmount ?? null);
  }

  public canCancelTicket(trip: BookingResponseDto): boolean {
    return new Date(trip.flight.departureTime).getTime() - Date.now() >= 2 * 60 * 60 * 1000;
  }

  public async confirmCancellation(
    ctx: { close: () => void },
    cancelEntireTrip = false,
  ): Promise<void> {
    const trip = this.selectedTripToCancel();
    if (
      !trip ||
      this.isQuotingCancellation() ||
      !this.cancellationQuote() ||
      (cancelEntireTrip && this.entireTripQuote() === null) ||
      (!cancelEntireTrip && !this.selectedTicketIds().length)
    ) {
      return;
    }

    const success = await this.MyTrips.cancelTickets(
      trip.bookingId,
      this.selectedTicketIds(),
      cancelEntireTrip,
    );
    if (success) {
      this.selectedTripToCancel.set(null);
      ctx.close();
    }
  }
}
