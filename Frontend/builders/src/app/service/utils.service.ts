import { Injectable } from '@angular/core';
import { Observer } from 'gsap/Observer';
import {gsap} from 'gsap';

import $ from 'jquery';

gsap.registerPlugin(Observer);

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  private currentMainPageIndex = 0;
  private reviewCounterIndex = 0;

  setReviewCounter(index: number)
  {
    this.reviewCounterIndex = index;
  }

  get reviewCounter()
  {
    return this.reviewCounterIndex;
  }

  get currentIndex()
  {
    return this.currentMainPageIndex;
  }

  setCurrentIndex(index: number)
  {
    this.currentMainPageIndex = index; 
  }

  toggleObserver(doEnable : boolean)
  { 
    if(doEnable)
    {
      Observer.getAll().forEach(observer => observer.disable());
    } 
    else {
      Observer.getAll().forEach(observer => observer.enable());
    }
  }

  toggleDropdown(className: string, option : string) {
    var dropdown = $('.' + className);
    if (option == 'close') {
      dropdown.removeClass('active');
      dropdown.find('.dropdown-menu').slideUp(300);
    } else {
      dropdown.toggleClass('active');
      dropdown.find('.dropdown-menu').slideToggle(300);
    }
  }

}
