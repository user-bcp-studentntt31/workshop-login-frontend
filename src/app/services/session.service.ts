import { Injectable } from '@angular/core';
import { SessionUser } from '../models/auth.models';

const TOKEN_KEY = 'workshop_token';
const USER_KEY = 'workshop_user';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private cachedToken: string | null | undefined;
  private cachedUser: SessionUser | null | undefined;

  saveSession(token: string, user: SessionUser): void {
    this.cachedToken = token;
    this.cachedUser = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getToken(): string | null {
    if (this.cachedToken === undefined) {
      this.cachedToken = localStorage.getItem(TOKEN_KEY);
    }

    return this.cachedToken;
  }

  getUser(): SessionUser | null {
    if (this.cachedUser !== undefined) {
      return this.cachedUser;
    }

    const storedUser = localStorage.getItem(USER_KEY);
    if (!storedUser) {
      this.cachedUser = null;
      return null;
    }

    try {
      this.cachedUser = JSON.parse(storedUser) as SessionUser;
      return this.cachedUser;
    } catch (error) {
      console.error('Stored session user could not be parsed', error);
      localStorage.removeItem(USER_KEY);
      this.cachedUser = null;
      return null;
    }
  }

  clearSession(): void {
    this.cachedToken = null;
    this.cachedUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
