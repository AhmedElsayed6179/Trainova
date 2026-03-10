import { TestBed } from '@angular/core/testing';

import { ReCaptchaV3Service } from './re-captcha-v3-service';

describe('ReCaptchaV3Service', () => {
  let service: ReCaptchaV3Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReCaptchaV3Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
