import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { GuestGuard } from './guest-guard';

describe('guestGuardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
      TestBed.runInInjectionContext(() => GuestGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
