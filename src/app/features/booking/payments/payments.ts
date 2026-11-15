import { Component, input, output, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCreditCard, lucideLock, lucideShieldCheck, lucideWifiOff } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { BookingService } from '../../../core/booking/booking';
import { PaymentReqDto } from '../../../core/booking/model/bookingModel';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    HlmButtonImports,
    HlmInputImports,
    HlmSpinnerImports,
  ],
  providers: [
    provideIcons({
      lucideCreditCard,
      lucideLock,
      lucideShieldCheck,
      lucideWifiOff,
    }),
  ],
  templateUrl: './payments.html',
})
export class PaymentComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  public readonly bookingService = inject(BookingService);

  // Network Status Signal
  public isOffline = signal<boolean>(!navigator.onLine);

  // Modern Signal Input and Output
  public readonly totalAmount = input<number>(0);
  public paymentSubmitted = output<PaymentReqDto>();

  public paymentForm: FormGroup = this.fb.group({
    cardNumber: ['', [Validators.required, Validators.pattern('^[0-9]{16}$')]],
    cardHolderName: ['', [Validators.required, Validators.minLength(3)]],
    cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3,4}$')]],
  });

  private readonly handleOnline = () => this.isOffline.set(false);
  private readonly handleOffline = () => this.isOffline.set(true);

  ngOnInit(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  public onSubmit(): void {
    if (this.isOffline()) {
      return;
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const payload: PaymentReqDto = {
      cardNumber: this.paymentForm.value.cardNumber,
      cardHolderName: this.paymentForm.value.cardHolderName,
      cvv: this.paymentForm.value.cvv,
      paymentMethod: 'CREDIT_CARD',
    };

    this.paymentSubmitted.emit(payload);
  }
}
