import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucideUser } from '@ng-icons/lucide';
import { HlmInputImports } from '../../../../../../shared/input/src';

@Component({
  selector: 'app-passenger-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconComponent, HlmInputImports],
  providers: [
    provideIcons({
      lucideTrash2,
      lucideUser,
    }),
  ],
  templateUrl: './passenger-card.html',
})
export class PassengerCardComponent {
  public readonly passengerGroup = input<FormGroup | null>(null);
  public readonly index = input<number>(0);
  public readonly canRemove = input<boolean>(false);

  public readonly remove = output<void>();

  public setGender(gender: 'MALE' | 'FEMALE'): void {
    this.passengerGroup()?.get('gender')?.setValue(gender);
  }
}
