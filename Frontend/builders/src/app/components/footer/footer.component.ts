import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AjaxUtilService } from '../../service/ajax-util.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit{
 
 @Output() handleActions = new EventEmitter<any>;

 details :any = {}

 constructor(private AjaxUtil: AjaxUtilService){}

 ngOnInit(): void {
   this.getBuilderDetails();
 }

 getBuilderDetails()
 { 
   this.AjaxUtil.ajax("api/json/action/getUserInfo",{"mail": 'baskar97917@gmail.com'}).subscribe((jsonData)=>{
    this.details = jsonData
   })
 }

 handleAction(param: any)
 {
  this.handleActions.emit({action: "scrollTo",params : param})
 }

}
