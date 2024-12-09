import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() {}

  setItem(key : string, values : any,ttl: number = 1)
  {
    const item = {
      value : JSON.stringify(values),
      expiry : (new Date().getTime()) + ttl * 86400000
    }
    localStorage.setItem(key,JSON.stringify(item));
  }

  getItem(key: string){
    const itemStr = localStorage.getItem(key);  
    if(!itemStr)
      return null

    var item = JSON.parse(itemStr)
    if(item.expiry < new Date().getTime())
    {
      localStorage.removeItem(key);
      return null;
    }

    return item.value && JSON.parse(item.value) ;
  }

  removeItem(key: string): void
  {
    localStorage.removeItem(key)
  }

}
