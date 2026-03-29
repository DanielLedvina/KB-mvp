import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './services/auth.service';

const mockUser = { id: 1, name: 'Daniel', email: 'daniel@tasker.com', token: 'mock-token' };
const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

function runGuard() {
  return TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
}

describe('authGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
  });

  it('should allow access when user is logged in', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockUser));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: { post: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn(), parseUrl: vi.fn(() => '/login') } },
      ],
    });

    const result = runGuard();
    expect(result).toBe(true);
  });

  it('should redirect to /login when user is not logged in', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    const parseUrlSpy = vi.fn(() => '/login');
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: { post: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn(), parseUrl: parseUrlSpy } },
      ],
    });

    const result = runGuard();
    expect(parseUrlSpy).toHaveBeenCalledWith('/login');
    expect(result).toBe('/login');
  });
});
