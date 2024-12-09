import { ChangeDetectorRef, AfterViewInit , Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImageSliderComponent } from '../image-slider/image-slider.component';

import $ from 'jquery';
import { gsap } from 'gsap/gsap-core';
import { Draggable } from 'gsap/Draggable';
import { UtilsService } from '../../../service/utils.service';

gsap.registerPlugin(Draggable)

@Component({
  selector: 'app-image-category-carousel',
  standalone: true,
  imports: [CommonModule,ImageSliderComponent],
  templateUrl: './image-category-carousel.component.html',
  styleUrl: './image-category-carousel.component.scss'
})
export class ImageCategoryCarouselComponent extends UtilsService implements OnInit,OnChanges{

  @Input() canCustomize : boolean = false;
  @Input() label : string = "Images";
  @Input() filterContent : any[] = [];
  @Input() categoryDetails :any[] = [] ;
  @Output() categoryDetailsChange = new EventEmitter<any>;
  selectedCategory  = {id: -1,categoryType : "",images: []};
  selectedFilter :any = {}
  preview :any[] = [];

  constructor(private cdr: ChangeDetectorRef){
    super();
  }

  ngOnInit(): void { 
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['categoryDetails'])
    { 
      if(this.categoryDetails.length > 0 && this.selectedCategory.id == -1)
      {
        this.selectedCategory = this.categoryDetails[0]; 
      }
    }
  }

  addCategory(event: Event,where: string)
  {
    event.preventDefault();
    if(where === "temporaryStorage")
    {
      var categoryInput = document.getElementById('upload_category_'+this.label) as HTMLInputElement
      var files = categoryInput.files;
      files && files.length > 0 && (this.preview = Array.from(files))//.map(file => URL.createObjectURL(file)));
      this.cdr.detectChanges();
      this.makeDraggable()
    }
    else
    {
      var filter = this.selectedFilter,
         newBluePrint = {"id": filter.category_id,"categoryType" : filter.category ,"images" : this.preview},
          existingBlueprintIndex  = this.categoryDetails.findIndex((floorPlan) => floorPlan.categoryType === newBluePrint.categoryType);
      this.selectedFilter = {};

      if(existingBlueprintIndex !== -1){
        const existingBlueprint = this.categoryDetails[existingBlueprintIndex];
        existingBlueprint.images = [...existingBlueprint.images, ...newBluePrint.images];
        this.viewCategory(new MouseEvent('click'),existingBlueprint);
      }
      else{
        this.categoryDetails = [...this.categoryDetails,newBluePrint];
        this.viewCategory( new MouseEvent('click'),newBluePrint);
      }
      this.categoryDetailsChange.emit(this.categoryDetails);
      var ele = document.getElementById('selected_category_'+this.label) as HTMLElement ;
      ele.innerText = "Select Category";
      $('.confirm-category-option').css("display","none");
      this.closePreview();
      this.cdr.detectChanges();
    }
  }

  viewCategory(event: Event,newBluePrint: any)
  {
    event.preventDefault();
    this.selectedCategory=newBluePrint;
    this.cdr.detectChanges();
  }

  selectFilter(event: Event,filter: any)
  {
    var ele = event.target as HTMLElement,ele1 = document.getElementById('selected_category_'+this.label) as HTMLElement ; 
      ele1.innerText = ele.innerText; 
      this.selectedFilter = filter;
    this.toggleDropdown("category-type-list","close");
    $('.confirm-category-option').css("display","block");;
  }

  closePreview()
  {
    this.preview = []
  }

  handleImageSliderActions(params: {action: string,images : string})
  {
    if(params.action === "insertImages" || "removeImage")
    { 
      var currentSlideIndex = this.categoryDetails.findIndex(element => element.id == this.selectedCategory.id) , 
      currentSlide = this.categoryDetails[currentSlideIndex]; 
      currentSlide.images = params.images;
      if(currentSlide.images.length <= 0)
      {
        this.categoryDetails.splice(currentSlideIndex,1);
        this.categoryDetails.length > 0 ? (this.selectedCategory = this.categoryDetails[currentSlideIndex - 1]) : this.selectedCategory = {id: -1,categoryType : "",images: []};
      }
      this.categoryDetailsChange.emit(this.categoryDetails);
    }
  }

  makeDraggable()
  {
    Draggable.create("#draggable-container",{
      type : "x,y",
      inertia: true,
      edgeResistance: 0.5,
      bounds : window
    })
  }

}
