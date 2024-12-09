import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UndefinedUrlComponent } from './undefined-url.component';

describe('UndefinedUrlComponent', () => {
  let component: UndefinedUrlComponent;
  let fixture: ComponentFixture<UndefinedUrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UndefinedUrlComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UndefinedUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
