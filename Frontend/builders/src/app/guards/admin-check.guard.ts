import { CanActivateFn } from '@angular/router';

export const adminCheckGuard: CanActivateFn = (route, state) => {
  return true;
};
