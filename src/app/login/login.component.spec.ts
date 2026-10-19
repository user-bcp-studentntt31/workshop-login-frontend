import '@angular/compiler';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { PreferencesService } from '../services/preferences.service';
import { SessionService } from '../services/session.service';
import { MemoryStorage } from '../testing/memory-storage';

describe('LoginComponent characterization', () => {
  const navigate = vi.fn();
  const login = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
  });

  function createComponent(): LoginComponent {
    return new LoginComponent(
      { navigate } as never,
      new SessionService(),
      { login } as unknown as AuthService,
      new PreferencesService()
    );
  }

  it('merges stored preferences with the defaults', () => {
    localStorage.setItem(
      'workshop_preferences',
      JSON.stringify({ theme: 'dark', compact: true })
    );

    const component = createComponent();

    expect(component.preferences).toEqual({
      theme: 'dark',
      showTips: true,
      compact: true
    });
  });

  it('keeps default preferences when stored JSON is invalid', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    localStorage.setItem('workshop_preferences', '{invalid');

    const component = createComponent();

    expect(component.preferences).toEqual({
      theme: 'light',
      showTips: true,
      compact: false
    });
    expect(consoleError).toHaveBeenCalled();
  });

  it('stores the session and preferences, then navigates after a successful login', async () => {
    login.mockResolvedValue({
      token: 'token-123',
      user: { username: 'student', displayName: 'Student' }
    });
    const component = createComponent();
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(login).toHaveBeenCalledWith('student', 'Workshop123!');
    expect(localStorage.getItem('workshop_token')).toBe('token-123');
    expect(JSON.parse(localStorage.getItem('workshop_user') ?? '{}')).toEqual({
      username: 'student',
      displayName: 'Student'
    });
    expect(JSON.parse(localStorage.getItem('workshop_preferences') ?? '{}')).toEqual({
      theme: 'light',
      showTips: true,
      compact: false
    });
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('does not authenticate when the username is empty', async () => {
    const component = createComponent();
    component.username = ' ';
    component.password = 'Workshop123!';

    await component.login();

    expect(login).not.toHaveBeenCalled();
    expect(component.message).toContain('Ingrese un usuario');
    expect(component.busy).toBe(false);
  });

  it('does not authenticate when the password is empty', async () => {
    const component = createComponent();
    component.username = 'student';
    component.password = ' ';

    await component.login();

    expect(login).not.toHaveBeenCalled();
    expect(component.message).toContain('Ingrese una contraseña');
  });

  it('does not create a session or navigate when the response has no token', async () => {
    login.mockResolvedValue({ user: { username: 'student' } });
    const component = createComponent();
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(localStorage.getItem('workshop_token')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.message).toBe('No se pudo completar la autenticación.');
    expect(component.busy).toBe(false);
  });

  it('shows a stable public message without backend details or user content', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    login.mockRejectedValue({
      response: { data: { message: '<img src=x onerror=alert(1)>' } }
    });
    const component = createComponent();
    component.username = '<strong>student</strong>';
    component.password = 'Workshop123!';

    await component.login();

    expect(component.message).toBe('No se pudo completar la autenticación.');
    expect(component.message).not.toContain(component.username);
    expect(component.message).not.toContain('<');
    expect(consoleError).toHaveBeenCalled();
    expect(component.busy).toBe(false);
  });

  it('handles an unavailable authentication backend without creating a session', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    login.mockRejectedValue({
      code: 'ECONNREFUSED',
      message: 'Network Error'
    });
    const component = createComponent();
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(component.message).toBe('No se pudo completar la autenticación.');
    expect(component.busy).toBe(false);
    expect(localStorage.getItem('workshop_token')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });

  it('handles an authentication timeout and restores the form state', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    login.mockRejectedValue({
      code: 'ECONNABORTED',
      message: 'timeout of 5000ms exceeded'
    });
    const component = createComponent();
    component.username = 'student';
    component.password = 'Workshop123!';

    await component.login();

    expect(login).toHaveBeenCalledWith('student', 'Workshop123!');
    expect(component.message).toBe('No se pudo completar la autenticación.');
    expect(component.busy).toBe(false);
    expect(localStorage.getItem('workshop_token')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });

  it('renders messages through text interpolation instead of innerHTML', () => {
    const template = readFileSync(
      new URL('./login.component.html', import.meta.url),
      'utf8'
    );

    expect(template).not.toContain('[innerHTML]');
    expect(template).toContain('{{ message }}');
  });
});
