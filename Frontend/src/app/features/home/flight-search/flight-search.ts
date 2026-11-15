import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeftRight } from '@ng-icons/lucide';
import { CityPopover } from './components/city-popover/city-popover';
import { DepartureDatePicker } from './components/departue-date-picker/departue-date-picker';
import { Travellers } from './components/travellers/travellers';
import { CabinClassPopover } from './components/cabin-class-popover/cabin-class-popover';
import { Airport } from '../../../core/api/flight/model/types';
import { FlightService } from '../../../core/api/flight/flightService';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [
    CityPopover,
    NgIcon,
    DepartureDatePicker,
    Travellers,
    CabinClassPopover,
    CabinClassPopover,
  ],
  providers: [
    provideIcons({
      lucideArrowLeftRight,
    }),
  ],
  templateUrl: './flight-search.html',
})
export class FlightSearch {
  flightService = inject(FlightService);
  startDate = this.flightService.startDate;

  fromCity = this.flightService.fromCity;

  toCity = this.flightService.toCity;

  onFromCityChange(city: Airport) {
    this.fromCity.set(city);
  }

  onToCityChange(city: Airport) {
    this.toCity.set(city);
  }

  swapCities() {
    const currentFrom = this.fromCity();

    this.fromCity.set(this.toCity());
    this.toCity.set(currentFrom);
  }

  setStartDate(date: Date): void {
    this.startDate.set(date);
    console.log(this.startDate());

    const endDate = new Date(this.startDate());
    endDate.setDate(endDate.getDate() + 1);
  }

  onSearch() {
    this.flightService.onSearch();
  }
}
