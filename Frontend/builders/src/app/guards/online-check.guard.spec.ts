import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { onlineCheckGuard } from './online-check.guard';

describe('onlineCheckGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => onlineCheckGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
