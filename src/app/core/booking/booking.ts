import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  PassengerReqDto,
  PassengerResponseDto,
  PaymentReqDto,
  PaymentResponseDto,
  SelectedFlightDetails,
} from './model/bookingModel';
import {
  BookingResponse,
  CreateBookingPayload,
  PassengerSeatMapping,
} from '../api/flight/model/types';
import { FlightService } from '../api/flight/flightService';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly flightService = inject(FlightService);

  private readonly flightApiUrl = `${environment.apiUrl}/flights`;
  private readonly passengerApiUrl = `${environment.apiUrl}/passengers`;
  private readonly bookingApiUrl = `${environment.apiUrl}/bookings`;

  public readonly selectedFlight = signal<SelectedFlightDetails | null>(null);
  public readonly savedPassengersList = signal<PassengerResponseDto[]>([]);
  public readonly createdPassengers = signal<PassengerResponseDto[]>([]);
  public readonly currentBooking = signal<BookingResponse | null>(null);
  public readonly paymentResult = signal<PaymentResponseDto | null>(null);
  public readonly totalCounts = this.flightService.totalCount;
  public readonly flightID = this.flightService.flightID;

  public readonly isLoading = signal<boolean>(false);
  public readonly isLoadingSavedPassengers = signal<boolean>(false);
  public readonly isSavingPassengers = signal<boolean>(false);
  public readonly isSubmitting = signal<boolean>(false);
  public readonly isProcessingPayment = signal<boolean>(false);

  public readonly error = signal<string | null>(null);
  public readonly passengerError = signal<string | null>(null);
  public readonly bookingError = signal<string | null>(null);
  public readonly paymentError = signal<string | null>(null);
  public readonly paymentSuccessful = signal<boolean>(false);

  public passengerSubmitted = signal(false);
  public seatSelected = signal(false);

  public async getFlightData(flightId: string | number): Promise<void> {
    if (!flightId) {
      this.error.set('Invalid Flight ID');
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        this.http.get<SelectedFlightDetails>(`${this.flightApiUrl}/${flightId}`),
      );
      this.selectedFlight.set(response);
    } catch (err: unknown) {
      this.selectedFlight.set(null);
      this.error.set(this.extractErrorMessage(err, 'Failed to load flight details'));
    } finally {
      this.isLoading.set(false);
    }
  }

  public async savePassengers(
    passengersData: PassengerReqDto[],
  ): Promise<PassengerResponseDto[] | null> {
    if (!passengersData || passengersData.length === 0) {
      this.passengerError.set('Passenger details are required.');
      return null;
    }
    this.isSavingPassengers.set(true);
    this.passengerError.set(null);

    try {
      const savedPassengers = await firstValueFrom(
        this.http.post<PassengerResponseDto[]>(this.passengerApiUrl, passengersData),
      );
      this.createdPassengers.set(savedPassengers);
      this.passengerSubmitted.set(true);
      return savedPassengers;
    } catch (err: unknown) {
      this.passengerError.set(
        this.extractErrorMessage(err, 'Failed to save passenger details. Please try again.'),
      );
      return null;
    } finally {
      this.isSavingPassengers.set(false);
    }
  }

  public async createBooking(
    flightId: number,
    passengerSeatMap: PassengerSeatMapping[],
  ): Promise<BookingResponse | null> {
    if (!flightId || !passengerSeatMap || passengerSeatMap.length === 0) {
      this.bookingError.set('Flight ID and passenger seat mappings are required.');
      return null;
    }

    this.isSubmitting.set(true);
    this.bookingError.set(null);

    const payload: CreateBookingPayload = { flightId, passengerSeatMap };

    try {
      const response = await firstValueFrom(
        this.http.post<BookingResponse>(this.bookingApiUrl, payload),
      );
      this.currentBooking.set(response);
      return response;
    } catch (err: unknown) {
      this.bookingError.set(
        this.extractErrorMessage(err, 'Failed to complete booking. Please try again.'),
      );
      return null;
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public async processPayment(
    bookingId: number,
    paymentData: PaymentReqDto,
  ): Promise<PaymentResponseDto | null> {
    if (!bookingId || !paymentData) {
      this.paymentError.set('Booking ID and payment details are required.');
      return null;
    }

    this.isProcessingPayment.set(true);
    this.paymentError.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<PaymentResponseDto>(
          `${this.bookingApiUrl}/payment/${bookingId}`,
          paymentData,
        ),
      );
      this.paymentResult.set(response);
      this.passengerSubmitted.set(false);
      this.paymentSuccessful.set(true);
      return response;
    } catch (err: unknown) {
      this.paymentError.set(
        this.extractErrorMessage(err, 'Payment failed. Please verify card details and try again.'),
      );
      return null;
    } finally {
      this.isProcessingPayment.set(false);
    }
  }

  private extractErrorMessage(err: unknown, fallbackMessage: string): string {
    if (err instanceof HttpErrorResponse) {
      if (err.error?.message && typeof err.error.message === 'string') return err.error.message;
      if (err.error?.error && typeof err.error.error === 'string') return err.error.error;
      if (err.status === 404) return 'Flight or resource not found.';
      if (err.status === 0)
        return 'Network failure or CORS restriction. Please check your connection.';
    } else if (err instanceof Error && err.message) {
      return err.message;
    }
    return fallbackMessage;
  }
}
