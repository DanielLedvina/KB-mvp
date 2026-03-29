import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  protected loginError = computed(() => this.auth.loginError());

  protected login(email: string, password: string) {
    this.auth.login({ email, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
