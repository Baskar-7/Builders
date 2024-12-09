import { Component, OnInit } from '@angular/core';
import { TableComponent } from '../../../utils/table/table.component';
import { CommonModule } from '@angular/common';
import { AjaxUtilService } from '../../../../service/ajax-util.service';
import { MsgBoxComponent } from '../../../utils/msg-box/msg-box.component';
import { LoaderComponent } from '../../../utils/loader/loader.component';
import { MultiConditionPipe } from '../../../../pipes/multi-condition.pipe';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';


interface Layouts{
  actions : any[], 
  actionsFor : {[key:string] : any },
  sortingOrder : boolean,
  sortColumn : string,
  sortArray : any[],
  canSearch : boolean,
  searchVal : any,
  cols : any[],
  label : string,
  filterList : any[],
  filterValue : string,
  add_new : boolean
}

class Table {
    layoutDetails : Layouts = {
    actions : [],
    actionsFor : [],
    sortingOrder : false,
    sortColumn : "",
    sortArray : [],
    canSearch : true,
    searchVal : '',
    cols  : [],
    label : "",
    filterList : [],
    filterValue : 'All',
    add_new : false
  }
}
@Component({
  selector: 'app-manage-details',
  standalone: true,
  imports: [TableComponent,CommonModule,MsgBoxComponent,LoaderComponent,MultiConditionPipe],
  providers : [MultiConditionPipe],
  templateUrl: './manage-details.component.html',
  styleUrl: './manage-details.component.scss'
})
export class ManageDetailsComponent implements OnInit{

  selectedDetails = {"layout" :new Table().layoutDetails, content : []}
  selectedContent = 'projects';
  statusMessage = { show: false, msg: '', status: '' };
  isloading = false;
  allDetails :any = {
    projects : {"layout" : new Table().layoutDetails, content : []},
    services :  {"layout" : new Table().layoutDetails, content : []},
    callbacks: {"layout" : new Table().layoutDetails, content : [] },
    enquires : {"layout" : new Table().layoutDetails, content : []},
    reviews : {"layout" :new Table().layoutDetails, content : []}
  }
  actions: { [key: string]: () => void } = {
    projects: this.getProjects.bind(this),
    services: this.getServiceReq.bind(this),
    callbacks: this.getCallBackReq.bind(this),
    enquires: this.getEnquires.bind(this),
    reviews: this.getAllReviews.bind(this),
  };

  constructor(private AjaxUtil : AjaxUtilService,private pipeRef : MultiConditionPipe,private router: Router){}

