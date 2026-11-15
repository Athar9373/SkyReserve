import { Component } from '@angular/core';
import { Navbar } from '../shared/navbar/navbar';
import { FlightSearch } from './flight-search/flight-search';
import { FlightCardList } from './fllight-card-lists/flight-cards-list';

@Component({
  imports: [Navbar, FlightSearch, FlightCardList],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {}
