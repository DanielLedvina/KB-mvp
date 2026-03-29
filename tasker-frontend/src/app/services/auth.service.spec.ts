import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const mockUser = { id: 1, name: 'Daniel', email: 'daniel@tasker.com', token: 'mock-token' };

const mockHttp = { post: vi.fn() };
const mockRouter = { navigate: vi.fn() };

function setup(storedUser: string | null = null) {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(storedUser);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});

  TestBed.configureTestingModule({
    providers: [
      AuthService,
      { provide: HttpClient, useValue: mockHttp },
      { provide: Router, useValue: mockRouter },
    ],
  });

  return TestBed.inject(AuthService);
}

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  describe('initial state', () => {
    it('should be logged out when localStorage is empty', () => {
      const service = setup(null);
      expect(service.isLoggedIn()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });

    it('should restore session from localStorage', () => {
      const service = setup(JSON.stringify(mockUser));
      expect(service.isLoggedIn()).toBe(true);
      expect(service.currentUser()).toEqual(mockUser);
    });

    it('getToken() should return null when not logged in', () => {
      const service = setup(null);
      expect(service.getToken()).toBeNull();
    });

    it('getToken() should return token when logged in', () => {
      const service = setup(JSON.stringify(mockUser));
      expect(service.getToken()).toBe('mock-token');
    });
  });

  describe('login()', () => {
    it('should set user signals and navigate to dashboard on success', () => {
      mockHttp.post.mockReturnValue(of(mockUser));
      const service = setup(null);

      service.login({ email: 'daniel@tasker.com', password: 'password' });

      expect(service.isLoggedIn()).toBe(true);
      expect(service.currentUser()).toEqual(mockUser);
      expect(localStorage.setItem).toHaveBeenCalledWith('tasker_user', JSON.stringify(mockUser));
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should set loginError on 401', () => {
      mockHttp.post.mockReturnValue(throwError(() => ({ status: 401 })));
      const service = setup(null);

      service.login({ email: 'wrong@email.com', password: 'wrong' });

      expect(service.isLoggedIn()).toBe(false);
      expect(service.loginError()).toBe('Invalid email or password.');
    });

    it('should set generic loginError on non-401 error', () => {
      mockHttp.post.mockReturnValue(throwError(() => ({ status: 500 })));
      const service = setup(null);

      service.login({ email: 'daniel@tasker.com', password: 'password' });

      expect(service.loginError()).toBe('Login failed. Please try again.');
    });

    it('should clear loginError before each login attempt', () => {
      mockHttp.post
        .mockReturnValueOnce(throwError(() => ({ status: 401 })))
        .mockReturnValueOnce(of(mockUser));
      const service = setup(null);

      service.login({ email: 'x', password: 'x' });
      expect(service.loginError()).toBe('Invalid email or password.');

      service.login({ email: 'daniel@tasker.com', password: 'password' });
      expect(service.loginError()).toBeNull();
    });
  });

  describe('logout()', () => {
    it('should clear state and navigate to login', () => {
      const service = setup(JSON.stringify(mockUser));

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('tasker_user');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
