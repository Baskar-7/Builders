import { Component, OnInit } from '@angular/core';
import { RouterOutlet,Router,RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { SvgComponent } from '../utils/svg/svg.component';
import { FirebaseService } from '../../service/firebase.service';
import { AjaxUtilService } from '../../service/ajax-util.service';

import $ from 'jquery';
import { MsgBoxComponent } from '../utils/msg-box/msg-box.component';
import { LoaderComponent } from '../utils/loader/loader.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterOutlet,CommonModule,SvgComponent,RouterLink,MsgBoxComponent,LoaderComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit{

  activeTab= 'Profile';
  statusMessage = { show: false, msg: '', status: '' };
  isLoading= false;

  constructor(private router:Router,public firebase: FirebaseService,private AjaxUtil: AjaxUtilService){
  }

  async ngOnInit() {
    this.setActiveTab();
    this.isLoading=true;
    await this.firebase.getUserCredential("email");
    this.isLoading = false;
  }

  toggleContainer(className: string)
  {
    var element = $('.' + className);
      element.toggleClass('expand');
      element.toggleClass('shrink');
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

  setActiveTab()
  {
    var currentUrl = this.router.url.replace("/profile/","");
    var activeTab = "Profile";

    if(currentUrl === "profile-details")
      activeTab = "Profile";
    else if(currentUrl === "add-project")
      activeTab = "New-Projects";
    else if(currentUrl === "manage-details")
      activeTab = "Manage-details";

    this.activeTab = activeTab;
  }

  invalidateSession()
  {
    this.firebase.signOut();
    this.AjaxUtil.ajax("api/json/action/logout",'').subscribe(()=>{
      this.updateStatusMessage({"message": "Logged out successfully", "status": "success"})
    })
    this.router.navigate(['/home']);
  }

  updateProfilePic(event: Event)
  {
    event.preventDefault();
    var image = document.getElementsByClassName('profile-image')[0] as HTMLInputElement,target =event.target as HTMLInputElement,src ="";
    var file;
    if(target && target.files && target.files[0]){
      src = URL.createObjectURL(target.files[0]);
      file =target.files[0]
    }
    image.src = src;
    this.AjaxUtil.createFormAndSubmitFile('api/json/action/updateProfilePic',file,this.firebase.userPictureId).subscribe((jsonData:any) => {
       this.updateStatusMessage(jsonData);
       if(jsonData.status == "success"){
        this.firebase.updateUserInfo({ email : this.firebase.userMail});
       }
    });
  }

  

}
