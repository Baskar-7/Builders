import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder,FormGroup,Validators ,ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
//service
import { FirebaseService } from '../../../../service/firebase.service';
import { AjaxUtilService } from '../../../../service/ajax-util.service';
//components
import { LoaderComponent } from '../../../utils/loader/loader.component';
import { MsgBoxComponent } from '../../../utils/msg-box/msg-box.component';
import { PopUpServiceComponent } from '../../../utils/pop-up-service/pop-up-service.component';
//external library
import $ from 'jquery';
import { LocalStorageService } from '../../../../service/local-storage.service';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,LoaderComponent,MsgBoxComponent,PopUpServiceComponent],
  templateUrl: './profile-details.component.html',
  styleUrl: './profile-details.component.scss'
})
export class ProfileDetailsComponent implements OnInit{

  constructor(private AJAXUtil: AjaxUtilService,public firebase :FirebaseService,private fb: FormBuilder,private cdr: ChangeDetectorRef,private cookies: LocalStorageService){}
  personal_details!: FormGroup;
  showOtpContainer: boolean = false;
  isLoading: boolean = false;
  statusMessage = { show: false, msg: '', status: '' };
  userDetails = this.getDefaultUserDetails()
  showLocations : boolean = false;


  ngOnInit() { 
    this.personal_details = this.fb.group({
      fname: ['', Validators.required],
      lname: ['', Validators.required],
      mail: ['', [Validators.required, Validators.email]],
      mobile: ['',[Validators.required, Validators.pattern(/^\d{10}$/)]],
      address : ['',Validators.required],
      pincode : ['',[Validators.required, Validators.pattern(/^\d{6}$/)]],
      city : ['',Validators.required],
      state: ['',Validators.required],
      maplocation: [' 13.0843, 80.2705 ',Validators.required]
    });
   this.getUserInfo()
   this.personal_details.disable();
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

  //Fetch the userInfo and updates the userDetails object
  async getUserInfo()
  { 
    this.isLoading=true; 
    this.AJAXUtil.ajax("api/json/action/getUserInfo",{}).subscribe((jsonData)=>{
      this.isLoading=false;
      if(jsonData.status === "success")
        this.userDetails = {...jsonData,lastUsedPincode : 0,lastOtp : ''};
      else
        this.userDetails = this.getDefaultUserDetails();
      this.resetFormControls();
    });
  }

  getDefaultUserDetails() {
    return {
      mail: this.firebase.userMail,
      fname: this.firebase.userFName,
      photoURL: this.firebase.userPicture,
      mobile: this.firebase.userMobile, 
      acc_type: 'user',
      lname: '',
      city: '',
      state: '',
      pincode: '',
      lastUsedMail: '',
      isMailValidated: true,
      lastUsedPincode: 0,
      lastOtp: '',
    };
  }


  //get the location of the user using pincode by using indian postal code api..
  getLocation(event: Event)
  {
    var pincode = this.personal_details.get('pincode')?.value;

    if (pincode && pincode.toString().length === 6 && this.userDetails.lastUsedPincode != pincode) {
      (event.target as HTMLElement)?.blur();;
      this.isLoading=true;
      this.AJAXUtil.getLocationWithPincode(pincode).subscribe((jsonData)=>{
        this.isLoading=false
        if (jsonData && jsonData[0].Status === 'Success') {
          var state = jsonData[0].PostOffice[0].State, city = jsonData[0].PostOffice[0].District;
          this.userDetails.state = state;
          this.personal_details.get("state")?.setValue(state);
          this.userDetails.city = city;
          this.personal_details.get("city")?.setValue(city);
          this.userDetails.lastUsedPincode = pincode;
        }
      })
    }
  }

  handlePopupServiceActions(event : {action: string,params : any})
  { 
    if(event.action === "refresh")
    {
      this.cdr.detectChanges();
    }
    else if(event.action === "selectLocation")
    { 
      this.personal_details.patchValue({"maplocation": `${event.params.latitude},${event.params.longitude}`});
      this.cdr.detectChanges(); 
    }
  }

  resetFormControls(){
    this.personal_details.patchValue(this.userDetails);
  }

  cancelUserUpdates()
  {
    this.toggleEdit('Personal_details');
    this.resetFormControls();
    this.resetMailValidations();
    this.personal_details.disable();
  }

  togglePopup(event: Event)
  {
    event.preventDefault();
    this.showLocations = !this.showLocations;
  }

  updateUserDetails(event: Event)
  {
    event.preventDefault();
    if(this.personal_details.get('mail')?.dirty)
    {
      var message ={
        show: true,
        message: "Validate the mail to Update user Details!..",
        status: "error"
      }
      this.updateStatusMessage(message)
      return ;
    }
    if(this.personal_details.valid)
    {
      this.isLoading = true;
      this.AJAXUtil.ajax('api/json/action/updateUserDetails', {"user_details":  this.personal_details.value}).subscribe((jsonData) => {
        this.isLoading = false;
        this.updateStatusMessage(jsonData);
        if (jsonData.status == 'success') {
          this.toggleEdit('Personal_details');
          this.personal_details.disable();
          if(jsonData.isNewUserMail) 
          {
            this.cookies.setItem("jwtToken",jsonData.jwtToken);
            this.firebase.signInWithCustomToken(jsonData.customToken);
          }
        }
      });
    }
    else  
      this.personal_details.markAllAsTouched(); 
  }

  toggleEdit(className: string) {
    this.personal_details.enable();
    var selectedClass = $('.' + className);
    selectedClass.find('.btn-block').toggle();
    selectedClass.find('.edit-btn').toggle();
  }

  cancelValidation(event: Event)
  {
    event.preventDefault();
    const mailControl = this.personal_details.get('mail');
    if (mailControl) {
        mailControl.enable();
        mailControl.setValue(this.userDetails.lastUsedMail || this.userDetails.mail); 
        mailControl.markAsPristine();
        if(this.showOtpContainer)
          this.showOtpContainer=!this.showOtpContainer
    }
  }

  validateMail(event: Event): void 
  {
    event.preventDefault();
    var mail = this.personal_details.get('mail')?.value;
    if (mail != '' && mail != undefined) 
    {
      this.isLoading = true;
      this.AJAXUtil.ajax('api/json/action/sendOTP',{mailId: mail}).subscribe((jsonData) => {
        this.isLoading = false;
        if (jsonData.status == 'success') {
          this.personal_details.get('mail')?.disable();
          var btn = document.getElementById("validate-btn") as HTMLButtonElement;
          btn.style.backgroundColor = "#a09c9c";
          btn.disabled = true;
          this.showOtpContainer = !this.showOtpContainer;
        }
        this.updateStatusMessage(jsonData)
      });
    }
  }

  resetMailValidations(){
    this.personal_details.get('mail')?.disable();
    var btn = document.getElementById("validate-btn") as HTMLButtonElement;
    btn.style.backgroundColor = "#04AA6D";
    btn.disabled = false;
    this.showOtpContainer =false;
    const mailControl = this.personal_details.get('mail');
    mailControl?.enable();
    mailControl?.markAsPristine();
  }

  verifyOtp(){
    var otpContainer = document.getElementById('otp') as HTMLInputElement;
    var currentOtp = otpContainer.value;

    if(currentOtp.length == 4 && this.userDetails.lastOtp != currentOtp ) 
    {
      var mail = this.personal_details.get('mail')?.value;
      otpContainer.blur();
      this.AJAXUtil.ajax("api/json/action/verifyCredentials",{ "credential": mail,"otp": currentOtp}).subscribe((jsonData)=>{
        if (jsonData.status == 'success') {
          this.userDetails.lastUsedMail = mail;
          this.resetMailValidations();
        }
        this.userDetails.lastOtp = currentOtp;
        this.updateStatusMessage(jsonData);
      })
    }
    else if(currentOtp.length != 4){
      otpContainer.style.border = "1px solid red";
    }
  }


}
