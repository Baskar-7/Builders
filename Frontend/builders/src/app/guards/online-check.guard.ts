import { inject } from '@angular/core';
import { CanActivateFn , Router} from '@angular/router';

export const onlineCheckGuard: CanActivateFn = (route, state) => {

  const isOnline = navigator.onLine, router = inject(Router)

  if(!isOnline)
  {
    router.navigate(["network-error"]);
    return false;
  }

  return true;
};
