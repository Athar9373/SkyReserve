import { Component, input, output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmButtonImports } from '../../../../../../../shared/button/src';
import { lucideChevronDown, lucideHeart, lucideMoveRight } from '@ng-icons/lucide';
import { FlightDetails } from '../../../../../core/api/flight/model/types';

@Component({
  imports: [CommonModule, NgIcon, HlmButtonImports, CurrencyPipe],
  providers: [
    provideIcons({
      lucideHeart,
      lucideChevronDown,
      lucideMoveRight,
    }),
  ],
  selector: 'app-flight-card',
  styleUrl: './flight-card.css',
  template: ` <div class="flex items-center justify-center w-full">
    <div
      class="flex flex-col sm:flex-row w-[90vw] sm:w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl p-2 sm:p-3 relative"
    >
      <!-- ================= LEFT: FLIGHT DETAILS ================= -->
      <div
        class="w-full flex-1 border-b sm:border-b-0 sm:border-r-2 border-gray-200 sm:border-gray-300 px-3 sm:px-5 py-3 sm:border-dashed"
      >
        <!-- Mobile Header (Logo + Airline Name + Heart Icon) -->
        <div class="flex sm:hidden items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <img
              [src]="
                'https://imgak.mmtcdn.com/flights/assets/media/dt/common/icons/' +
                flightData().airlineCode +
                '.png?v=20'
              "
              [alt]="flightData().airlineName"
              class="h-7 w-7 rounded object-contain"
            />
            <span class="text-xs font-semibold text-gray-700">
              {{ flightData().airlineName }}
            </span>
          </div>
        </div>

        <!-- Desktop Header (Text Info) -->
        <div class="hidden sm:flex mb-3 items-center justify-between">
          <p class="text-xs font-semibold text-gray-700">
            {{ flightData().airlineName }} • {{ flightData().flightNum }}
          </p>
        </div>

        <!-- Main Flight Details Row -->
        <div class="flex items-center gap-x-3 sm:gap-x-5">
          <!-- Desktop Airline Logo (Vertically Centered) -->
          <img
            [src]="
              'https://imgak.mmtcdn.com/flights/assets/media/dt/common/icons/' +
              flightData().airlineCode +
              '.png?v=20'
            "
            [alt]="flightData().airlineName"
            class="hidden sm:block h-12 w-12 shrink-0 rounded-xl object-contain self-center"
          />

          <!-- Flight Route -->
          <div
            class="flex min-w-0 flex-1 items-center justify-between min-[450px]:justify-center gap-2 sm:gap-6"
          >
            <!-- Departure -->
            <div class="shrink-0 text-center sm:text-right">
              <h2 class="text-xl sm:text-2xl font-bold sm:font-medium text-gray-900">
                {{ formatTo24Hour(flightData().departureTime) }}
              </h2>
              <p class="text-xs sm:text-sm font-medium sm:font-light text-gray-500 uppercase">
                {{ flightData().sourceAirport.airportCode }}
              </p>
            </div>

            <!-- ================= TIMELINE ================= -->
            <div class="flex min-w-24 sm:min-w-32 max-w-36 flex-1 flex-col items-center">
              <!-- Duration -->
              <p class="text-[11px] sm:text-xs text-gray-500">
                {{ formatDuration(flightData().durationMinutes) }}
              </p>

              <!-- Timeline Line & Plane -->
              <div class="flex w-full items-center my-1">
                <!-- Continuous Line -->
                <div class="h-0.5 flex-1 bg-gray-300"></div>

                <!-- Plane -->
                <div class="ml-1 h-3.5 w-3.5 shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 12 12"
                    class="h-full w-full fill-gray-500"
                    aria-hidden="true"
                  >
                    <path
                      d="M3.922 12h.499a.52.52 0 0 0 .444-.247L7.949 6.8l3.233-.019A.8.8 0 0 0 12 6a.8.8 0 0 0-.818-.781L7.949 5.2 4.866.246A.53.53 0 0 0 4.421 0h-.499a.523.523 0 0 0-.489.71L5.149 5.2H2.296l-.664-1.33a.52.52 0 0 0-.436-.288L0 3.509 1.097 6 0 8.491l1.196-.073a.52.52 0 0 0 .436-.288l.664-1.33h2.853l-1.716 4.49a.523.523 0 0 0 .489.71"
                    />
                  </svg>
                </div>
              </div>

              <!-- Direct Status -->
              <p class="text-[11px] sm:text-[12px] font-semibold text-emerald-600">Direct</p>
            </div>

            <!-- Arrival -->
            <div class="shrink-0 text-center sm:text-left">
              <h2 class="text-xl sm:text-2xl font-bold sm:font-medium text-gray-900">
                {{ formatTo24Hour(flightData().arrivalTime) }}
              </h2>
              <p class="text-xs sm:text-sm font-medium sm:font-light text-gray-500 uppercase">
                {{ flightData().destAirport.airportCode }}
              </p>
            </div>
          </div>
        </div>

        <!-- Amenities / Details Action Row (Visible on sm and up) -->
        <div
          class="hidden sm:flex px-2 py-1.5 bg-[linear-gradient(91deg,#eaf3ff_0.97%,#fff_67.37%)] rounded-md gap-2 mt-4 items-center justify-start"
        >
          <div
            class="flex gap-x-1.5 border-r justify-center items-center pr-3 border-gray-300 border-dashed"
          >
            <img
              src="https://imgak.mmtcdn.com/flights/assets/media/dt/common/amenitiesV2/beverages.png"
              alt="Beverages"
              width="14"
              height="14"
            />
            <img
              src="https://imgak.mmtcdn.com/flights/assets/media/mobile/common/2X/amenityLayout.webp"
              alt="Layout"
              width="14"
              height="14"
            />
            <p class="text-[13px] font-medium text-gray-600">Standard Amenities</p>
          </div>
          <div
            class="flex gap-x-2 items-center cursor-pointer"
            (click)="onFlightSelect.emit(flightData())"
          >
            <img
              src="https://imgak.mmtcdn.com/flights/assets/media/dt/listing/flightDetails.png"
              alt="flightDetails"
              class="w-3.5 h-3.5"
            />
            <div class="flex items-center gap-1">
              <p class="text-[13px] font-medium text-gray-600">More flight details</p>
              <ng-icon
                name="lucideChevronDown"
                size="14"
                class="text-blue-600 [&>svg]:stroke-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ================= RIGHT / BOTTOM: PRICE & ACTION ================= -->
      <div
        class="flex w-full sm:w-60 shrink-0 flex-row sm:flex-col items-center sm:items-stretch justify-between sm:justify-center bg-white p-2 sm:p-4 gap-3 mt-2 sm:mt-0"
      >
        <!-- Price Container -->
        <div class="text-left sm:text-center sm:self-start">
          <p class="text-[10px] sm:hidden text-gray-500 font-medium">Starting from</p>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 min-[400px]:text-2xl:">
            {{ flightData().price | currency: 'INR' : 'symbol' : '1.0-0' }}
          </h2>
        </div>

        <!-- CTA Button -->
        <button
          hlmBtn
          variant="outline"
          size="lg"
          (click)="showFaresModal.emit(flightData())"
          class="flex w-auto sm:w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#004282] px-4 py-2.5 text-xs sm:text-sm font-bold uppercase text-white active:scale-[0.98]! hover:bg-[#003366]"
        >
          Select
          <ng-icon name="lucideMoveRight" size="16" class="text-white [&>svg]:stroke-white" />
        </button>
      </div>
    </div>
  </div>`,
})
export class FlightCard {
  flightData = input.required<FlightDetails>();
  onFlightSelect = output<FlightDetails>();
  showFaresModal = output<FlightDetails>();

  public formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  public formatTo24Hour(timeString: string): string {
    if (!timeString) return '';
    const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return timeString;

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const modifier = match[3];

    if (modifier) {
      if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }

    const formattedHours = hours.toString().padStart(2, '0');
    return `${formattedHours}:${minutes}`;
  }
}
