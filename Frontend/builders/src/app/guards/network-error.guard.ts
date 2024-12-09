import { CanActivateFn, Router} from '@angular/router';
import { inject } from '@angular/core';

export const networkErrorGuard: CanActivateFn = (route, state) => {

  const isOnline = navigator.onLine, router = inject(Router)

  if(isOnline)
  {
    router.navigate(["home"]);
  }
  return true;
};