  ngOnInit(): void {
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

  getProjects()
  {
    const details =this.allDetails.projects, 
    project_layout = {
      ...details.layout,
      label : 'projects',
      filterList :  ['All','Ready to Occupy','Under Construction','Prelaunch','Active','Closed'],
      actions : ['delete','view'],
      add_new : true,
      cols: [{columnDispName : 'Project Name', column : 'project_name'},{columnDispName : 'Project Type', column : 'project_type'},{columnDispName : 'Project Status',column : 'project_status'},{columnDispName : 'Location', column : 'landmark'},{columnDispName : 'Range', column : 'range'},{columnDispName : 'Price',column : 'price'}]
     };
    var project_details = {
      "layout" : project_layout,
      "content" : []
     },
     params = {
      location : '',
      amenities : [],
      priceRange : [],
      projectType : [],
      searchValue : project_layout.searchVal,
      project_status : project_layout.filterValue 
    }
    this.AjaxUtil.ajax("api/json/action/getProjects",params).subscribe((jsonData)=>{
        if(jsonData.status === "success")
          project_details.content = jsonData.projects.map((project:any) => this.formatProjectVales(project))
        else
          this.updateStatusMessage(jsonData);
      this.allDetails.projects = project_details;
      this.selectedDetails = this.allDetails.projects;
    })
  }

  getAllReviews()
  {
    var reviews_layout = this.allDetails.reviews.layout;
    reviews_layout = {
      ...reviews_layout,
      label : 'reviews',
      actions : ['delete'],
      cols : [{columnDispName : 'Author', column : 'author'},{columnDispName : 'Quote', column : 'quote'}],
    }
    var review_details = {
    "layout" : reviews_layout,
    "content" : []
    }, 
    params = {
      searchValue : reviews_layout.searchVal ,
    }

    this.AjaxUtil.ajax("api/json/action/getAllReviews",params).subscribe((jsonData)=>{ 
      if(jsonData.status === "success")
        review_details.content = jsonData.reviews
      else this.updateStatusMessage(jsonData);

      this.allDetails.reviews = review_details;
      this.selectedDetails = this.allDetails.reviews;
    })
  }

  getEnquires()
  {
    var details =this.allDetails.enquires ,
    enquiry_layout ={
      ... details.layout,
      label : 'enquires',
      actionsFor : {'close': {'request_status' : 'Active'},'open': {'request_status' : 'Closed'}},
      actions : ['delete','close','open'],
      filterList : ['All','Active','Closed'],
      cols : [{columnDispName : 'Name', column : 'name'},{columnDispName : 'Mail', column : 'mail'},{columnDispName : 'Mobile', column : 'mobile'},{columnDispName : 'Project Name', column : 'project_name'},{columnDispName : 'Location', column : 'project_loation'},{columnDispName : 'Request Status',column : 'request_status'}]
    }
    var enquiry_details = {
    "layout" : enquiry_layout,
    "content" : []
    },
    params = {
      searchValue : enquiry_layout.searchVal ,
      request_status : enquiry_layout.filterValue,
      requestType : "enquires" 
    }

    this.AjaxUtil.ajax("api/json/action/getUserRequests",params).subscribe((jsonData)=>{ 
      if(jsonData.status === "success")
        enquiry_details.content = jsonData.enquires
      else this.updateStatusMessage(jsonData);

      this.allDetails.enquires = enquiry_details;
      this.selectedDetails = this.allDetails.enquires;
    })
  }

  getCallBackReq()
  {
    var details =this.allDetails.callbacks,
    callbacks_layout = {
      ...details.layout,
      label : 'callbacks',
      actionsFor : {'close': {'request_status' : 'Active'},'open': {'request_status' : 'Closed'}},
      actions : ['delete'],
      filterList : ['All','Active','Closed'],
      cols : [{columnDispName : 'Name', column : 'name'},{columnDispName : 'Mail', column : 'mail'},{columnDispName : 'Mobile', column : 'mobile'},{columnDispName : 'Preferred Time', column : 'preferred_time'},{columnDispName : 'Request Status',column : 'request_status'}]
    }
     var callbacks_details = {
    "layout" : callbacks_layout,
    "content" : []
    },
    params = {
      searchValue : callbacks_layout.searchVal ,
      request_status : callbacks_layout.filterValue,
      requestType : "callbacks"
    }

    this.AjaxUtil.ajax("api/json/action/getUserRequests",params).subscribe((jsonData)=>{ 
      if(jsonData.status === "success")
        callbacks_details.content = jsonData.callbackreq
      else this.updateStatusMessage(jsonData);

      this.allDetails.callbacks = callbacks_details;
      this.selectedDetails = this.allDetails.callbacks;
    })
  }

  getServiceReq()
  {
    var details =this.allDetails.services,
    service_layout = {
      ...details.layout,
      label : 'services',
      actions : ['delete'],
      filterList : ['All','Pending Approval','Under Review','Quotation process','In Progress','On Hold','Completed','Closed','Cancelled'],
      cols : [{columnDispName : 'Name', column : 'name'},{columnDispName : 'Mail', column : 'mail'},{columnDispName : 'Mobile', column : 'mobile'},{columnDispName : 'Service Type', column : 'service_type'},{columnDispName : 'Project Status', column : 'project_status'},{columnDispName : 'Landsize', column : 'landsize'},{columnDispName : 'Location', column : 'location'},{columnDispName : 'Request Status',column : 'request_status'}]
    };
      var service_details = {
    "layout" : service_layout,
    "content" : []
    }, 
    params = {
      searchValue : service_layout.searchVal ,
      request_status :service_layout.filterValue,
      requestType : "services"
    };

    this.AjaxUtil.ajax("api/json/action/getUserRequests",params).subscribe((jsonData)=>{ 
      if(jsonData.status === "success")
        service_details.content = jsonData.service_requests
      else this.updateStatusMessage(jsonData);

      this.allDetails.service = service_details; 
      this.selectedDetails = this.allDetails.service;
    })
  }

  handleTableActions(event : {actionName : string, param : any})
  {
    var changeTo = this.selectedContent;
    if(event.actionName === "refresh")
    {
      if(this.actions[changeTo])
       this.actions[changeTo]();
    }
    else if(event.actionName === "delete")
    {
      Swal.fire({
        title: 'Are you sure want to Delete ?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
      }).then((result:any) => {
        if (result.isConfirmed) 
         this.handleDeleteOptions(event.param);
      })
    }
    else if(event.actionName === "addMore")
    {
      this.router.navigate(['/profile/add-project']);
    }
    else if(event.actionName === "open")
    {
      Swal.fire({
        title: 'Are you Sure?',
        text: 'This action will keep the request open. Do you wish to proceed?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Continue',
      }).then((result) => {
        if (result.isConfirmed) {
          this.handleOpenCloseActions(event.param,this.selectedContent,true);
        }
      })
    }
    else if(event.actionName === "close")
    {
      Swal.fire({
        title: 'Are you Sure?',
        text: 'Proceeding will result in the closure of this request. Do you wish to continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Continue',
      }).then((result) => {
        if (result.isConfirmed) {
          this.handleOpenCloseActions(event.param,this.selectedContent,false);
        }
      })
    }
    else if(event.actionName === "view")
    {  var project_id = parseInt(event.param.project_id)
      window.open(`${window.location.origin}/project-details?projectId=${project_id}`, '_blank');
    }
  }

  handleOpenCloseActions(record: any,toggleRequest: string,request_status: boolean)
  {
    if(toggleRequest === "enquires")
     this.toggleRequestStatus({"enquiry_req_id": record.enquiry_req_id, "toggle" : "enquires","request_status": request_status})
    else if(toggleRequest === "callbacks")
      this.toggleRequestStatus({"call_back_req_id": record.call_back_req_id, "toggle" : "callbacks","request_status":request_status})
  }

  toggleRequestStatus(params : any)
  {
    this.AjaxUtil.ajax('api/json/action/toggleRequestStatus',params).subscribe((jsonData)=>{
      this.updateStatusMessage(jsonData)
      if(jsonData.status === "success")
      {
        if(this.actions[this.selectedContent])
          this.actions[this.selectedContent]();
      } 
    })
  }
  
  toggleContents()
  {
    var changeTo = this.selectedContent, details = this.allDetails[changeTo];
    if(Object.keys(details.content).length != 0)
        this.selectedDetails = details;
    else if(this.actions[changeTo])
      this.actions[changeTo]();
  } 

  formatProjectVales(project : any)
  {
     const min_area =  this.pipeRef.transform("customNumberFormat",[project.min_built_area]),
        max_area = this.pipeRef.transform("customNumberFormat",[project.max_built_area]),
        min_price = this.pipeRef.transform("priceRange",[project.min_price]),
        max_price = this.pipeRef.transform("priceRange",[project.max_price]),
        range = `${(min_area === max_area ? min_area : min_area +" - "+ max_area )} sqft `,
        price = `Rs. ${(min_price === max_price ? min_price :  min_price+" - "+max_price  )}`

        return {...project,...{"price" : price,"range":range}};
  }

  handleDeleteOptions(record: any)
  {
    var deleteFrom = this.selectedContent;
    if(deleteFrom === 'projects')
    {
      this.AjaxUtil.ajax("api/json/action/deleteProject",{"project_id": record.project_id}).subscribe((jsonData)=>{
        this.updateStatusMessage(jsonData)
        if(jsonData.status === "success")
          this.getProjects();
      })
    }
    else if(deleteFrom === "services")
      this.deleteRequests({"service_req_id": record.service_req_id,"delete" : "services","customer_id": record.customer_id})
    else if(deleteFrom === "callbacks")
      this.deleteRequests({"call_back_req_id": record.call_back_req_id,"delete" : "callbacks","customer_id": record.customer_id})
    else if(deleteFrom === "enquires")
      this.deleteRequests({"enquiry_req_id": record.enquiry_req_id, "delete" : "enquires","customer_id": record.customer_id})
    else if(deleteFrom === "reviews")
    {
      this.AjaxUtil.ajax("api/json/action/deleteReview",{"review_id": record.review_id}).subscribe((jsonData)=>{
        this.updateStatusMessage(jsonData)
        if(jsonData.status === "success")
          this.getAllReviews();
      })
    }
  } 

  deleteRequests(params: any)
  {
    this.AjaxUtil.ajax("api/json/action/deleteRequests",params).subscribe((jsonData)=>{
      this.updateStatusMessage(jsonData)
      if(jsonData.status === "success")
      {
        if(this.actions[this.selectedContent])
          this.actions[this.selectedContent]();
      } 
    })
  } 

}
