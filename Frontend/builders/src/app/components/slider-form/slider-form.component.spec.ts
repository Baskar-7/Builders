import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderFormComponent } from './slider-form.component';

describe('SliderFormComponent', () => {
  let component: SliderFormComponent;
  let fixture: ComponentFixture<SliderFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SliderFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SliderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
