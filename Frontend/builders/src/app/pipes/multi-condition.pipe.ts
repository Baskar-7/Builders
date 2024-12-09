import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'multiCondition',
  standalone: true
})
export class MultiConditionPipe implements PipeTransform {

  transform(funcName: unknown, params: any): any 
  {
    if(funcName === "getObjectValue") { 
      if (params[0] != undefined && params[1] != undefined) 
        return params[0][params[1]];
    } else if(funcName === "isEmptyObject") {
      if(params[0] != undefined) console.log(Object.keys(params[0] || {}).length === 0)
        return Object.keys(params[0] || {}).length === 0;
    } else if(funcName === "formatCurrency"){
      const rupee = Math.floor(params[1]);
      let paise = Math.ceil((params[1] * 100) % 100) .toString();
      if (paise.length === 1) 
        paise = '0' + paise;
      return `${'₹'}${rupee}.${paise}`;
    } else if (funcName === "converTimeFormat"){
      const [hours, minutes] = params[0].split(':').map(Number);
      const suffix = hours >= 12 ? 'PM' : 'AM';
      const adjustedHours = hours % 12 || 12;  
      return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${suffix}`;
    } else if(funcName === "priceRange"){
      var value = params[0]
      if (value >= 10000000) {
        return  (value / 10000000).toFixed(1) + ' Cr';
      } else if (value >= 100000) {
        return  (value / 100000).toFixed(1) + ' L';
      } else if (value >= 1000) {
        return  (value / 1000).toFixed(1) + ' Th';
      }
      return value ;
    } else if(funcName === "customNumberFormat"){
       var value = params[0]
      if (typeof value === 'number') {
        return value.toLocaleString('en-US');
      } else if (typeof value === 'string' && !isNaN(Number(value))) {
        return Number(value).toLocaleString('en-US');
      } else {
        return value.toString();  // If not a valid number, return as-is
      }
    } else if(funcName === "createObjectURL"){
      var blob = params[0];
        if (typeof params[0] === "string") {
           return 'data:image/png;base64,'+blob;
        }
        return URL.createObjectURL(blob);
    } else if(funcName === "price"){
      var value = params[0]
      if (value >= 10000000) {
        return  (value / 10000000).toFixed(1) + ' Crores';
      } else if (value >= 100000) {
        return  (value / 100000).toFixed(1) + ' Lakhs';
      } else if (value >= 1000) {
        return  (value / 1000).toFixed(1) + ' Thousand';
      }
      return value ;
    }else if (funcName === 'formatString') {
      if (typeof params[0] !== 'string') return params[0];
      return params[0].charAt(0).toUpperCase() + params[0].slice(1);
    }
    else if(funcName === 'removespaces'){
      return params[0].trim().replace(/\s+/g,'');
    } 
    else if (funcName === "convertTo12hrs")
    {
      var timeParts = params[0].split(":"),hrs = parseInt(timeParts[0]),
       hrs = hrs > 12 ? hrs - 12 : hrs,timeNote = hrs > 12 ? 'PM' : 'AM'; 
      return `${hrs}:${timeParts[1]} ${timeNote}`
    }
     
    return null;
  }

}
