import { Service, signal } from '@angular/core';
import { FlightDetails } from '../../../../core/api/flight/model/types';

@Service()
export class FlightCardService {
  FareViewModal = signal<FlightDetails | null>(null);
  showFlightDetailsModel = signal<boolean>(false);
  selectedFlight = signal<FlightDetails | null>(null);

  proceedToSeatSelection(selectedFlight: FlightDetails | null): void {
    console.log(selectedFlight);
  }
}
