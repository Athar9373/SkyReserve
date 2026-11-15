import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FlightSummery } from './flight-summery/flight-summery';
import { PassengerDetailsComponent } from './passenger-details/passenger-details';
import { SeatSelectionComponent } from './seat-selection/seat-selection';
import { PaymentComponent } from './payments/payments';
import { BookingService } from '../../core/booking/booking';
import {
  PassengerReqDto,
  PassengerResponseDto,
  PaymentReqDto,
  Seat,
} from '../../core/booking/model/bookingModel';
import { PassengerSeatMapping } from '../../core/api/flight/model/types';
import { HlmSpinnerImports } from '../../../../shared/spinner/src';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [
    FlightSummery,
    PassengerDetailsComponent,
    SeatSelectionComponent,
    PaymentComponent,
    HlmSpinnerImports,
  ],
  templateUrl: './booking.html',
})
export class Booking implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public readonly bookingService = inject(BookingService);

  // Network Status Signal
  public isOffline = signal<boolean>(!navigator.onLine);

  public readonly flightData = this.bookingService.selectedFlight;
  public readonly isLoading = this.bookingService.isLoading;
  public readonly isSavingPassengers = this.bookingService.isSavingPassengers;
  public readonly error = this.bookingService.error;
  public readonly passengerError = this.bookingService.passengerError;
  public readonly bookingError = this.bookingService.bookingError;

  public flightId = this.bookingService.flightID;
  public travellersCount = this.bookingService.totalCounts;
  public selectedSeats = signal<Seat[]>([]);
  public savedPassengers = signal<PassengerResponseDto[]>([]);
  public showPaymentSection = signal<boolean>(false);

  private readonly handleOnline = () => this.isOffline.set(false);
  private readonly handleOffline = () => this.isOffline.set(true);

  ngOnInit(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    if (this.flightId()) {
      this.bookingService.getFlightData(this.flightId()!);
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  /**
   * Accepts the object emitted from PassengerDetailsComponent
   */
  public async onSavePassengers(passengers: PassengerReqDto[]): Promise<void> {
    if (this.isOffline()) return;

    if (passengers && passengers.length > 0) {
      const createdPassengers = await this.bookingService.savePassengers(passengers);
      if (createdPassengers) {
        this.savedPassengers.set(createdPassengers);
      }
    }
  }

  public onSeatsSelected(seats: Seat[]): void {
    this.selectedSeats.set(seats);
  }

  public onProceedToPayment(): void {
    if (this.isOffline()) return;

    const seats = this.selectedSeats();
    const passengers = this.savedPassengers();

    if (!passengers.length) {
      alert('Please save passenger details first.');
      return;
    }

    if (!seats.length || seats.length !== this.travellersCount()) {
      alert(`Please select ${this.travellersCount()} seat(s) before proceeding.`);
      return;
    }

    this.showPaymentSection.set(true);
  }

  /**
   * Executes sequence: POST /bookings -> POST /bookings/payment/{bookingId}
   */
  public async onProcessBookingAndPayment(paymentData: PaymentReqDto): Promise<void> {
    if (this.isOffline()) return;

    const flightId = this.flightId();
    const seats = this.selectedSeats();
    const passengers = this.savedPassengers();

    const passengerSeatMap: PassengerSeatMapping[] = passengers.map((passenger, index) => ({
      passengerId: passenger.passengerId,
      seatId: seats[index].seatId,
    }));

    // Step 1: Create pending booking
    const bookingResponse = await this.bookingService.createBooking(flightId!, passengerSeatMap);

    if (!bookingResponse) {
      return;
    }

    // Step 2: Process payment with generated booking ID
    const paymentResponse = await this.bookingService.processPayment(
      bookingResponse.bookingId,
      paymentData,
    );

    if (paymentResponse && paymentResponse.transactionStatus === 'SUCCESS') {
      this.router.navigate(['/booking-success'], {
        queryParams: {
          bookingId: paymentResponse.bookingId,
          pnr: paymentResponse.pnr,
          transactionId: paymentResponse.gatewayTransactionId,
        },
      });
    }
  }
}
