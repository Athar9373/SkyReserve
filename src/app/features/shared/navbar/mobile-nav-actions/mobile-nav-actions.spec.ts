import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileNavActions } from './mobile-nav-actions';

describe('MobileNavActions', () => {
  let component: MobileNavActions;
  let fixture: ComponentFixture<MobileNavActions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileNavActions],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileNavActions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
