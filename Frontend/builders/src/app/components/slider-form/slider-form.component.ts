import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PopUpServiceComponent } from '../utils/pop-up-service/pop-up-service.component';
import { LoaderComponent } from '../utils/loader/loader.component';
import { MsgBoxComponent } from '../utils/msg-box/msg-box.component';

import { AjaxUtilService } from '../../service/ajax-util.service';

import { gsap } from 'gsap/gsap-core';

@Component({
  selector: 'app-slider-form',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,PopUpServiceComponent,LoaderComponent,MsgBoxComponent],
  templateUrl: './slider-form.component.html',
  styleUrl: './slider-form.component.scss'
})
export class SliderFormComponent implements OnInit{

  serviceReqForm!: FormGroup;
  @ViewChild('animatedForm') animatedForm! : ElementRef;
  @ViewChild('decoratorElement1') decoratorElement1! : ElementRef;
  @ViewChild('decoratorElement2') decoratorElement2! : ElementRef;

  showCustomLocations : boolean = false;
  isloading : boolean = false;
  statusMessage = {show : false,msg : '',status : ''}

  constructor(private fb: FormBuilder,private AjaxUtil : AjaxUtilService){}

  ngOnInit(): void {
    this.serviceReqForm = this.fb.group({
      service_type : ['',Validators.required],
      status1 : ['',Validators.required],
      status2 : ['',Validators.required],
      landSize    : ['',Validators.required],
      location : ['',Validators.required],
      name : ['',Validators.required],
      mail : ['',[Validators.required,Validators.email]],
      mobile : ['',[Validators.required,Validators.pattern(/^\d{10}$/)]]
    })
 
  }

  updateStatusMessage(jsonData : any)
  {
    var statusMessage ={
      show: true,
      msg: jsonData.message,
      status: jsonData.status
    }
    this.statusMessage = statusMessage;
  }

  @HostListener('mousemove', ['$event'])
  applyAnimations(event: MouseEvent ){  
    const mouseX = event.clientX;
    const mouseY = event.clientY; 
    const tl = gsap.timeline({
      
    });
      gsap.to([this.decoratorElement1.nativeElement,this.decoratorElement2.nativeElement], {
        // x: -(mouseX - window.innerWidth / 2 )*  0.009,
        y: -(mouseY - window.innerHeight / 2 ) * 0.009, 
        ease: 'power3.out',
        duration: 1 
      });
  }

  turnAround(event:Event ,rotateBy: string)
  {  
    event.stopPropagation();
     var ele = this.animatedForm.nativeElement as HTMLElement;
     ele.style.transform = `translateZ(-350px) ${rotateBy}`;
  }

  resetForm()
  {
    this.serviceReqForm.reset();
    this.turnAround(new MouseEvent('click',{}),'rotateY(0deg)')
  }
  
  getValidControls()
  {
    return Object.values(this.serviceReqForm.controls).filter(control => control.valid)
  }

  toggleAnimations(show: boolean)
  { 
    var element = this.animatedForm.nativeElement;
    if(show)
      element.classList.add('animate'); 
    else
      element.classList.remove('animate'); 
  }

  handlePopUpActions(event: {action : string, params: any})
  { 
      if(event.action === "changeLocation")
      { 
        this.serviceReqForm.get('location')?.setValue(event.params); 
        this.turnAround(new MouseEvent('click',{}),'rotateX(90deg)');
      }
  }

  toggleLoationContainer()
  {
    this.showCustomLocations = !this.showCustomLocations;
  }

  addNewServiceReq(event : Event)
  {
    event.preventDefault();
    this.isloading = true;
     this.AjaxUtil.ajax("api/json/action/addServiceReq",this.serviceReqForm.value).subscribe((jsonData)=>{
      this.isloading = false;
      if(jsonData.status === "success")
      {
        this.resetForm();
        this.toggleAnimations(true)
      }
      this.updateStatusMessage(jsonData)
     })
  }
 
}
