import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router} from '@angular/router';
import { Observer } from 'gsap/all';

import { LoginModuleComponent } from '../login-module/login-module.component';
import { LoaderComponent } from '../utils/loader/loader.component';
import { MsgBoxComponent } from '../utils/msg-box/msg-box.component';
import { ImageCategoryCarouselComponent } from '../utils/image-category-carousel/image-category-carousel.component';
import { ImageSliderComponent } from '../utils/image-slider/image-slider.component';
import { TableComponent } from '../utils/table/table.component';
import { FooterComponent } from '../footer/footer.component';

import { FirebaseService } from '../../service/firebase.service';
import { UtilsService } from '../../service/utils.service';
import { AjaxUtilService } from '../../service/ajax-util.service';

import { MultiConditionPipe } from '../../pipes/multi-condition.pipe';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule} from '@angular/forms';

import { GoogleMapsModule } from '@angular/google-maps';
import { gsap } from 'gsap';
gsap.registerPlugin(Observer);


interface Project{
  project_id : number,
  project_type : string,
  project_name : string,
  landmark : string,
  address : string,
  starting_price : number,
  pincode : string,
  elevation_poster: any,
  built_area : string,
  configs : any,
  gallery : any,
  blueprints : any,
  latitude: string,
  longitude: string,
  total_floors: number,
  total_blocks : number,
  total_units: number
}

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [GoogleMapsModule,LoginModuleComponent,CommonModule,RouterLink,MultiConditionPipe,ReactiveFormsModule,LoaderComponent,MsgBoxComponent,ImageCategoryCarouselComponent,ImageSliderComponent,TableComponent,FooterComponent],
  providers:  [MultiConditionPipe],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent implements OnInit{

  @ViewChild('gmap', { static: false }) mapContainer!: ElementRef;
 
  enquiryForm! : FormGroup

  statusMessage = { show: false, msg: '', status: '' };
  isloading = false;
  isLoginOpen = false
  project_details : Project = {
    project_id : 0,
    project_type : "",
    project_name : "",
    landmark : "",
    address : "",
    starting_price : 0,
    built_area : "0 sq.ft.",
    pincode : "",
    elevation_poster : "",
    configs : [],
    gallery : [],
    blueprints : [],
    latitude : '',
    longitude : '',
    total_blocks : 0,
    total_floors : 0,
    total_units : 0
  }
  tableLayout = {
    actions : [],
    actionsFor : [],
    sortingOrder : false,
    sortColumn : "",
    sortArray : [],
    canSearch : false,
    searchVal: '',
    cols : [{columnDispName : 'BHK',column : 'bhk'},{columnDispName : 'Unit Type',column : 'unit_type'},{columnDispName : 'Built-Up Area',column : 'built_area'},{columnDispName : 'Price Per Sq. Ft.',column : 'price_per_sqft'},{columnDispName : 'Price Range',column : 'price_range'}],
    label : "",
    filterList : [],
    filterValue : '',
    add_new : false
  }
 
  constructor(public firebaseService: FirebaseService,private router: Router ,private actiavated_router: ActivatedRoute,private utils: UtilsService,private AjaxUtil: AjaxUtilService, private fb:FormBuilder,private pipeRef: MultiConditionPipe){}
  
  ngOnInit(): void {
    this.actiavated_router.queryParams.subscribe(params => {
      this.getProjectDetails(params);
    })
    this.enquiryForm = this.fb.group({
      name : ['',Validators.required],
      mobile : ['',[Validators.required,Validators.pattern(/^\d{10}$/)]],
      mail : ['',[Validators.required,Validators.email]]
    })
  }

  initMap()
  {
    const latitude = parseFloat(this.project_details.latitude),longitude = parseFloat(this.project_details.longitude)
    const map = new google.maps.Map(document.getElementById("gmap") as HTMLElement,  {
      mapId: "DEMO_MAP_ID", // Map ID is required for advanced markers.
        center: { lat: latitude, lng: longitude }, 
        zoom: 16,
        gestureHandling: 'cooperative',
        mapTypeId: google.maps.MapTypeId.ROADMAP, 
        streetViewControl: true, 
        fullscreenControl: true,
      });  

    const marker =  new google.maps.marker.AdvancedMarkerElement({
      position: { lat: latitude, lng: longitude },
      map: map,
      title: 'Project Location',
    });
    const infoWindowContent = `
      <div>
        <h3>${this.project_details.project_name}</h3>
        <p><strong>Landmark:</strong> ${this.project_details.landmark}</p>
        <p><strong>Address:</strong> ${this.project_details.address}</p>
        <p><strong>Starting Price:</strong> ${this.pipeRef.transform("priceRange",[this.project_details.starting_price])} onwards</p>
        <p><strong>Pincode:</strong> ${this.project_details.pincode}</p>
        <p>
          <a href="https://maps.google.com/maps?daddr=${latitude},${longitude}" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;color:blue;">
            Open in Google Maps
          </a>
        </p>
      </div>
    `;
    const infoWindow = new google.maps.InfoWindow({
      content: infoWindowContent,
    });
    infoWindow.open(map, marker);
  }
  

  //Triggers the Status message to user using msg-box component
  updateStatusMessage(jsonData: any):void
  {
    var statusMessage ={
      show: true,
      msg: jsonData.message,
      status: jsonData.status
    }
    this.statusMessage = statusMessage;
  }

  getProjectDetails(params:any)
  {
    this.isloading = true;
     this.AjaxUtil.ajax("api/json/action/getProjectDetails",params).subscribe((jsonData)=>{
      this.isloading = false;
       var project_details ={
        project_id : jsonData.project_id,
        project_type : jsonData.project_type,
        project_name : jsonData.project_name,
        landmark : jsonData.landmark,
        address : jsonData.address,
        starting_price : jsonData.min_price,
        Highest_price : jsonData.max_price,
        pincode : jsonData.pincode,
        elevation_poster : jsonData.elevation_poster,
        configs : jsonData.configs.map((element:any)=>{return this.formatConfigValues(element);}) ,
        gallery : jsonData.gallery,
        blueprints : jsonData.blueprints,
        latitude : jsonData.latitude,
        longitude : jsonData.longitude,
        total_blocks: jsonData.total_blocks,
        total_floors: jsonData.total_floors,
        total_units : jsonData.total_units,
        built_area : `${(jsonData.min_built_area === jsonData.max_built_area ? jsonData.min_built_area : jsonData.min_built_area +" - "+ jsonData.max_built_area )} sq.ft. `
       } 
       this.project_details = project_details; 
       this.initMap();
     }) 
  }

  formatConfigValues(configs: any)
  {
    const sqft_price =  this.pipeRef.transform("customNumberFormat",[configs.sqft_price]),
        min_area = this.pipeRef.transform("customNumberFormat",[configs.built_area1]),
        max_area = this.pipeRef.transform("customNumberFormat",[configs.built_area2]),
        min_price = this.pipeRef.transform("priceRange",[configs.price_range1]),
        max_price = this.pipeRef.transform("priceRange",[configs.price_range2]); 

       var config = {
        "bhk" : `${configs.bhk} BHK`,
        "unit_type" : configs.unit_type,
        "built_area" : `${(configs.built_area1 === configs.built_area2 ? min_area : min_area +" - "+ max_area )} sqft `,
        "price_per_sqft" : `₹ ${sqft_price} / sqft `,
        "price_range" :  `Rs. ${(min_price === max_price ? min_price :  min_price+" - "+max_price  )}`,
      }
      return config;
  }

  toggleContainer(className: string,slideClass: string)
  {
    var element = $('.' + className);
      element.toggleClass('activate');
      element.toggleClass(slideClass);
      this.isLoginOpen=!this.isLoginOpen;

      if (this.isLoginOpen) {
        Observer.getAll().forEach(observer => observer.disable());
      } else {
        Observer.getAll().forEach(observer => observer.enable());
      }
  }

  scrollTo(index: number)
  {
    this.utils.setCurrentIndex(index);
    this.router.navigate(['/home']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  externalLink(link: string)
  {
    window.open(link)
  }

  addNewEnquiry(event: Event)
  {
    event.preventDefault(); 
    if(this.enquiryForm.valid)
    {var formValues = this.enquiryForm.value
      var params = {
        ...formValues,
        "project_id" : this.project_details.project_id
      };
      this.isloading = true;
      this.AjaxUtil.ajax("api/json/action/addNewEnquiry",params).subscribe((jsonData)=>{
        this.isloading = false;
        if(jsonData.status==="success")
          this.enquiryForm.reset();
        this.updateStatusMessage(jsonData)
      })
    }
    else{
      this.enquiryForm.markAllAsTouched();
    }
  }

  handleFooterActions(event : {action: string, params: any})
  {
    if(event.action === "scrollTo")
    {
      this.scrollTo(event.params)
    }
  }
}
