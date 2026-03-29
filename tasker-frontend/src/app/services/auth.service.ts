import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models';

const STORAGE_KEY = 'tasker_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  private storedUser = localStorage.getItem(STORAGE_KEY);

  currentUser = signal<User | null>(this.storedUser ? JSON.parse(this.storedUser) : null);
  isLoggedIn = computed(() => this.currentUser() !== null);
  loginError = signal<string | null>(null);

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  login(credentials: { email: string; password: string }) {
    this.loginError.set(null);
    return this.http.post<User>(`${this.apiUrl}/login`, credentials).pipe(
      tap((user) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        this.currentUser.set(user);
        this.router.navigate(['/dashboard']);
      }),
      catchError((err) => {
        this.loginError.set(
          err.status === 401 ? 'Invalid email or password.' : 'Login failed. Please try again.'
        );
        return EMPTY;
      }),
    );
  }

  logout() {
    localStorage.removeItem(STORAGE_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
