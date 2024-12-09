import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MultiConditionPipe } from '../../../pipes/multi-condition.pipe';

@Component({
  selector: 'app-image-slider',
  standalone: true,
  imports: [CommonModule,MultiConditionPipe],
  templateUrl: './image-slider.component.html',
  styleUrl: './image-slider.component.scss'
})
export class ImageSliderComponent implements OnInit{
   
  currentSlideIndex : number = 0; 
  @Input() label : string = "slides";
  @Input() canCustomize : boolean = false;
  @Input() slideImages :any[] = [];
  @Input() caption : string ="";
  @Output() slideImagesChange = new EventEmitter<string[]>;
  @Output() handleActions = new EventEmitter<any>();
  
  constructor(private cd: ChangeDetectorRef){}

  ngOnInit(): void {
  }

  handleSliderAction(event: Event,action: string) {
    event.preventDefault();
    var btnElements = document.querySelectorAll('.navBtn_'+this.label);
    if (action === "Home") {
      this.showSlide(event,0)
    } else if (action === "End" || action === "ArrowLeft" || action === "prev") {
      this.showSlide(event,(this.currentSlideIndex + btnElements.length - 1) % btnElements.length)
    } else if (action === "ArrowRight" || action === "next") {
      this.showSlide(event,(this.currentSlideIndex + btnElements.length + 1) % btnElements.length)
    }
  }

  showSlide(event : Event,index: number): void {
    event.preventDefault();
    var btnElements = document.querySelectorAll('.navBtn_'+this.label);
    if (index >= 0 && index < btnElements.length && this.currentSlideIndex != index ) 
    {
        this.currentSlideIndex = index;
        var ele = document.getElementById('displayImg_'+this.label) as HTMLInputElement,selectedImage = this.slideImages[this.currentSlideIndex];
        ele.src= (typeof selectedImage === 'string') ? 'data:image/jpeg;base64,'+selectedImage : URL.createObjectURL(this.slideImages[this.currentSlideIndex]); 
        this.cd.detectChanges();
    }
  }

  removeImage()
  {
    if(this.currentSlideIndex >= 0 && this.currentSlideIndex <= this.slideImages.length)
    {
      // URL.revokeObjectURL(this.slideImages[this.currentSlideIndex]);
      this.slideImages.splice(this.currentSlideIndex,1);
      this.slideImagesChange.emit(this.slideImages);
      var index =(this.currentSlideIndex + 1) % this.slideImages.length; 
      this.showSlide(new MouseEvent(""),index);
      this.cd.detectChanges();
      this.handleActions.emit({"actionName":"removeImage","images": this.slideImages})
    }
  }
 
  insertImages(event: Event)
  {
    event.preventDefault();
    var ele = document.getElementById("insertImages_"+this.label) as HTMLInputElement
    var files = ele.files
    if(files && files.length > 0)
    {
      var newSlides = Array.from(files as FileList)//.map(file => URL.createObjectURL(file));
      this.slideImages = [...this.slideImages,...newSlides];
      this.slideImagesChange.emit(this.slideImages);
      this.handleActions.emit({"actionName":"insertImages","images":this.slideImages})
      this.cd.detectChanges();
    } 
  }

  onKeyDown(event: KeyboardEvent): void {
    this.handleSliderAction(event,event.key);
  }
}

