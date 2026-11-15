import { Component, inject, signal } from '@angular/core';
import { BrnPopoverImports } from '@spartan-ng/brain/popover';
import { HlmButtonImports } from '../../../../../../../shared/button/src';
import { HlmPopoverImports } from '../../../../../../../shared/popover/src';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { HlmRadioGroupImports } from '../../../../../../../shared/radio-group/src';
import { FormsModule } from '@angular/forms';
import { TravelerCountPickerComponent } from '../traveler-count-picker-component/traveler-count-picker-component';
import { FlightService } from '../../../../../core/api/flight/flightService';

@Component({
  selector: 'app-travellers',
  standalone: true,
  imports: [
    BrnPopoverImports,
    HlmPopoverImports,
    HlmButtonImports,
    NgIcon,
    FormsModule,
    HlmRadioGroupImports,
    TravelerCountPickerComponent,
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
    }),
  ],
  templateUrl: './travellers.html',
  styleUrl: './travellers.css',
})
export class Travellers {
  private readonly flightService = inject(FlightService);

  // Directly bind signals from service
  totalCount = this.flightService.totalCount;

  popoverState = signal<'open' | 'closed'>('closed');

  onPopoverStateChange(state: 'open' | 'closed') {
    this.popoverState.set(state);
  }
}
