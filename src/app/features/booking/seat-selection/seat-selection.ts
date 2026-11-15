import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seat } from '../../../core/booking/model/bookingModel';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-selection.html',
})
export class SeatSelectionComponent {
  public seats = input.required<Seat[]>();
  public maxSeats = input<number>(1);

  // Emits selected seats up to the parent component
  public seatSelected = output<Seat[]>();

  public selectedSeatIds = signal<number[]>([]);

  /**
   * Group seats into rows of 6 (3 left, 3 right) based on seat index or seat row
   */
  public seatRows = computed(() => {
    const rawSeats = this.seats() || [];
    const rows: { left: Seat[]; right: Seat[] }[] = [];

    for (let i = 0; i < rawSeats.length; i += 6) {
      const chunk = rawSeats.slice(i, i + 6);
      rows.push({
        left: chunk.slice(0, 3),
        right: chunk.slice(3, 6),
      });
    }

    return rows;
  });

  constructor() {
    // Trim selected seats if maxSeats dynamically reduces
    effect(() => {
      const max = this.maxSeats();
      const current = this.selectedSeatIds();
      if (current.length > max) {
        const trimmed = current.slice(0, max);
        this.selectedSeatIds.set(trimmed);

        const selectedObjects = this.seats().filter((s) => trimmed.includes(s.seatId));
        this.seatSelected.emit(selectedObjects);
      }
    });
  }

  public toggleSeat(seat: Seat): void {
    if (!seat.isAvailable) return;

    const currentSelected = this.selectedSeatIds();
    const isAlreadySelected = currentSelected.includes(seat.seatId);
    let updatedIds: number[];

    if (isAlreadySelected) {
      updatedIds = currentSelected.filter((id) => id !== seat.seatId);
    } else {
      if (currentSelected.length >= this.maxSeats()) return;
      updatedIds = [...currentSelected, seat.seatId];
    }

    this.selectedSeatIds.set(updatedIds);

    // Emit the full Seat objects array back to the parent
    const selectedObjects = this.seats().filter((s) => updatedIds.includes(s.seatId));
    this.seatSelected.emit(selectedObjects);
  }

  public isSelected(seatId: number): boolean {
    return this.selectedSeatIds().includes(seatId);
  }

  public getLocationBadge(location: string): string {
    switch (location) {
      case 'WINDOW':
        return 'W';
      case 'AISLE':
        return 'A';
      default:
        return 'M';
    }
  }

  public getSeatButtonClass(seat: Seat): string {
    const selected = this.isSelected(seat.seatId);
    const limitReached = this.selectedSeatIds().length >= this.maxSeats();

    if (!seat.isAvailable) {
      return 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed select-none';
    }
    if (selected) {
      return 'border-sky-600 bg-sky-50 shadow-xs';
    }
    if (limitReached) {
      return 'border-gray-200 bg-white opacity-60 cursor-not-allowed';
    }
    return 'border-gray-200 bg-white hover:border-sky-400 cursor-pointer';
  }

  public getBadgeClass(seat: Seat): string {
    const selected = this.isSelected(seat.seatId);

    if (!seat.isAvailable) {
      return 'bg-gray-300 text-gray-500';
    }
    if (selected) {
      return 'bg-sky-600 text-white';
    }
    return 'bg-gray-200 text-gray-700';
  }

  public getTextColorClass(seat: Seat, isSubtext: boolean = false): string {
    const selected = this.isSelected(seat.seatId);

    if (!seat.isAvailable) {
      return 'text-gray-400';
    }
    if (selected) {
      return isSubtext ? 'text-sky-600' : 'text-sky-900';
    }
    return isSubtext ? 'text-gray-500' : 'text-gray-900';
  }
}
