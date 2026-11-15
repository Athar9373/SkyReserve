import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { BrnPopoverImports } from '@spartan-ng/brain/popover';
import { HlmButtonImports } from '../../../../../../../shared/button/src';
import { HlmPopoverImports } from '../../../../../../../shared/popover/src';
import { DualCalendarGrid, DateRange } from '../dual-calendar-grid/dual-calendar-grid';
import { FlightService } from '../../../../../core/api/flight/flightService';

@Component({
  selector: 'depature-date-picker',
  standalone: true,
  imports: [
    DatePipe,
    NgIcon,
    BrnPopoverImports,
    HlmPopoverImports,
    HlmButtonImports,
    DualCalendarGrid,
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
    }),
  ],
  templateUrl: 'departue-date-picker.html',
})
export class DepartureDatePicker {
  private readonly flightService = inject(FlightService);

  public readonly startDate = this.flightService.startDate;

  // Pass only start date so the calendar renders only 1 selected day
  public readonly dateRange = computed<DateRange>(() => ({
    start: this.startDate(),
    end: null,
  }));

  onDepartureSelect(date: Date, ctx: { close: () => void }) {
    this.startDate.set(date);
    ctx.close();
  }
}
