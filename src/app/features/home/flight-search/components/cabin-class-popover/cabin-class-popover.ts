import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { BrnPopoverImports } from '@spartan-ng/brain/popover';
import { HlmButtonImports } from '../../../../../../../shared/button/src';
import { HlmPopoverImports } from '../../../../../../../shared/popover/src';
import { CabinOption } from '../../../../../core/api/flight/model/types';
import { FlightService } from '../../../../../core/api/flight/flightService';

@Component({
  selector: 'app-cabin-class-popover',
  imports: [BrnPopoverImports, HlmPopoverImports, HlmButtonImports, NgIcon, FormsModule],
  providers: [
    provideIcons({
      lucideChevronDown,
    }),
  ],
  templateUrl: './cabin-class-popover.html',
  styleUrl: './cabin-class-popover.css',
})
export class CabinClassPopover {
  flighService = inject(FlightService);
  readonly cabinOption: CabinOption = this.flighService.selectedCabinClass();

  public readonly popoverState = signal<'open' | 'closed'>('closed');

  onPopoverStateChange(state: 'open' | 'closed') {
    this.popoverState.set(state);
  }
}
