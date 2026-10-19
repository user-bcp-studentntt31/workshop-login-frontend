import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Preferences } from '../models/preferences.models';
import { AuthService } from '../services/auth.service';
import { PreferencesService } from '../services/preferences.service';
import { SessionService } from '../services/session.service';

const USER_REQUIRED_MESSAGE = 'Ingrese un usuario.';
const PASSWORD_REQUIRED_MESSAGE = 'Ingrese una contraseña.';
const AUTHENTICATION_ERROR_MESSAGE = 'No se pudo completar la autenticación.';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  busy = false;
  message = '';
  preferences: Preferences = { theme: 'light', showTips: true, compact: false };

  constructor(
    private router: Router,
    private session: SessionService,
    private auth: AuthService,
    private preferencesService: PreferencesService
  ) {
    this.preferences = this.preferencesService.load();
  }

  async login(): Promise<void> {
    this.message = '';

    if (!this.username.trim()) {
      this.message = USER_REQUIRED_MESSAGE;
      return;
    }

    if (!this.password.trim()) {
      this.message = PASSWORD_REQUIRED_MESSAGE;
      return;
    }

    this.busy = true;
    try {
      const response = await this.auth.login(this.username, this.password);
      if (!response.token) {
        this.message = AUTHENTICATION_ERROR_MESSAGE;
        return;
      }

      this.session.saveSession(response.token, response.user);
      this.preferencesService.save(this.preferences);
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.message = AUTHENTICATION_ERROR_MESSAGE;
      console.error('Authentication request failed', error);
    } finally {
      this.busy = false;
    }
  }
}
