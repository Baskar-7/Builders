import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { FirebaseService } from '../service/firebase.service';

export const authCheckGuard: CanActivateFn = (route, state) => {

  const firbaseService = inject(FirebaseService); 
  const router = inject(Router);

  if (firbaseService.isAuthenticated) { 
    return true;
  } else { 
    router.navigate(['/']);  
    return false;
  }
};
