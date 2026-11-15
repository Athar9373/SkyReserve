import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import { HlmButtonImports } from '../../../../../../../shared/button/src';
import { FlightService } from '../../../../../core/api/flight/flightService';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

@Component({
  selector: 'app-dual-calendar-grid',
  standalone: true,
  imports: [HlmButtonImports, NgIcon, DatePipe],
  providers: [
    provideIcons({
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
  templateUrl: './dual-calendar-grid.html',
})
export class DualCalendarGrid {
  /** Mode: 'single' selects one date, 'range' completes start/end */
  readonly flightService = inject(FlightService);
  public readonly mode = input<'single' | 'range'>('single');

  /** Single selected date (used in single mode) */
  public readonly selectedDate = input<Date | null>(null);

  /** Range (used in range mode for return dates) */
  public readonly selectedRange = input<DateRange>({ start: null, end: null });

  /** Min/Max limits */
  public readonly minSelectableDate = input<Date>();
  public readonly minDate = computed(() => this.minSelectableDate() ?? new Date());
  public readonly maxDate = new Date(new Date().setMonth(new Date().getMonth() + 12));

  /** Outputs */
  public readonly dateSelect = output<Date>();
  public readonly rangeSelect = output<DateRange>();

  public readonly hoveredDate = signal<Date | null>(null);
  public readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  public readonly firstMonth = signal<Date>(this.flightService.startDate() ?? new Date());

  public readonly secondMonth = computed(() => {
    const next = new Date(this.firstMonth());
    next.setMonth(next.getMonth() + 1, 1);
    return next;
  });

  public readonly firstMonthDays = computed(() => this.generateMonthGrid(this.firstMonth()));
  public readonly secondMonthDays = computed(() => this.generateMonthGrid(this.secondMonth()));

  onDateClick(date: Date) {
    if (this.isDateDisabled(date)) return;

    if (this.mode() === 'single') {
      this.dateSelect.emit(date);
    } else {
      // Return Picker Range Selection
      const currentRange = this.selectedRange();
      this.rangeSelect.emit({ start: currentRange.start, end: date });
    }
  }

  onDateHover(date: Date) {
    if (this.mode() === 'range' && this.selectedRange().start && !this.selectedRange().end) {
      this.hoveredDate.set(date);
    }
  }

  getDayClasses(date: Date): string {
    const time = this.normalizeDate(date).getTime();
    const base =
      'h-10 w-full text-sm font-semibold transition-all flex items-center justify-center ';

    if (this.mode() === 'single') {
      const selected = this.selectedDate()
        ? this.normalizeDate(this.selectedDate()!).getTime()
        : null;
      if (selected && time === selected) {
        return base + 'bg-primary text-primary-foreground z-10 shadow-sm rounded-md';
      }
      return (
        base +
        'text-slate-700 hover:bg-slate-100 rounded-full disabled:opacity-30 disabled:hover:bg-transparent'
      );
    }

    // Range Mode Highlight Logic
    const start = this.selectedRange().start
      ? this.normalizeDate(this.selectedRange().start!).getTime()
      : null;
    const end = this.selectedRange().end
      ? this.normalizeDate(this.selectedRange().end!).getTime()
      : null;
    const hover = this.hoveredDate() ? this.normalizeDate(this.hoveredDate()!).getTime() : null;

    const isStart = start !== null && time === start;
    const isEnd = end !== null && time === end;
    const activeEnd = end ?? (start && hover && hover >= start ? hover : null);
    const isInRange = start !== null && activeEnd !== null && time > start && time < activeEnd;

    if (isStart) {
      return (
        base +
        'bg-primary text-primary-foreground z-10 shadow-sm rounded-md ' +
        (activeEnd ? '' : 'rounded-md')
      );
    }

    if (isEnd || (start && hover && time === hover && hover > start && !end)) {
      return base + 'bg-primary text-primary-foreground z-10 shadow-sm rounded-md ';
    }

    if (isInRange) {
      return base + 'bg-primary/15 text-primary rounded-none';
    }

    return (
      base +
      'text-slate-700 hover:bg-slate-100 rounded-full disabled:opacity-30 disabled:hover:bg-transparent'
    );
  }

  isDateDisabled(date: Date): boolean {
    const min = this.normalizeDate(this.minDate());
    const current = this.normalizeDate(date);
    return current < min;
  }

  previousMonth() {
    this.firstMonth.update((current) => {
      const prev = new Date(current);
      prev.setMonth(prev.getMonth() - 1, 1);
      return prev;
    });
  }

  nextMonth() {
    this.firstMonth.update((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + 1, 1);
      return next;
    });
  }

  isPrevDisabled(): boolean {
    return (
      this.firstMonth().getFullYear() === this.minDate().getFullYear() &&
      this.firstMonth().getMonth() <= this.minDate().getMonth()
    );
  }

  isNextDisabled(): boolean {
    return (
      this.secondMonth().getFullYear() === this.maxDate.getFullYear() &&
      this.secondMonth().getMonth() >= this.maxDate.getMonth()
    );
  }

  private generateMonthGrid(monthDate: Date): (Date | null)[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid: (Date | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(new Date(year, month, day));
    }
    return grid;
  }

  private normalizeDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
