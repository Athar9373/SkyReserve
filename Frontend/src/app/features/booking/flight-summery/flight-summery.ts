import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SelectedFlightDetails } from '../../../core/booking/model/bookingModel';

@Component({
  imports: [DatePipe],
  selector: 'app-flight-summery',
  styleUrl: './flight-summery.css',
  standalone: true,
  template: `
    <div class="w-full max-w-3xl md:max-w-4xl mx-auto space-y-4">
      <!-- Top Alert Notice -->
      <div
        class="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-xs sm:text-sm text-gray-800"
      >
        <div class="bg-amber-500 text-white p-1 rounded-full shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
            />
          </svg>
        </div>
        <span>
          Your flight departs from
          <strong class="text-amber-800">{{ flightData().sourceAirport.city }}</strong>
          ({{ flightData().sourceAirport.name }}).
        </span>
      </div>

      <!-- Main Segment Card -->
      <div class="border border-gray-200 rounded-2xl p-4 sm:p-6 bg-white shadow-xs space-y-4">
        <!-- Header Section -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-l-4 border-teal-500 pl-3"
        >
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-gray-900">
              {{ flightData().sourceAirport.city }} → {{ flightData().destAirport.city }}
            </h2>
            <div class="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm text-gray-600">
              <span class="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-xs">
                {{ flightData().departureTime | date: 'EEEE, MMM d' }}
              </span>
              <span>•</span>
              <span>Direct</span>
            </div>
          </div>

          <div class="flex items-center gap-3 self-start sm:self-auto">
            <span
              class="bg-emerald-700 text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
            >
              {{ flightData().status }}
            </span>
            <button
              type="button"
              class="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
            >
              View Fare Rules
            </button>
          </div>
        </div>

        <!-- Carrier & Class Info -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div class="flex items-center gap-2">
            <img
              [src]="
                'https://imgak.mmtcdn.com/flights/assets/media/dt/common/icons/' +
                flightData().airline.airlineCode +
                '.png?v=20'
              "
              [alt]="flightData().airline.name"
              class="h-6 w-6 rounded object-contain shrink-0"
            />
            <span class="text-sm font-bold text-gray-800">{{ flightData().airline.name }}</span>
            <span class="text-xs font-medium text-gray-500">{{ flightData().flightNum }}</span>
            <span
              class="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 ml-1"
            >
              {{ flightData().aircraft.model }}
            </span>
          </div>
          <div class="text-xs font-semibold text-gray-600">
            Economy > <span class="text-teal-700 font-bold uppercase">SAVER</span>
          </div>
        </div>

        <!-- Grey Timeline Container -->
        <div class="bg-gray-50/80 rounded-xl p-4 sm:p-5 border border-gray-100 space-y-4">
          <!-- Route Timeline -->
          <div class="relative pl-6 sm:pl-8 space-y-6">
            <!-- Vertical Dotted Line -->
            <div
              class="absolute left-[11px] sm:left-[15px] top-3 bottom-3 w-[2px] border-l-2 border-dashed border-gray-400"
            ></div>

            <!-- Departure Node -->
            <div class="relative flex items-start gap-3">
              <div
                class="absolute -left-[19px] sm:-left-[23px] top-1 w-3 h-3 rounded-full border-2 border-gray-600 bg-white"
              ></div>
              <div class="flex items-baseline gap-2">
                <span class="text-sm sm:text-base font-bold text-gray-900">
                  {{ flightData().departureTime | date: 'HH:mm' }}
                </span>
                <span class="text-sm sm:text-base font-bold text-gray-900">
                  {{ flightData().sourceAirport.city }}
                </span>
              </div>
            </div>

            <!-- Departure Airport Details -->
            <p class="text-xs text-gray-500 -mt-4 ">
              {{ flightData().sourceAirport.name }} ({{ flightData().sourceAirport.airportCode }})
            </p>

            <!-- Arrival Node -->
            <div class="relative flex items-start gap-3">
              <div
                class="absolute -left-[19px] sm:-left-[23px] top-1 w-3 h-3 rounded-full border-2 border-gray-600 bg-white"
              ></div>
              <div class="flex items-baseline gap-2">
                <span class="text-sm sm:text-base font-bold text-gray-900">
                  {{ flightData().arrivalTime | date: 'HH:mm' }}
                </span>
                <span class="text-sm sm:text-base font-bold text-gray-900">
                  {{ flightData().destAirport.city }}
                </span>
              </div>
            </div>

            <!-- Arrival Airport Details -->
            <p class="text-xs text-gray-500 -mt-4 pl-0 sm:pl-0">
              {{ flightData().destAirport.name }} ({{ flightData().destAirport.airportCode }})
            </p>
          </div>

          <!-- Inline Baggage Bar -->
          <div
            class="border-t border-gray-200 pt-3 flex flex-wrap items-center gap-4 text-xs text-gray-800 font-medium"
          >
            <div class="flex items-center gap-1.5">
              <span class="text-amber-600 text-base">🧳</span>
              <span><strong>Cabin Baggage:</strong> 7 Kgs (1 piece only) / Adult</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-amber-700 text-base">🧳</span>
              <span><strong>Check-In Baggage:</strong> 15 Kgs (1 piece only) / Adult</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FlightSummery {
  flightData = input.required<SelectedFlightDetails>();
}
