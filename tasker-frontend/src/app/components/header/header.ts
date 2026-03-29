import { Component, computed, inject } from '@angular/core';
import { Avatar } from '../avatar/avatar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [Avatar],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private auth = inject(AuthService);

  protected isLoggedIn = computed(() => this.auth.isLoggedIn());

  protected logout() {
    this.auth.logout();
  }
}
