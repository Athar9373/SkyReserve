import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DesktopNavActions } from './desktop-nav-actions';

describe('DesktopNavActions', () => {
  let component: DesktopNavActions;
  let fixture: ComponentFixture<DesktopNavActions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesktopNavActions],
    }).compileComponents();

    fixture = TestBed.createComponent(DesktopNavActions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
