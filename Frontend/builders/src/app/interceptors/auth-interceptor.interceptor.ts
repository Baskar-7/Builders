import { HttpInterceptorFn } from '@angular/common/http';
import { LocalStorageService } from '../service/local-storage.service';
import { inject } from '@angular/core';

export const authInterceptorInterceptor: HttpInterceptorFn = (req, next) => {

  const lss = inject(LocalStorageService), accessToken = lss.getItem("jwtToken");  
  const targetOrigin = 'http://localhost:8080/Constructions/';
 
  if(accessToken && req.url.startsWith(targetOrigin))
  {
    const clonedRequest =req.clone({
      headers : req.headers.set('Authorization',`Bearer ${accessToken}`)
    });
    return next(clonedRequest);
  }
  return next(req); 
};
