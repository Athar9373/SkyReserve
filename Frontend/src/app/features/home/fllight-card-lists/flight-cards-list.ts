import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideHeart,
  lucideChevronDown,
  lucideMoveRight,
  lucideChevronUp,
  lucideAlertCircle,
  lucideRefreshCw,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '../../../../../shared/button/src';
import { HlmSpinnerImports } from '../../../../../shared/spinner/src';
import { Router } from '@angular/router';
import { FlightDetailsModel } from './components/flight-details-model/flight-details-model';
import { FlightCard } from './components/flight-card/flight-card';
import { FlightCardService } from '../flight-search/service/flight-card';
import { FlightDetails } from '../../../core/api/flight/model/types';
import { FlightService } from '../../../core/api/flight/flightService';
import { EmptyStateComponent } from '../../empty-state/empty-state';

@Component({
  selector: 'app-flight-card-list',
  standalone: true,
  imports: [
    CommonModule,

    HlmButtonImports,
    HlmSpinnerImports,
    FlightDetailsModel,
    FlightCard,
    EmptyStateComponent,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideHeart,
      lucideChevronDown,
      lucideMoveRight,
      lucideChevronUp,
      lucideAlertCircle,
      lucideRefreshCw,
    }),
  ],
  templateUrl: './flight-cards-list.html',
})
export class FlightCardList {
  private readonly flightCardService = inject(FlightCardService);
  private readonly flightService = inject(FlightService);
  private readonly router = inject(Router);

  public readonly flightData = this.flightService.flightResults;
  public readonly isFlightsLoading = this.flightService.isFlightsLoading;
  public readonly flightsError = this.flightService.flightsError;
  public readonly hasSearched = this.flightService.hasSearched;
  public readonly flightID = this.flightService.flightID;
  public readonly isSameAirport = this.flightService.isSameAirport;

  public readonly FareViewModal = this.flightCardService.FareViewModal;
  public readonly showFlightDetailsModel = this.flightCardService.showFlightDetailsModel;
  public readonly selectedFlight = this.flightCardService.selectedFlight;

  public onFlightSelectFromCard(flight: FlightDetails): void {
    this.selectedFlight.set(flight);
  }

  public onFlightSelectFromModal(): void {
    this.selectedFlight.set(null);
  }

  public onFaresViewClick(flightData: FlightDetails): void {
    this.flightCardService.proceedToSeatSelection(flightData);

    const travelerCount = this.flightService.totalCount() || 1;
    this.flightID.set(Number(flightData.flightId));

    this.router.navigate(['/booking']);
  }

  public onSearchFlights(): void {
    this.flightService.fetchFlightSearchResults();
  }
}
