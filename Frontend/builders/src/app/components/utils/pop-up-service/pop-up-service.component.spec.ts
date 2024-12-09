import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopUpServiceComponent } from './pop-up-service.component';

describe('PopUpServiceComponent', () => {
  let component: PopUpServiceComponent;
  let fixture: ComponentFixture<PopUpServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopUpServiceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PopUpServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
