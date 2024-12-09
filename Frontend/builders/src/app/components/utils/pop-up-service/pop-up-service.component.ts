import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

import { AjaxUtilService } from '../../../service/ajax-util.service';
import { UtilsService } from '../../../service/utils.service';

import { LoaderComponent } from '../loader/loader.component';
import { MsgBoxComponent } from '../msg-box/msg-box.component';

import { MultiConditionPipe } from '../../../pipes/multi-condition.pipe';
import { CustomValidator } from '../../../Validators/custom-validator';

import $ from 'jquery';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-pop-up-service',
  standalone: true,
  imports: [CommonModule,LoaderComponent,ReactiveFormsModule,MultiConditionPipe,MsgBoxComponent],
  templateUrl: './pop-up-service.component.html',
  styleUrl: './pop-up-service.component.scss'
})
export class PopUpServiceComponent implements OnChanges,OnInit{

  constructor(private AjaxUtil: AjaxUtilService,private cdr: ChangeDetectorRef,private fb: FormBuilder,private utils: UtilsService){}

  @Input() showPopup = false;
  @Input() popUpOption :string = "";
  @Input() results :any[] = []
  @Input() popUpParams = {}
  @Output() showPopupChange = new EventEmitter<boolean>();
  @Output() resultsChange = new EventEmitter<any>();
  @Output() handleActions = new EventEmitter<any>();

  formGroup! : FormGroup;
  localStorage :any = {}
  isloading= false;
  statusMessage = { show: false, msg: '', status: '' };

