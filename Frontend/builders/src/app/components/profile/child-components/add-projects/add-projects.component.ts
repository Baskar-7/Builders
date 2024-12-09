import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, Validators, FormBuilder, ReactiveFormsModule} from '@angular/forms';

import { TableComponent } from '../../../utils/table/table.component';
import { ImageCategoryCarouselComponent } from '../../../utils/image-category-carousel/image-category-carousel.component';
import { MsgBoxComponent } from '../../../utils/msg-box/msg-box.component';
import { LoaderComponent } from '../../../utils/loader/loader.component';
import { PopUpServiceComponent } from '../../../utils/pop-up-service/pop-up-service.component';

import { MultiConditionPipe } from '../../../../pipes/multi-condition.pipe';

import { AjaxUtilService } from '../../../../service/ajax-util.service';
import { FirebaseService } from '../../../../service/firebase.service';

import $ from 'jquery';
import { gsap } from 'gsap/gsap-core';
import { Draggable } from 'gsap/Draggable';
import { UtilsService } from '../../../../service/utils.service';

gsap.registerPlugin(Draggable)

interface Details{
  amenities : any[],
  bluePrints: [],
  gallery   : [],
  project_poster: any,
  configurations: any[],
  min_price : number,
  max_price: number,
  min_area : number,
  max_area : number, 
}

@Component({
  selector: 'app-add-projects',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,ImageCategoryCarouselComponent,TableComponent,MsgBoxComponent,LoaderComponent,PopUpServiceComponent],
  providers : [MultiConditionPipe],
  templateUrl: './add-projects.component.html',
  styleUrl: './add-projects.component.scss'
})
export class AddProjectsComponent extends UtilsService implements OnInit{

  constructor(private fb: FormBuilder,private cdr: ChangeDetectorRef,private pipeRef: MultiConditionPipe,private AjaxUtil: AjaxUtilService,private firebase: FirebaseService){
    super();
  }

  @ViewChild('elevation_poster') elevationPoster! : ElementRef<HTMLInputElement>;

  statusMessage = { show: false, msg: '', status: '' };
  isloading = false;
  overview_Form!: FormGroup;
  add_configform! : FormGroup;
  showAmenities :boolean = false;
  showLocations : boolean = false;
  lastUsedPincode  = 0;
  project_details :  Details = {
    amenities : [],
    bluePrints: [],
    gallery   : [],
    project_poster: {},
    configurations : [],
    min_price : 0,
    max_price: 0,
    min_area : 0,
    max_area : 0,
  };
  carouselLayoutOptions : any = {"bluePrintTypes" : [],"galleryType" : []}
    // "bluePrintTypes" : ["1BHK","2BHK","3BHK","Villa","Studio Apartment","Penthouse","Duplex","Triplex","Townhouse","Loft"],
    // "galleryType" : ["Elevation","Amenities", "Interior","3D Renders","Landscape" ,"Community Spaces","Parking","Rooftop","Under Construction","Furniture & Decor","Views","Entrance & Lobby","Security Features","Lighting","Clubhouse"]
  currentFormIndex = -1;

  tableLayout = {
      actions : ["delete"],
      actionsFor : [],
      sortingOrder : false,
      sortColumn : "",
      sortArray : [],
      canSearch : false,
      searchVal : '',
      cols : [{columnDispName : 'BHK',column : 'bhk'},{columnDispName : 'Unit Type',column : 'unit_type'},{columnDispName : 'Built-Up Area',column : 'built_area'},{columnDispName : 'Price Per Sq. Ft.',column : 'price_per_sqft'},{columnDispName : 'Price Range',column : 'price_range'}],
      label : "",
      filterList : [],
      filterValue : '',
      add_new : true
  }

