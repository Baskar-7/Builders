import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { adminCheckGuard } from './admin-check.guard';

describe('adminCheckGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => adminCheckGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
