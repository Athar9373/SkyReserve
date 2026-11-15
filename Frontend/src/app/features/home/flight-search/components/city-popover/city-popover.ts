import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnPopoverImports } from '@spartan-ng/brain/popover';
import { HlmButtonImports } from '../../../../../../../shared/button/src';
import { HlmInputGroupImports } from '../../../../../../../shared/input-group/src';
import { HlmPopoverImports } from '../../../../../../../shared/popover/src';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { Airport } from '../../../../../core/api/flight/model/types';
import { FlightService } from '../../../../../core/api/flight/flightService';

@Component({
  selector: 'city-popover',
  imports: [
    BrnPopoverImports,
    HlmPopoverImports,
    HlmButtonImports,
    HlmInputGroupImports,
    NgIcon,
    FormsModule,
  ],
  providers: [
    provideIcons({
      lucideSearch,
    }),
  ],
  templateUrl: './city-popover.html',
})
export class CityPopover implements OnInit {
  flightService = inject(FlightService);

  // Inputs & Outputs
  city = input.required<Airport>();
  label = input.required<'FROM' | 'TO'>();
  cityChange = output<Airport>();

  // Local state signals
  citySearchQuery = signal('');
  popoverState = signal<'open' | 'closed'>('closed');

  // Reactively filter airports from service signal state
  filteredAirports = computed(() => {
    const query = this.citySearchQuery().toLowerCase().trim();
    const airports = this.flightService.airports();

    if (!query) {
      return airports;
    }

    return airports.filter(
      (airport) =>
        airport.city.toLowerCase().includes(query) ||
        airport.airportCode.toLowerCase().includes(query) ||
        airport.name.toLowerCase().includes(query) ||
        airport.country.toLowerCase().includes(query),
    );
  });

  ngOnInit() {
    // Automatically trigger API call if list is currently empty
    if (this.flightService.airports().length === 0) {
      this.flightService.fetchAirports();
    }
  }

  selectCity(airport: Airport) {
    this.cityChange.emit(airport);
    this.popoverState.set('closed');
    this.citySearchQuery.set('');
  }

  onPopoverStateChange(state: 'open' | 'closed') {
    this.popoverState.set(state);
  }
}
