import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [],
  templateUrl: './not-found.html',
})
export class NotFound {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  public readonly imageUrl =
    'https://content.skyscnr.com/m/3bd6e265b57135ea/original/SDCRT-1130_Illus_Launch_02_FlightsDbook_22_Error_404.svg';

  public goBack(): void {
    this.router.navigate(['/']);
  }
}
