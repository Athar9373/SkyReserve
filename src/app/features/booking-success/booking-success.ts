import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideCheckCircle2,
  lucidePlane,
  lucideDownload,
  lucideHome,
  lucideCalendar,
  lucideHash,
  lucideCreditCard,
  lucideArrowLeft,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '../../../../shared/button/src';
import { BookingService } from '../../core/booking/booking';
import { NotFound } from '../not-found/not-found';

interface BookingSuccessDetails {
  bookingId: string | null;
  pnr: string | null;
  transactionId: string | null;
}

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, HlmButtonImports, NotFound],
  providers: [
    provideIcons({
      lucideCheckCircle2,
      lucidePlane,
      lucideHome,
      lucideCalendar,
      lucideHash,
      lucideCreditCard,
      lucideArrowLeft,
    }),
  ],
  templateUrl: './booking-success.html',
})
export class BookingSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  paymentSuccess = this.bookingService.paymentSuccessful();
  public readonly bookingDetails = signal<BookingSuccessDetails>({
    bookingId: null,
    pnr: null,
    transactionId: null,
  });

  public readonly bookingDate = signal<Date>(new Date());

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.bookingDetails.set({
        bookingId: params['bookingId'] || null,
        pnr: params['pnr'] || null,
        transactionId: params['transactionId'] || null,
      });
    });
  }

  public printTicket(): void {
    window.print();
  }
}
