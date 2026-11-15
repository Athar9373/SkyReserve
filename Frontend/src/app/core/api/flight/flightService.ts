import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Airport, CabinOption, FlightDetails } from './model/types';
import { environment } from '../../../../environments/environment';

export interface BackendError {
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FlightService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  // Airport signals
  public readonly airports = signal<Airport[]>([]);
  public readonly isAirportsLoading = signal<boolean>(false);
  public readonly airportsError = signal<string | null>(null);

  // Flight signals
  public readonly flightResults = signal<FlightDetails[]>([]);
  public readonly isFlightsLoading = signal<boolean>(false);
  public readonly flightsError = signal<string | null>(null);
  public readonly flightsErrorStatus = signal<number | null>(null);
  public readonly hasSearched = signal<boolean>(false);

  // Selection signals
  public fromCity = signal<Airport | null>(null);
  public toCity = signal<Airport | null>(null);

  // Reactively derives whether selected airports match in real time
  public readonly isSameAirport = computed(() => {
    const source = this.fromCity();
    const destination = this.toCity();

    if (!source?.airportCode || !destination?.airportCode) {
      return false;
    }

    return source.airportCode === destination.airportCode;
  });

  public selectedCabinClass = signal<CabinOption>({
    id: 1,
    name: 'Economy/Premium Economy',
    features: [],
    icon: 'https://imgak.mmtcdn.com/flights/assets/media/dt/common/landing/cabin_seat_3d_economy.png',
  });

  public totalCount = signal<number>(1);
  public flightID = signal<number | null>(null);
  public isHidden = signal<boolean>(false);
  public startDate = signal<Date>(new Date());

  public async fetchAirports(): Promise<Airport[]> {
    this.isAirportsLoading.set(true);
    this.airportsError.set(null);

    try {
      const data = await firstValueFrom(this.http.get<Airport[]>(`${this.API_URL}/airports`));
      this.airports.set(data);

      if (data && data.length >= 2) {
        this.fromCity.set(data[0]);
        this.toCity.set(data[1]);
      } else if (data && data.length === 1) {
        this.fromCity.set(data[0]);
        this.toCity.set(null);
      }

      return data;
    } catch (err: unknown) {
      const message = this.extractErrorMessage(err, 'Failed to fetch airports list.');
      this.airportsError.set(message);
      this.airports.set([]);
      this.fromCity.set(null);
      this.toCity.set(null);
      return [];
    } finally {
      this.isAirportsLoading.set(false);
    }
  }

  private formatDateToLocalISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public async fetchFlightSearchResults(): Promise<FlightDetails[]> {
    const source = this.fromCity();
    const destination = this.toCity();

    if (!source || !destination) {
      this.flightsErrorStatus.set(null);
      this.flightsError.set(
        this.airportsError()
          ? 'Cannot search flights: Airport data failed to load. Please retry loading airports.'
          : 'Please select both origin and destination airports before searching.',
      );

      this.flightResults.set([]);
      return [];
    }

    // Check reactive condition directly
    if (this.isSameAirport()) {
      this.flightsErrorStatus.set(null);
      const errorMessage = this.airportsError()
        ? 'Cannot search flights: Airport data failed to load. Please retry loading airports.'
        : 'Source and destination airports must be different.';

      this.flightsError.set(errorMessage);
      this.flightResults.set([]);
      return [];
    }

    this.isFlightsLoading.set(true);
    this.flightsError.set(null);
    this.flightsErrorStatus.set(null);
    this.hasSearched.set(true);

    const formattedDate = this.formatDateToLocalISO(this.startDate());

    const params = new HttpParams()
      .set('source', source.airportCode)
      .set('destination', destination.airportCode)
      .set('date', formattedDate)
      .set('totalPassenger', this.totalCount());

    try {
      const results = await firstValueFrom(
        this.http.get<FlightDetails[]>(`${this.API_URL}/flights/search`, { params }),
      );
      this.flightResults.set(results);
      this.flightsErrorStatus.set(null);
      return results;
    } catch (err: unknown) {
      const message = this.extractErrorMessage(err, 'Failed to execute flight search.');
      this.flightsError.set(message);
      this.flightsErrorStatus.set(err instanceof HttpErrorResponse ? err.status : null);
      this.flightResults.set([]);
      return [];
    } finally {
      this.isFlightsLoading.set(false);
    }
  }

  public onSearch(): void {
    this.fetchFlightSearchResults();
  }

  public async retryFetchAirportsAndSearch(): Promise<void> {
    const airports = await this.fetchAirports();
    if (airports.length >= 2) {
      await this.fetchFlightSearchResults();
    }
  }

  private extractErrorMessage(err: unknown, fallbackMessage: string): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Unable to connect to the server. Please verify your internet connection or check if the service is running.';
      }

      const backendError = err.error as BackendError | undefined;
      if (backendError && typeof backendError === 'object') {
        if (backendError.message && backendError.message.trim().length > 0) {
          return backendError.message;
        }
        if (backendError.error && backendError.error.trim().length > 0) {
          return backendError.error;
        }
      }

      if (err.status >= 500) {
        return 'Internal server error. Please try again later.';
      }
    } else if (err instanceof Error && err.message) {
      return err.message;
    }

    return fallbackMessage;
  }
}
