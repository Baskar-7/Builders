import {  ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Observer } from 'gsap/Observer';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

import { LoginModuleComponent } from '../login-module/login-module.component';
import { PopUpServiceComponent } from '../utils/pop-up-service/pop-up-service.component';
import { ProjectsComponent } from '../projects/projects.component';
import { LoaderComponent } from '../utils/loader/loader.component';
import { MsgBoxComponent } from '../utils/msg-box/msg-box.component';
import { FooterComponent } from '../footer/footer.component';
import { SliderFormComponent } from '../slider-form/slider-form.component';

import { FirebaseService } from '../../service/firebase.service';
import { UtilsService } from '../../service/utils.service';
import { AjaxUtilService } from '../../service/ajax-util.service';

import $ from 'jquery';
import { gsap } from 'gsap';
import { MultiConditionPipe } from '../../pipes/multi-condition.pipe';

gsap.registerPlugin(Observer);

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [CommonModule,RouterLink,ProjectsComponent,LoginModuleComponent,LoaderComponent,MsgBoxComponent,FooterComponent,PopUpServiceComponent,ReactiveFormsModule,SliderFormComponent],
  providers:[MultiConditionPipe],
    templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit,OnDestroy{


  gotoSection!: (index: number, direction: number) => void;
  canScroll! :(event: any,direction : number) => boolean;

  animating: boolean = false;
  isLoginOpen: boolean = false;
  isLoading: boolean = false;
  statusMessage = { show: false, msg: '', status: '' };
  reviewInterval!: ReturnType<typeof setInterval>;
  showReviewPopup = false;
  callBackForm! : FormGroup
  reviews :any[] = []

  constructor(public firebaseService: FirebaseService,public utils: UtilsService,private fb:FormBuilder,private AjaxUtil: AjaxUtilService,private cdr: ChangeDetectorRef,private pipeRef: MultiConditionPipe){}

  async ngOnInit(){
    this.callBackForm = this.fb.group({
      name : ['',Validators.required],
      mail : ['',[Validators.required,Validators.email]],
      mobile : ['',[Validators.required,Validators.pattern(/^\d{10}$/)]],
      beforeOrAfter : ['Before',Validators.required],
      time: ['', Validators.required],
    })
    this.getAllReviews();
    this.getBuilderDetails();
  }

  async ngAfterViewInit () { 
     this.initGSAP();
     this.startIntroSlides();
     this.startReviewSlides(1);
  }

  ngOnDestroy(): void {
    Observer.getAll().forEach(observer => observer.kill()); 
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

  initMap(latitude:number = 13.0843  ,longitude : number = 80.2705,locationDetials :any)
  { 
       (!latitude || !longitude) && (latitude = 13.0843 , longitude = 80.2705) 
      const map = new google.maps.Map(document.getElementById("gmap") as HTMLElement,  {
        mapId: "DEMO_MAP_ID", // Map ID is required for advanced markers.
        center: { lat: latitude, lng: longitude }, 
        zoom: 100, 
        zoomControl: false,  
        scrollwheel: false,  
        gestureHandling: "none", 
        mapTypeId: google.maps.MapTypeId.ROADMAP, 
        streetViewControl: true, 
        fullscreenControl: false,
      });  

    const marker =  new google.maps.marker.AdvancedMarkerElement({
      position: { lat: latitude, lng: longitude },
      map: map,
      title: 'Project Location',
    });
    const infoWindowContent = `
      <div style="font-size: 7px;">
        <h3>SGS CONSTRUCTIONS</h3>
        <p><strong>Address:</strong> ${locationDetials.address}</p>
        <p><strong>Mobile:</strong> ${locationDetials.mobile}</p>
        <p><strong>Mail:</strong> ${locationDetials.mail}</p>
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

  startIntroSlides()
  {
      const slideshowImages = document.querySelectorAll<HTMLElement>(".intro-slideshow img");
      var quoteElement  = document.getElementById("quote");
      const slideshowQuotes = ["SGS: Building the future, one brick at a time",
              "Great things are built from small beginnings—let SGS lay the foundation for your dreams.",
              "Craftsmanship is the soul of every structure; at SGS, we perfect that craft.",
             "Quality construction is the foundation of lasting success—trust SGS for your next project.",
              "From blueprint to reality: SGS is here to construct your dreams.",
              "We don’t just build structures; at SGS, we create lasting experiences.",
              "Good buildings come from good people; all problems are solved by good design. Trust SGS.",
              "Dream big, build bigger—SGS is your partner in progress.",
              "Your vision is our blueprint; let SGS bring it to life.",
              "Constructing not just buildings, but lasting legacies—SGS is committed to excellence.",
              "Building a better tomorrow starts with SGS today."];
      const nextImageDelay = 8000;
      let currentImageCounter = 0; 
      slideshowImages[currentImageCounter].style.opacity = '1';

      if(quoteElement)
        quoteElement.innerHTML=slideshowQuotes[currentImageCounter];

      setInterval(() => {
        slideshowImages[currentImageCounter].style.opacity = '0';
        currentImageCounter = (currentImageCounter + 1) % slideshowImages.length;
        slideshowImages[currentImageCounter].style.opacity = '1';
        if(quoteElement)
          quoteElement.innerHTML=slideshowQuotes[currentImageCounter];
      }, nextImageDelay); 
  }

  startReviewSlides(moveBy: number)
  {
     if(this.reviewInterval)
        clearInterval(this.reviewInterval);
    const nextImageDelay = 5000,reviewSlides = document.querySelectorAll<HTMLElement>(".reviews-slider .review");
    if(reviewSlides){ 
      this.slide(reviewSlides,this.utils.reviewCounter,moveBy)
      this.reviewInterval = setInterval(() => {
      this.slide(reviewSlides,this.utils.reviewCounter,moveBy)
      }, nextImageDelay);
    }
  }

  slide(slides: any,counter : number,moveBy : number)
  {
    let tl = gsap.timeline({
      defaults: { duration: 1, ease: "power1.inOut" },
    }); 
    tl.fromTo(slides[counter],{autoAlpha:1,x:0},{autoAlpha: 0,x:100 * -(moveBy)})
    counter = (counter + moveBy + slides.length) % slides.length;  
    tl.fromTo(slides[counter],{autoAlpha:0,x:100 * moveBy},{autoAlpha:1,x:0,duration: .5},"-=.3");
    this.utils.setReviewCounter(counter) 
  }

  initGSAP() { 

    let sections = document.querySelectorAll<HTMLElement>("section.page-content"),
    images = document.querySelectorAll<HTMLElement>(".bg"),
    outerWrappers = gsap.utils.toArray(".outer"),
    innerWrappers = gsap.utils.toArray(".inner"),
    wrap = gsap.utils.wrap(0, sections.length);

    gsap.set(outerWrappers, { yPercent: 100 });
    gsap.set(innerWrappers, { yPercent: -100 });

    this.canScroll = (event: any,direction : number) => {
      const specificSection = sections[this.utils.currentIndex];
      const currentSection = specificSection.querySelectorAll<HTMLElement>(".content")[0];
      if(!currentSection || (currentSection.scrollTop == 0 && direction == -1))
        return true;
      else if(currentSection.scrollTop > 0 && direction == -1)
        return false;

      const isScrollable =  currentSection.scrollHeight > currentSection.clientHeight;
      const isAtEnd =  Math.ceil(currentSection.scrollTop + currentSection.clientHeight + 5) >= currentSection.scrollHeight; 

      if (event && typeof event.preventDefault === 'function'&& isScrollable && !isAtEnd) 
          event.preventDefault();
        
 
      return !isScrollable || isAtEnd;
    };

    this.gotoSection = (index: number, direction: number) => {
      this.animating = true; 
      var current_index = this.utils.currentIndex;
      index = wrap(index); 
      
      let fromTop = direction === -1,
          dFactor = fromTop ? -1 : 1;

      let tl = gsap.timeline({defaults: { duration: 0.75, ease: "power1.inOut" },onComplete: () =>{ this.animating = false;}});

      if (current_index >= 0 && current_index != index) {
        gsap.set(sections[current_index], { zIndex: 0 });
        tl.to(images[current_index], { yPercent: -15 * dFactor }).set(sections[current_index], { autoAlpha: 0 });
      } 

      gsap.set(sections[index], { autoAlpha: 1, zIndex: 1 });
      tl.fromTo([outerWrappers[index], innerWrappers[index]], {yPercent: (i: any) => i ? -100 * dFactor : 100 * dFactor}, {yPercent: 0}, 0)
        .fromTo(images[index], { yPercent: 15 * dFactor }, { yPercent: 0 }, 0);
      if(index === 0 || current_index === 0){
        document.getElementById('whatsapp')?.classList.toggle('hide');
      }
      this.utils.setCurrentIndex(index); 
    };

    Observer.create({
      type: "wheel",
      wheelSpeed: -1,
      onDown: (event) => !this.animating && this.canScroll(event,-1) && this.gotoSection(this.utils.currentIndex - 1, -1),
      onUp: (event) => !this.animating && this.canScroll(event,1) && this.gotoSection(this.utils.currentIndex + 1, 1),
      tolerance: 10,
    });
    
    this.gotoSection(this.utils.currentIndex, 1);
  }

  getAllReviews()
  {
    this.isLoading = true
    this.AjaxUtil.ajax("api/json/action/getAllReviews",{"searchValue" : ''}).subscribe((jsonData)=>{ 
      this.isLoading = false
      this.reviews = jsonData.reviews;
      this.cdr.detectChanges();
      this.startReviewSlides(1);
    })
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

  scrollTo(index : number) 
  {
    if(!this.animating)
    {
      if(this.utils.currentIndex > index)
        this.gotoSection(index,-1);
      else if(this.utils.currentIndex < index)
        this.gotoSection(index,1);
    }
  }

  togglePopup()
  { 
    this.showReviewPopup = !this.showReviewPopup;
    this.utils.toggleObserver(this.showReviewPopup)
  }

  addNewCallBackReq(event: Event)
  {
    event.preventDefault();
    if(this.callBackForm.valid)
    {
      this.callBackForm.get('time')?.setValue(this.callBackForm.get('beforeOrAfter')?.value+" "+ this.pipeRef.transform("convertTo12hrs",[this.callBackForm.get("time")?.value]))
      this.isLoading = true;
      this.AjaxUtil.ajax("api/json/action/addNewCallBackReq", this.callBackForm.value).subscribe((jsonData) =>{
        this.isLoading = false;
        this.updateStatusMessage(jsonData);
        if(jsonData.status === "success")
          this.callBackForm.reset();
      })
    }
    else 
    {
      this.callBackForm.markAllAsTouched();
    }
  }

  handleActions(event : {action: string, params: any})
  {
    if(event.action == "refresh")
    {
      this.getAllReviews();
    }
    else if (event.action === "scrollTo")
    {
      this.scrollTo(event.params)
    }
  }

  getBuilderDetails()
  {
    this.isLoading = true;
    this.AjaxUtil.ajax("api/json/action/getUserInfo",{"mail": 'baskar97917@gmail.com'}).subscribe((jsonData)=>{
      this.isLoading = false;
      var location = jsonData.maplocation.split(',');
      this.initMap(parseFloat(location[0]), parseFloat(location[1]),jsonData);
    })
  }

  externalLink(link: string)
  {
    window.open(link)
  }
 
  stopScrollPropagation(event: Event): void {
    event.stopPropagation(); 
  }

}
