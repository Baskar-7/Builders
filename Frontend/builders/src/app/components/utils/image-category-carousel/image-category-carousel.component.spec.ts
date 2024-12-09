import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageCategoryCarouselComponent } from './image-category-carousel.component';

describe('ImageCategoryCarouselComponent', () => {
  let component: ImageCategoryCarouselComponent;
  let fixture: ComponentFixture<ImageCategoryCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCategoryCarouselComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImageCategoryCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
