import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { FirebaseService } from '../service/firebase.service';

export const authCheckGuard: CanActivateFn = (route, state) => {

  const firbaseService = inject(FirebaseService);
  if(firbaseService.isAuthenticated)
  {
    return true;
  }
 return true; 
};
