import { Component, EventEmitter, Input, Output , OnInit ,ChangeDetectorRef, QueryList, ViewChildren, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observer } from 'gsap/Observer';
import { FirebaseService } from '../../service/firebase.service';
import { AjaxUtilService } from '../../service/ajax-util.service';
import { LocalStorageService } from '../../service/local-storage.service';
import { LoaderComponent } from '../utils/loader/loader.component';
import { MsgBoxComponent } from '../utils/msg-box/msg-box.component';
import intlTelInput from 'intl-tel-input';
import $ from 'jquery'; 

@Component({
  selector: 'app-login-module',
  standalone: true,
  imports: [CommonModule,LoaderComponent,MsgBoxComponent],
  templateUrl: './login-module.component.html',
  styleUrl: './login-module.component.scss',
})
export class LoginModuleComponent implements OnInit {


  @Input() isOpen: boolean = false;
  @Output() isOpenChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;
  currentTab = 1; 
  user = { email: '', mobile: '' }; 
  isMobile = false; 
  isloading: boolean = false;
  statusMessage = { show: false, msg: '', status: '' }  ;
  customToken : any;

  otp: string = '';
  confirmationResult: any;

  constructor(private firebaseService: FirebaseService,private cd: ChangeDetectorRef,private AjaxUtil :  AjaxUtilService,private cookies : LocalStorageService) {}

  ngOnInit() {
    
  }

  bindConfigurations() {
    if (this.currentTab === 3) {
      const inputElement = document.getElementById("phone") as HTMLInputElement;
      if (inputElement) {
        intlTelInput(inputElement, {
          initialCountry: 'in',
          separateDialCode: true,
          loadUtilsOnInit: "https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/utils.js",
        });
      }
    }else if(this.currentTab === 4)
    {
      this.startTimer();
    }
  }

  // Toggle between tabs
  selectTab(tabNumber: number) {
    this.currentTab = tabNumber;
    this.cd.detectChanges();   
     this.bindConfigurations(); 
  }

  //Updates StatusMessage of the msg-box component
  updateStatusMessage(jsonData: any):void
  {
      var statusMessage ={
        show: true,
        msg: jsonData.message,
        status: jsonData.status
      }
      this.statusMessage = statusMessage;
  }

  // Handle Google Sign-In (to be implemented with Google's API)
  signInWithGoogle() {
    this.firebaseService.googleSignIn().then((jsonData)=>{

      if(jsonData.status ===  "success")
      {
        jsonData.hasOwnProperty("jwtToken") && this.cookies.setItem("jwtToken",jsonData.jwtToken);
        this.firebaseService.updateUserInfo({})
        this.toggleContainer('login-container','slidetoTop');
      }
       this.updateStatusMessage(jsonData)
    });
  }

  toggleContainer(className: string,slideClass: string)
  {
    var element = $('.' + className);
      element.toggleClass('activate');
      element.toggleClass(slideClass);
      this.isOpen=!this.isOpen
      this.isOpenChange.emit(this.isOpen);

      if (this.isOpen) {
        Observer.getAll().forEach(observer => observer.disable());
      } else {
        Observer.getAll().forEach(observer => observer.enable());
      }
  }

  checkMaxLength(maxlength : number,event : Event) {
    const inputElement = event.target as HTMLInputElement; 
    var value = (inputElement.value).replace(/[^\d\s]/g, '');
    if (value.replace(' ','').length > maxlength) {
      value = value.slice(0, maxlength);
    }
    inputElement.value = value;
  }

  ResendOTP()
  {

  }


  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.value.length > 1) {
      input.value = '';
      return;
    }
    // Move to the next input if value is entered and it's not the last input
    if (input.value.length === 1 && (index < this.otpInputs.length - 1)) {
      this.otpInputs.toArray()[index + 1].nativeElement.removeAttribute('disabled');
      this.otpInputs.toArray()[index + 1].nativeElement.focus();
      input.setAttribute('disabled', 'true');
    }

    // If the user presses Backspace, move to the previous input
    if (input.value.length === 0 && (index > 0)) {
      this.otpInputs.toArray()[index].nativeElement.setAttribute('disabled', 'true');
      this.otpInputs.toArray()[index - 1].nativeElement.removeAttribute('disabled');
      this.otpInputs.toArray()[index - 1].nativeElement.focus();
    }
  }

   sendOtp(isMobile: boolean,event: Event) {
    this.isMobile = isMobile;
    event.preventDefault();
    if (isMobile) {
      this.sendMobileOtp();
    } else {
      this.sendMailOtp();
    }    
  }

  async sendMobileOtp()
  {
    var element=document.getElementById("phone") as HTMLInputElement;
    if(element && element.value.length >= 10)
    {
      this.user.mobile =document.getElementsByClassName("iti__selected-dial-code")[0].innerHTML+""+(element.value).replace(/[^\d]/g, '');;
      console.log("send otp using firebase");
      try {
        this.firebaseService.setupRecaptcha('recaptcha-container');
        this.confirmationResult = await this.firebaseService.signInWithPhoneNumber(this.user.mobile);
        this.selectTab(4);
      } catch (error) {
        console.error("Error sending OTP:", error);
      }
    }
  }

  sendMailOtp(): void 
  {
    var element=document.getElementById("mailInput") as HTMLInputElement;
    if(element)
    {
      var mail = element.value;
      if (mail != '' && mail != undefined) {
        this.user.email = mail;
        this.isloading = true;
        this.AjaxUtil.ajax('api/json/action/sendOTP',{mailId: mail}).subscribe((jsonData) => {
          this.isloading = false;
          if (jsonData.status == 'success') {
            element.value = ""
            this.selectTab(4);
          }
          this.updateStatusMessage(jsonData)
                            
        });
      }
    }
  }

  startTimer()
  {
    var timeleft = 30, timerElement = document.getElementById('countdowntimer') as HTMLElement;
    if(timerElement)
    {
      var resendTimer = setInterval(function () {
        timeleft--;
       timerElement.textContent ='Resend in ' + timeleft + ' seconds';
        if (timeleft <= 0) {
          clearInterval(resendTimer);
          timerElement.textContent = 'Resend OTP';
        }
       
      }, 1000);
    }
  }

  verifyOtp(event: Event)
  {
    event.preventDefault()
    this.isMobile ? this.verifyMobileOtp() : this.verifyMailOtp(event) ;
  }

  verifyMailOtp(event:Event)
  {
    event.preventDefault();
    var inputs = this.otpInputs;
    var otp = '';
    inputs.forEach(function (input) {
      var i = input.nativeElement;
      otp += i.value;
    });

    this.AjaxUtil.ajax('api/json/action/authenticateUser',{"mailId": this.user.email,"otp": otp}).subscribe((jsonData)=>{
      this.cookies.setItem("jwtToken",jsonData.jwtToken);
      this.customToken = jsonData.customToken;
      this.firebaseService.signInWithCustomToken(this.customToken);
      this.toggleContainer('login-container','slidetoTop');
    })
  }


  async verifyMobileOtp() {
    try {
      const user = await this.firebaseService.verifyOtp(this.confirmationResult, this.otp);
      console.log('User signed in:', user);
    } catch (error) {
      console.error("Error verifying OTP:", error);
    }
  }
}
