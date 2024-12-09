import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MsgBoxComponent } from './msg-box.component';

describe('MsgBoxComponent', () => {
  let component: MsgBoxComponent;
  let fixture: ComponentFixture<MsgBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MsgBoxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MsgBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
