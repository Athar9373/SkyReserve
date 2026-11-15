import { Component, input, output, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { HlmButtonImports } from '../../../../../shared/button/src';
import { HlmSpinnerImports } from '../../../../../shared/spinner/src';
import { PassengerReqDto } from '../../../core/booking/model/bookingModel';
import { BookingService } from '../../../core/booking/booking';
import { PassengerCardComponent } from './passenger-card/passenger-card';

export const slideFadeAnim = trigger('slideFade', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-12px)' }),
    animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate(
      '200ms ease-in',
      style({ opacity: 0, transform: 'translateY(-12px)', height: 0, margin: 0, padding: 0 }),
    ),
  ]),
]);

@Component({
  selector: 'app-passenger-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    HlmButtonImports,
    HlmSpinnerImports,
    PassengerCardComponent,
  ],
  providers: [
    provideIcons({
      lucidePlus,
    }),
  ],
  animations: [slideFadeAnim],
  templateUrl: './passenger-details.html',
})
export class PassengerDetailsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  public readonly bookingService = inject(BookingService);

  passengerSubmitted = this.bookingService.passengerSubmitted;
  public readonly travelerCount = input<number>(1);
  public readonly isSaving = input<boolean>(false);
  public formSubmitted = output<PassengerReqDto[]>();

  public passengerForm!: FormGroup;

  constructor() {
    effect(() => {
      const count = this.travelerCount();
      if (this.passengerForm) {
        this.syncPassengerCount(count);
      }
    });
  }

  ngOnInit(): void {
    this.passengerForm = this.fb.group({
      passengers: this.fb.array([]),
    });

    this.syncPassengerCount(this.travelerCount());
  }

  get passengers(): FormArray {
    return this.passengerForm.get('passengers') as FormArray;
  }

  public createPassengerGroup(initialData?: Partial<PassengerReqDto>): FormGroup {
    return this.fb.group({
      firstName: [initialData?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [initialData?.lastName || '', [Validators.required, Validators.minLength(2)]],
      gender: [initialData?.gender || 'MALE', Validators.required],
      nationality: [initialData?.nationality || 'Indian', Validators.required],
      passportNumber: [initialData?.passportNumber || ''],
      countryCode: ['+91'],
      mobileNo: [
        initialData?.phoneNumber?.replace('+91', '') || '',
        [Validators.pattern('^[0-9]{10}$')],
      ],
      email: [initialData?.email || '', [Validators.email]],
    });
  }

  private syncPassengerCount(count: number): void {
    while (this.passengers.length < count) {
      this.passengers.push(this.createPassengerGroup());
    }

    while (this.passengers.length > count) {
      this.passengers.removeAt(this.passengers.length - 1);
    }
  }

  public addNewUserSlot(): void {
    if (this.passengers.length < this.travelerCount()) {
      this.passengers.push(this.createPassengerGroup());
    }
  }

  public removePassengerSlot(index: number): void {
    if (this.passengers.length > 1) {
      this.passengers.removeAt(index);
    }
  }

  public onSubmit(): void {
    if (this.passengerForm.valid) {
      const rawValues = this.passengerForm.value;

      const payload: PassengerReqDto[] = rawValues.passengers.map((p: any) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.gender,
        nationality: p.nationality,
        passportNumber: p.passportNumber || undefined,
        email: p.email || undefined,
        phoneNumber: p.mobileNo ? `${p.countryCode}${p.mobileNo}` : undefined,
      }));

      this.formSubmitted.emit(payload);
    } else {
      this.passengerForm.markAllAsTouched();
    }
  }
}
