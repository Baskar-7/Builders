import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MsgBoxComponent } from '../utils/msg-box/msg-box.component';
import { PopUpServiceComponent } from '../utils/pop-up-service/pop-up-service.component';

import { MultiConditionPipe } from '../../pipes/multi-condition.pipe';

import { AjaxUtilService } from '../../service/ajax-util.service';
import { UtilsService } from '../../service/utils.service';

import $ from 'jquery';

interface Project{
  showLocations : boolean
  showAmenities : boolean
  showFilters   : boolean
  location : string 
  filters : { amenities : any[],projectType : any[], priceRange : any[]}
  "projects" : any[]
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [MultiConditionPipe,CommonModule,MsgBoxComponent,PopUpServiceComponent,RouterLink],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent extends UtilsService implements OnInit{

  constructor(private AjaxUtil: AjaxUtilService,private cdr: ChangeDetectorRef){
    super()
  }

  isLoading: boolean = false;
  statusMessage = { show: false, msg: '', status: '' };
  project_details : Project = {
    showLocations : false,
    showAmenities: false,
    showFilters : false,
    location : 'All',
    filters : {amenities : [], projectType : [],priceRange : []},
    "projects" : []
  }

  ngOnInit(): void {
    this.getCurrentLocation();
    this.getProjects();
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

  togglePopup(member : string)
  {
    var project_details = this.project_details
    if(member === "locations")
    {
      project_details.showLocations = !project_details.showLocations;
      this.toggleObserver(project_details.showLocations)
    }
    else if(member === "amenities"){
      project_details.showAmenities = !project_details.showAmenities;
      this.toggleObserver(project_details.showAmenities)
    }
  }

  toggleClass(targetClassname: string, addClass: string, removeClass: string, option: 'open' | 'close' | 'toggle') {
    const element = $(`.${targetClassname}`);
    switch (option) {
      case 'open':
        element.addClass(addClass).removeClass(removeClass);
        break;
      case 'close':
        element.removeClass(addClass).addClass(removeClass);
        break;
      case 'toggle':
        element.toggleClass(addClass).toggleClass(removeClass);
        break;
    }
  }
  

  getProjects()
  {
    const params = {
      location : this.project_details.location,
      amenities : this.project_details.filters.amenities.map((element)=>{element.id}),
      priceRange : this.project_details.filters.priceRange,
      projectType : this.project_details.filters.projectType,
      searchValue : '',
      project_status : 'Active'
    }
      this.AjaxUtil.ajax("api/json/action/getProjects",params).subscribe((jsonData)=>{
        if(jsonData.status === "success")
        {
          this.project_details.projects = jsonData.projects;
        }
        else
          this.updateStatusMessage(jsonData);
      })
  }

  scrollBy(direction:string, id : string) {
    const element = document.querySelector('#' + id);
    const screenWidth = window.innerWidth;
    const containerWidth = screenWidth > 480 ? 300 : 290; 
    const itemsVisible = Math.floor(screenWidth / containerWidth); 
    const scrollAmount = containerWidth * itemsVisible;
    const scrollByAmount = direction === 'forward' ? scrollAmount : -scrollAmount;

    if (element) {
      element.scrollBy({
        left: scrollByAmount,   
        behavior: 'smooth'      
      });
    }
  }

  get checkOverflow()
  {
    const container = document.getElementById('projects');
    if (container && container.scrollWidth > container.clientWidth) 
      return true;
    else 
      return false;
  }

  handlePopUpActions(event :{action: string,params: any})
  {
    if(event.action === "changeLocation")
    {
        this.project_details.location = event.params ;
        this.getProjects();
    }
    else if (event.action === "applyAmenityFilter")
    {
      $("#apply-changes-btn").css("display","block");
    }
  }

  getCurrentLocation() 
  {
      this.AjaxUtil.getCurrentLocation().then((location: string) => {
        if(this.project_details.location == 'All'){
          this.project_details.location = location;
          this.getProjects();
        }
      })
  }

  printConsole(param: any)
  {
    console.log(param)
  }

  selectFilter(event: Event,filter_type: string,id : number)
  {
    var element = event.target as HTMLElement,filter = element.textContent?.trim(); 
    if(element && element.tagName === "LI")
    {
      if(filter_type === "projectType" || filter_type === "priceRange")
      {
        var filterType = this.project_details.filters[filter_type],index  = filterType.indexOf(filter);
        index === -1 ? filterType.push(filter) : filterType.splice(index,1) ; 
        element.classList.toggle("selected");
      } 
      else if(filter_type === "amenities")
      { 
        var filterType = this.project_details.filters.amenities,amenities :any = [];
        filterType.forEach((amenity)=>{
          if(id != amenity.id)
            amenities.push(amenity)
        })
        this.project_details.filters.amenities = amenities;
        this.cdr.detectChanges();
      } 
      $("#apply-changes-btn").css("display","block");
    }
  }

  applyFilters()
  {
    this.resetFilterOptions();
    $("#apply-changes-btn").css("display","none");
    this.getProjects();
  }

  isString(value: any): boolean{
    return typeof value === "string";
  }

  clearAllFilters()
  {
    this.project_details.filters = { amenities : [],projectType : [], priceRange : []}
    this.toggleClass('filter-container','slide_showFilter','slide_hideFilter','close');
    this.project_details.showAmenities = false,this.project_details.showLocations = false;
    this.resetFilterOptions()
    this.applyFilters();
  }

  resetFilterOptions()
  {
    this.toggleClass('filter-container','slide_showFilter','slide_hideFilter','close');
    this.project_details.showAmenities = false,this.project_details.showLocations = false;
    this.toggleObserver(false);
  }

}
