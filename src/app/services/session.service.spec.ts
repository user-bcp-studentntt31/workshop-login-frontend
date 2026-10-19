import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from './session.service';
import { MemoryStorage } from '../testing/memory-storage';

describe('SessionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
  });

  it('persists a session with the contractual keys', () => {
    const service = new SessionService();
    const user = { username: 'student', displayName: 'Student' };

    service.saveSession('token-123', user);

    expect(localStorage.getItem('workshop_token')).toBe('token-123');
    expect(JSON.parse(localStorage.getItem('workshop_user') ?? '{}')).toEqual(user);
  });

  it('reads the persisted token only once and reuses the memory value', () => {
    localStorage.setItem('workshop_token', 'token-123');
    const getItem = vi.spyOn(localStorage, 'getItem');
    const service = new SessionService();

    expect(service.getToken()).toBe('token-123');
    expect(service.getToken()).toBe('token-123');
    expect(getItem).toHaveBeenCalledTimes(1);
  });

  it('reads a valid persisted user', () => {
    localStorage.setItem('workshop_user', JSON.stringify({ username: 'student' }));
    const service = new SessionService();

    expect(service.getUser()).toEqual({ username: 'student' });
  });

  it('reports and removes an invalid persisted user', () => {
    localStorage.setItem('workshop_user', '{invalid');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const service = new SessionService();

    expect(service.getUser()).toBeNull();
    expect(localStorage.getItem('workshop_user')).toBeNull();
    expect(consoleError).toHaveBeenCalled();
  });

  it('clears session data without removing preferences', () => {
    localStorage.setItem('workshop_token', 'token-123');
    localStorage.setItem('workshop_user', '{"username":"student"}');
    localStorage.setItem('workshop_preferences', '{"theme":"dark"}');
    const service = new SessionService();

    service.clearSession();

    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
    expect(localStorage.getItem('workshop_token')).toBeNull();
    expect(localStorage.getItem('workshop_user')).toBeNull();
    expect(localStorage.getItem('workshop_preferences')).toBe('{"theme":"dark"}');
  });
});
