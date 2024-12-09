import { TestBed } from '@angular/core/testing';

import { AjaxUtilService } from './ajax-util.service';

describe('AjaxUtilService', () => {
  let service: AjaxUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AjaxUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
