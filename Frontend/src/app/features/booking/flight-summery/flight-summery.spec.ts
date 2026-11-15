import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlightSummery } from './flight-summery';

describe('FlightSummery', () => {
  let component: FlightSummery;
  let fixture: ComponentFixture<FlightSummery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightSummery],
    }).compileComponents();

    fixture = TestBed.createComponent(FlightSummery);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
