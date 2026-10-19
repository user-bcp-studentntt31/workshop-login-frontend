import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Promise<LoginResponse> {
    const request: LoginRequest = {
      username,
      password,
      client: 'angular-workshop'
    };

    return firstValueFrom(
      this.http.post<LoginResponse>(
        `${environment.authApiUrl}/auth/login`,
        request,
        { timeout: 5000 }
      )
    );
  }
}
