import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse} from '@angular/common/http';
import { of,Observable,throwError  } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AjaxUtilService {

  constructor(private http: HttpClient,private router: Router,private lss : LocalStorageService) {    
   }

  ajax(url: string, params: any): Observable<any> 
  {
    if (navigator.onLine) 
    {   
      return this.http.post('http://localhost:8080/Constructions/'+url, params, { 
        withCredentials: true
      }).pipe(
        map((json: any) => {
          return json;
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 403 || error.status === 404) {
            this.router.navigate(['/undefined-url']);
          }
          const errorResponse = {
            status: 'error',
            message: 'Failed to load data!',
          };
          return throwError(() => errorResponse);
        })
      )
    }
    else{
      this.router.navigate(['/networkError']);
      return of(null);
    }
  }

  async getLocations() {

    // Retrieve the object from localStorage
    var locations = this.lss.getItem('locations'); 
    if (locations)
      return locations;
    
    var cities : any = [];
    this.http.get("https://censusindia.gov.in/nada/index.php/api/tables/data/2011/geo_codes/?level=district&fields=district,areaname&limit=640").subscribe((jsonData: any)=>{
       var {data} = jsonData
       data = data.sort((a:any, b:any) => a.areaname.localeCompare(b.areaname));

       data.map((location: any) => {
         cities.push( {
            id: location.district,
            district: location.areaname,
          })
        });
      this.lss.setItem("locations",cities);
      return cities
    }); 
  }

  getLocationWithPincode(pincode: string): Observable<any>
  {
    return this.http.get("https://api.postalpincode.in/pincode/"+pincode);
  }

  createFormAndSubmitFile(url:string,file: any,data: any)
  {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', data);

    return this.ajax(url,formData);
  }

  updateNewProject(data: any): Observable<any>
  {
    const formData = new FormData();

    var params = { 
      "project_name" : data.project_name,
      "landmark" : data.landmark,
      "address" : data.address,
      "project_type" : data.project_type,
      "pincode" : data.pincode.toString(),
      "city" : data.city,
      "state" : data.state,
      "status" : data.status,
      "total_floors" : data.total_floors,
      "total_units" : data.total_units,
      "total_blocks" : data.total_blocks,
      "latitude" : data.latitude.toString(),
      "longitude" : data.longitude.toString(),
      "min_price" :data.min_price,
      "max_price" : data.max_price,
      "min_area" :data.min_area,
      "max_area" :data.max_area
  } 
  
   formData.append("data",JSON.stringify(params));
   formData.append("elevation_poster", data.project_poster);

    const amenities = data.amenities.map((amenity: any)=>{
      return amenity.id;
    })
    formData.append("amenities", JSON.stringify(amenities));

    const config_details = data.configurations.map((config: any)=>{
      return config.originalData;
    })
    formData.append("configurations", JSON.stringify(config_details));

    data.bluePrints.forEach((blueprint: any, blueprintIndex: number) => {
      formData.append(`bluePrints[${blueprintIndex}][categoryType]`, blueprint.id);
      
      blueprint.images.forEach((file: File, fileIndex: number) => {
        formData.append(`bluePrints[${blueprintIndex}][images][${fileIndex}]`, file, file.name);
      });
    });

    data.gallery.forEach((galleryItem : any, galleryIndex: number) => {
      formData.append(`gallery[${galleryIndex}][categoryType]`, galleryItem.id);

      galleryItem.images.forEach((file: File, fileIndex: number) => { 
        formData.append(`gallery[${galleryIndex}][images][${fileIndex}]`, file, file.name);
      });
    });

     return this.http.post('http://localhost:8080/Constructions/api/json/action/addNewProject', formData) 
  }


  async getCurrentLocation() : Promise<string >
  {
    var self = this;
    return new Promise(function (resolve) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const apiUrl = `https://api.opencagedata.com/geocode/v1/json?key=58ed6cadbfe8447699c188908a1d119b&q=${position.coords.latitude}+${position.coords.longitude}&pretty=1`;
            self.http.get(apiUrl).subscribe((data: any) => {
              var location =(data.results[0]?.components.state_district.split(' '))[0] ||data.results[0]?.components.town;
              resolve(location)
            });
          },
          (error) => {
            console.error('Error getting location:', error.message);
          }
        );
      }

    })
    
  }

}




