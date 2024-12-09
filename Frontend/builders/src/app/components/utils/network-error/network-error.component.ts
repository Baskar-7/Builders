import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-network-error',
  standalone: true,
  imports: [],
  templateUrl: './network-error.component.html',
  styleUrl: './network-error.component.scss'
})
export class NetworkErrorComponent {

  interval : any;
  @ViewChild('icon') icon! : ElementRef;

  constructor(private router: Router){}

  retryNavigation()
  {
    clearInterval(this.interval);
    this.icon.nativeElement.classList.toggle('fa-spin');

    var iconRef=this.icon,retryCount=0;
    var rotationInterval = setInterval(() => {
      this.router.navigate(['home']);
      retryCount++;
      if(retryCount===5)
      {
        iconRef.nativeElement.classList.remove('fa-spin');
        clearInterval(rotationInterval);
      }
    }, 1000);

  }
}