  map!: google.maps.Map;
  marker!: google.maps.Marker;

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['showPopup'])
    { 
      this.resetControls();
    }
    this.cdr.detectChanges()
  }

  updateStatusMessage(jsonData: any):void
  {
      var statusMessage ={
        show: true,
        msg: jsonData.message,
        status: jsonData.status
      }
      this.statusMessage = statusMessage;
  }

  async resetControls()
  {
    var option = this.popUpOption; 
    if(option === "locations" && document.getElementById('location-search-bar'))
    {
      var location_search = document.getElementById('location-search-bar') as HTMLInputElement;
      location_search.value='';  
      const all_locations = await this.AjaxUtil.getLocations(),
      location_details = {
        "locations" : all_locations,
      } 
      this.localStorage.location_details = location_details;
      this.toggleContainer('pop-up',this.showPopup);
      this.cdr.detectChanges();
    } 
    else if(option === "addAmenities" && document.getElementById('amenity-search-bar'))
    { 
      var amenity_search = document.getElementById('amenity-search-bar') as HTMLInputElement;
      amenity_search.value=''; 
      this.AjaxUtil.ajax("api/json/action/getAllAmenities",{}).subscribe((jsonData)=>{
        this.localStorage.amenity_details = jsonData.amenities;
        this.localStorage.duplicate_details = jsonData.amenities;
        this.localStorage.selected_amenities = []; 
      });
      
      this.toggleContainer('pop-up',this.showPopup);
    }
    else if(option === "addReview")
    {
      this.formGroup = this.fb.group({
        author : ['',Validators.required],
        quote  : ['',[Validators.required,CustomValidator.minchars(100),CustomValidator.maxchars(250)]],
        dp     : ['',]
      })
      this.toggleContainer('pop-up',this.showPopup);
    }
    else if(option === "getLocation")
    {
      this.formGroup = this.fb.group({
        latitude : ['',Validators.required],
        longitude : ['',Validators.required]
      })
      this.toggleContainer('pop-up',this.showPopup); 
      this.initMap();
    }
  }
  
  printConsole(str: any)
  {
    console.log(str)
  }

  toggleContainer(className: string,show: boolean)
  { 
    const element = $(`.${this.popUpOption}_${className}`);
    element.toggleClass('slideBtC', show);
    element.toggleClass('slideCTB', !show);
    this.utils.toggleObserver(this.showPopup);
  }

  handleAmenityInput(event: Event,amenityId : number)
  {
    event.stopPropagation();
    var target = event.target as HTMLInputElement;
    if(target)
    { 
      if(target.checked) 
        this.results.push({"id" : amenityId,"amenity" : target.value,})
      else{
        this.results = this.results.filter((element : any) => element.id != amenityId);
      }
      this.resultsChange.emit(this.results);
      this.handleAction('applyAmenityFilter','');
    }
  }

  isSelectedAmenity(amenityId: number)
  {
    var selected_amenities = this.results,amenity = []; 
    if(selected_amenities)
      amenity = selected_amenities.filter((amenity : any) => amenity.id === amenityId);
  
    return amenity.length === 0 ? false : true;
  }

  searchAmenities(event: Event)
  {
    var target = event.target as HTMLInputElement;
    var data = JSON.parse(JSON.stringify(this.localStorage.duplicate_details))
    if(target && target.value.trim() === "")
    {
      this.localStorage.amenity_details = JSON.parse(JSON.stringify(this.localStorage.duplicate_details))
    }
    else if(target)
    {
      var searchValue = target.value,filtered = [];
      for (var i = 0; i < data.length; i++) 
      {
        var categories =data[i];
        if(categories.category.toLowerCase().indexOf(searchValue.toLocaleLowerCase()) != -1)
        {
          filtered.push(categories);
        }
        else
        {
          var filtered_amenities = [];
          for(var j=0; j < categories.amenities.length; j++)
          {
            var amenity = categories.amenities[j]; 
            if(amenity.amenity.toLowerCase().indexOf(searchValue.toLocaleLowerCase()) != -1)
              filtered_amenities.push(amenity);
          }
          filtered_amenities.length > 0 && (categories.amenities = filtered_amenities) && filtered.push(categories);
        }       
      }
      this.localStorage.amenity_details= filtered;
    }
  }
  async searchCities(event: Event)
  {
    event.preventDefault(); 
    const cachedLocations =  await this.AjaxUtil.getLocations(),search_val = (event.target as HTMLInputElement).value;
    var locations :any = [];
    cachedLocations.forEach((location: any)=>{
       if(location.district.toLowerCase().indexOf(search_val.toLocaleLowerCase()) != -1)
       {
          locations.push(location);
       }
    })
    this.localStorage.location_details.locations = locations;
  }

  handleAction(action:string,params : any)
  {
      this.handleActions.emit({action,params});
  }

  updateProfilePic(event: Event)
  {
    event.preventDefault();
    var ele = document.getElementById("review-user-pic") as HTMLInputElement,target = event.target as HTMLInputElement;
    if(target && target.files && target.files[0]){
      ele.src = URL.createObjectURL(target.files[0]); 
      this.formGroup.patchValue({dp:target.files[0] })
    }
  }

  addReview(event: Event)
  {
    event.preventDefault();
    this.isloading = true;
    this.AjaxUtil.createFormAndSubmitFile("api/json/action/addReview",this.formGroup.value.dp,JSON.stringify(this.formGroup.value)).subscribe((jsonData)=>{
      this.isloading=false;
     
      this.updateStatusMessage(jsonData);
      if(jsonData.status === "success")
      {
        this.handleAction('refresh',jsonData)
        this.closeWindow();
      }
    })
  }

  async initMap() {
    const myLatlng = { lat: 13.0843, lng: 80.2705 };
    var element = document.getElementById("map") as HTMLElement
    if(element)
    {
      const map = new google.maps.Map(element, {
        zoom: 10,
        center: myLatlng,
      });
      let infoWindow = new google.maps.InfoWindow({
        content: "Click the map to get Lat/Lng!",
        position: myLatlng,
      });
    
      infoWindow.open(map); 
      map.addListener("click", (mapsMouseEvent : any) => 
      {
        infoWindow.close();  

        if (mapsMouseEvent.latLng) 
        {
          var lat = mapsMouseEvent.latLng.lat(), lon = mapsMouseEvent.latLng.lng(); 
          this.formGroup.get('latitude')?.setValue(lat);
          this.formGroup.get('longitude')?.setValue(lon); 
          this.cdr.detectChanges();
      
          infoWindow = new google.maps.InfoWindow({
            position: mapsMouseEvent.latLng,
          });
          infoWindow.setContent(
            JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2),
          );
        }
        infoWindow.open(map);
      });
   }
}

  closeWindow()
  {
    this.showPopup = !this.showPopup;
    this.toggleContainer('pop-up',this.showPopup);
    this.showPopupChange.emit(this.showPopup)
  }

}
