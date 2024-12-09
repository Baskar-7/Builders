import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { networkErrorGuard } from './network-error.guard';

describe('networkErrorGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => networkErrorGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
