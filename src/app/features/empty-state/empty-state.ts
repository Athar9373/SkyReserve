import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucidePlaneTakeoff,
  lucideSearchX,
  lucideAlertCircle,
  lucideRefreshCw,
} from '@ng-icons/lucide';
import { BookingService } from '../../core/booking/booking';
import { FlightService } from '../../core/api/flight/flightService';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      lucidePlaneTakeoff,
      lucideSearchX,
      lucideAlertCircle,
      lucideRefreshCw,
    }),
  ],
  templateUrl: './empty-state.html',
})
export class EmptyStateComponent {
  public readonly type = input<'initial' | 'empty' | 'error'>('initial');
  public readonly errorMessage = input<string>(
    'We could not connect to our servers. Please check your network connection or try again later.',
  );

  public readonly retry = output<void>();
}