  ngOnInit(){
    this.overview_Form = this.fb.group({
      project_name : ['',Validators.required],
      landmark : ['',Validators.required],
      address : ['',Validators.required],
      project_type : ['',Validators.required],
      pincode : ['',[Validators.required,Validators.pattern(/^\d{6}$/)]],
      elevation_poster : ['',Validators.required],
      city : ['',Validators.required],
      state : ['',Validators.required],
      status : ['',Validators.required],
      total_floors: ['',Validators.required],
      total_units : ['',Validators.required],
      total_blocks: ['',Validators.required],
      latitude : ['',Validators.required],
      longitude : ['',Validators.required]
    });
    this.add_configform = this.fb.group({
      bhk : ['',Validators.required],
      unit_type : ['',Validators.required],
      min_area : ['',Validators.required],
      max_area : ['',Validators.required],
      sqft_price : ['',Validators.required],
      min_price : ['',Validators.required],
      max_price : ['',Validators.required]
    })
    this.transistForm( new MouseEvent('click', { bubbles: true }),1);

    Draggable.create("#add-config-draggable-container",{
      type: "x,y",
      handle: ".drag-handle",
      edgeResistance : 0.5,
      inertia : true,
      bounds : window
    });

    this.getCategoryOptions();
  }

   //Triggers the Status message to user using msg-box component
   updateStatusMessage(jsonData: any):void
   {
     const statusMessage ={
       show: true,
       msg: jsonData.message,
       status: jsonData.status
     }
     this.statusMessage = statusMessage;
   }

   getCategoryOptions()
   {
    this.AjaxUtil.ajax("api/json/action/getCategories",{"categoryTypeIds":[2,3]}).subscribe((jsonData)=>{
       if(jsonData.status === "error")
       {
        this.updateStatusMessage(jsonData)
       }
       else
        { this.carouselLayoutOptions = { 
            bluePrintTypes: jsonData['2'],
            galleryType: jsonData['3'],
          };
      }
    })
   }

  updateElevationPoster(event: Event)
  {
    event.preventDefault();
    const image = this.elevationPoster.nativeElement,target = event.target as HTMLInputElement;
    if(target && target.files && target.files[0])
    {
      this.project_details.project_poster = target.files[0];
      image.src = URL.createObjectURL(target.files[0]);
    }
  }

  
  togglePopup(member : string)
  { 
    if(member === "amenities"){
      this.showAmenities = !this.showAmenities;
    }
    else if(member === "locations"){
      this.showLocations = !this.showLocations;
    }
  }

  popUpAllAmenities(event: Event)
  {
    window.open('http://localhost:4200/popUp?q=addAmenities', 'Popup', 'width=500,height=500');
    (window as any).mainComponent = this; 
  }

  transistForm(event: Event,moveBy: number)
  {
    event.preventDefault();
    const forms = document.querySelectorAll('.form');
    const currentForm = forms[this.currentFormIndex] as HTMLElement;
    const nextForm = forms[this.currentFormIndex + moveBy] as HTMLElement;
      let tl = gsap.timeline({
        defaults: { duration: .5, ease: "ease" },
      })

      if(this.currentFormIndex != -1)
        tl.to(currentForm,{autoAlpha: 0,x:100 * -(moveBy)})
    tl.fromTo(nextForm,{autoAlpha:0,x:100 * moveBy},{autoAlpha:1,x:0,duration: .5},"-=.3");
    this.currentFormIndex = this.currentFormIndex + moveBy
  }

  addConfig(event: Event)
  {
    event.preventDefault();

    if(this.add_configform.valid) {
      this.handleMaxMinFormValues();

      const formValues = this.add_configform.value,
        sqft_price = this.pipeRef.transform("customNumberFormat",[formValues.sqft_price]),
        min_area =  this.pipeRef.transform("customNumberFormat",[formValues.min_area]),
        max_area = this.pipeRef.transform("customNumberFormat",[formValues.max_area]),
        min_price = this.pipeRef.transform("priceRange",[formValues.min_price]),
        max_price = this.pipeRef.transform("priceRange",[formValues.max_price]),
        config_data = {
          "id" : this.generateUniqueId(),
          "bhk" : `${formValues.bhk} BHK`,
          "unit_type" : formValues.unit_type,
          "built_area" : `${(min_area === max_area ? min_area : min_area +" - "+ max_area )} sqft `,
          "price_per_sqft" : `${sqft_price} / sqft `,
          "price_range" :  `Rs. ${(min_price === max_price ? min_price :  min_price+" - "+max_price  )}`,
          "originalData" : formValues
        }
      this.project_details.configurations.push(config_data);
      this.cdr.detectChanges();
      this.toggleAddConfigDialogBox();
    }
    else{
      this.add_configform.markAllAsTouched()
    }
  }

  generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  handleMaxMinFormValues()
  {
    const { min_area, max_area, min_price, max_price } = this.add_configform.value,
    pathValues ={
        min_area : min_area || max_area? min_area || max_area : Math.min(min_area,max_area),
        max_area :  Math.max(min_area,max_area),
        min_price : min_price || max_price ? min_price || max_price : Math.min(min_price,max_price),
        max_price : Math.max(min_price,max_price)
    }
    this.add_configform.patchValue(pathValues);
    const { project_details } = this;
      project_details.min_area = project_details.min_area ? Math.min(project_details.min_area,pathValues.min_area) : pathValues.min_area;
      project_details.max_area = Math.max(project_details.max_area,pathValues.max_area);
      project_details.min_price = project_details.min_price ?  Math.min(project_details.min_price,pathValues.min_price) : pathValues.min_price;
      project_details.max_price = project_details.max_price ?  Math.min(project_details.max_price,pathValues.max_price) : pathValues.max_price;
  }

  getLocation(event: Event)
  {
    var pincode = this.overview_Form.get('pincode')?.value;

    if (pincode && pincode.toString().length === 6 && this.lastUsedPincode != pincode) {
      (event.target as HTMLElement)?.blur();;
      this.isloading=true;
      this.AjaxUtil.getLocationWithPincode(pincode).subscribe((jsonData)=>{
        this.isloading=false
        if (jsonData && jsonData[0].Status === 'Success') {
          var state = jsonData[0].PostOffice[0].State, city = jsonData[0].PostOffice[0].District;
          this.overview_Form.get("state")?.setValue(state);
          this.overview_Form.get("city")?.setValue(city);
          this.lastUsedPincode = pincode;
          this.updateStatusMessage({message: `Location : ${city},${state}`,"status" : "info"});
        }
      })
    }
  }

  toggleAddConfigDialogBox()
  {
    $($(".add-config-dialogbox")[0]).toggle();
  }

  handleConfigFormActions(event : {actionName : string, param: any})
  {
    //var num = "8122316497";
    if(event.actionName === "addMore")
    { 
      this.add_configform.reset({min_area: 0});
      this.toggleAddConfigDialogBox();
    }
    else if(event.actionName === "delete")
    {
      this.project_details.configurations = this.project_details.configurations.filter((element:any)=> event.param.id!=element.id);
    }
  }

  selectProjectType(event: Event)
  {
    event.preventDefault();
    var ele = event.target as HTMLElement;
    if(ele && ele.tagName == 'LI')
    {
      this.overview_Form.get('project_type')?.setValue(ele.textContent)
      this.toggleDropdown('project-types-list','close');
    }
   
  }

  async addProject(event: Event)
  {
    event.preventDefault(); 

    const params = { 
        ...this.overview_Form.value,
        ...this.project_details,
    } 
    this.isloading = true;
    this.AjaxUtil.updateNewProject(params).subscribe((jsonData)=>{
      this.isloading = false;
       if(jsonData.status === "success")
       {  
          this.project_details ={
            amenities : [],
            bluePrints : [],
            configurations: [],
            gallery : [],
            project_poster : {},
            min_price : 0,
            max_price: 0,
            min_area : 0,
            max_area : 0, 
          }
          this.lastUsedPincode  = 0;
          this.overview_Form.reset();
          this.add_configform.reset({min_area: 0});
          this.transistForm( new MouseEvent('click', { bubbles: true }), -3);
       }
       this.updateStatusMessage(jsonData);
    })
  }

  get isBuiltAreaInvalid() {
    const builtArea1 = this.add_configform.get('min_area');
    const builtArea2 = this.add_configform.get('max_area'); 
    return ((builtArea1?.invalid && (builtArea1.dirty || builtArea1.touched)) || (builtArea2?.invalid && (builtArea2.dirty || builtArea2.touched)));
  }

  handlePopupServiceActions(event : {action: string,params : any})
  { 
    if(event.action === "refresh")
    {
      this.cdr.detectChanges();
    }
    else if(event.action === "selectLocation")
    {
      this.overview_Form.patchValue(event.params);
      this.cdr.detectChanges();
    }
  }
  
}
