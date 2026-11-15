import { Component, input, output } from '@angular/core';
import { FlightDetails } from '../../../../../core/api/flight/model/types';
import { DatePipe } from '@angular/common';

@Component({
  imports: [DatePipe],
  selector: 'app-flight-details-model',
  styleUrl: './flight-details-model.css',
  standalone: true,
  template: `
    <div
      class="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 overflow-y-auto border-white backdrop-blur-sm"
      (click)="closeModal.emit()"
    >
      <div class="flex justify-center flex-col items-center gap-3 w-full max-w-3xl">
        <div class="w-full flex justify-center items-center">
          <ng-content></ng-content>
        </div>

        <div
          class="bg-white flex flex-col gap-4 p-6 rounded-xl w-full shadow-2xl max-h-[60vh] overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div class="flex justify-between items-center">
            <h1 class="text-xl font-bold text-gray-800">Flight Details</h1>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 font-bold text-xl px-2 transition-colors cursor-pointer sticky top-0"
              (click)="closeModal.emit()"
            >
              ✕
            </button>
          </div>

          <!-- Single Flight Segment Card -->
          <div
            class="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-6 items-stretch bg-gray-50/50"
          >
            <!-- Timeline & Details -->
            <div class="flex-1 grid grid-cols-[100px_auto_1fr] gap-x-6 items-center">
              <!-- Flight Departure -->
              <div class="text-right">
                <h2 class="text-xl font-bold text-gray-900 leading-none">
                  {{ flightData().departureTime | date: 'HH:mm' }}
                </h2>
              </div>

              <div class="flex justify-center items-center py-1">
                <div
                  class="bg-blue-400 rounded-full w-3.5 h-3.5 flex justify-center items-center shrink-0"
                >
                  <div class="bg-white rounded-full w-2 h-2"></div>
                </div>
              </div>

              <div>
                <h2 class="text-xl font-bold text-gray-900 leading-tight">
                  {{ flightData().sourceAirport.city }}
                  <span class="text-sm font-semibold text-gray-500">
                    ({{ flightData().sourceAirport.airportCode }})
                  </span>
                </h2>
                <p class="text-sm text-gray-500 mt-0.5 font-light">
                  {{ flightData().sourceAirport.name }}, {{ flightData().sourceAirport.country }}
                </p>
              </div>

              <!-- Mid Flight Info -->
              <div class="text-right">
                <span class="text-[15px] font-medium text-gray-500 inline-block">
                  {{ flightData().durationMinutes }} mins
                </span>
              </div>

              <div class="flex flex-col items-center justify-center self-stretch flex-1">
                <div class="w-0.5 min-h-6 flex-1 bg-blue-300"></div>
                <img
                  [src]="
                    'https://imgak.mmtcdn.com/flights/assets/media/dt/common/icons/' +
                    flightData().airlineCode +
                    '.png?v=20'
                  "
                  [alt]="flightData().airlineName"
                  class="my-1 h-7 w-7 rounded border bg-white object-contain p-0.5 shadow-xs shrink-0"
                />
                <div class="w-0.5 min-h-6 flex-1 bg-blue-300"></div>
              </div>

              <div class="py-4">
                <p class="text-xs font-semibold text-gray-600 inline-block">
                  {{ flightData().airlineName }} • {{ flightData().flightNum }}
                </p>
              </div>

              <!-- Flight Arrival -->
              <div class="text-right">
                <h2 class="text-xl font-bold text-gray-900 leading-none">
                  {{ flightData().arrivalTime | date: 'HH:mm' }}
                </h2>
              </div>

              <div class="flex justify-center items-center py-1">
                <div
                  class="bg-blue-400 rounded-full w-3.5 h-3.5 flex justify-center items-center shrink-0"
                >
                  <div class="bg-white rounded-full w-2 h-2"></div>
                </div>
              </div>

              <div>
                <h2 class="text-xl font-bold text-gray-900 leading-tight">
                  {{ flightData().destAirport.city }}
                  <span class="text-sm font-semibold text-gray-500">
                    ({{ flightData().destAirport.airportCode }})
                  </span>
                </h2>
                <p class="text-sm text-gray-500 mt-0.5 font-light">
                  {{ flightData().destAirport.name }}, {{ flightData().destAirport.country }}
                </p>
              </div>
            </div>

            <!-- Baggage Column -->
            <div
              class="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center gap-2"
            >
              <h3 class="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Baggage Allowance
              </h3>

              <!-- Cabin Baggage -->
              <div class="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-gray-100">
                <img
                  src="https://imgak.mmtcdn.com/flights/assets/media/dt/listing/cabin_baggage_revamp.webp"
                  alt="Cabin Baggage"
                  class="w-5 h-5 object-contain"
                />
                <div class="flex flex-col">
                  <span class="text-[11px] text-gray-500 font-medium">Cabin Baggage</span>
                  <span class="text-xs font-bold text-gray-800">7 KGS/Adult</span>
                </div>
              </div>

              <!-- Check-in Baggage -->
              <div class="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-gray-100">
                <img
                  src="https://imgak.mmtcdn.com/flights/assets/media/dt/listing/checkin_revamp.webp"
                  alt="Check-in Baggage"
                  class="w-5 h-5 object-contain"
                />
                <div class="flex flex-col">
                  <span class="text-[11px] text-gray-500 font-medium">Check-in Baggage</span>
                  <span class="text-xs font-bold text-gray-800">15 KGS/Adult</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FlightDetailsModel {
  flightData = input.required<FlightDetails>();
  closeModal = output<void>();
}
