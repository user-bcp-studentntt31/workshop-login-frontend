import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from '../testing/memory-storage';
import { PreferencesService } from './preferences.service';

describe('PreferencesService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
  });

  it('returns defaults without stored preferences', () => {
    expect(new PreferencesService().load()).toEqual({
      theme: 'light',
      showTips: true,
      compact: false
    });
  });

  it('merges known stored values with defaults', () => {
    localStorage.setItem(
      'workshop_preferences',
      JSON.stringify({ theme: 'dark', compact: true })
    );

    expect(new PreferencesService().load()).toEqual({
      theme: 'dark',
      showTips: true,
      compact: true
    });
  });

  it('returns defaults and reports invalid JSON', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    localStorage.setItem('workshop_preferences', '{invalid');

    expect(new PreferencesService().load()).toEqual({
      theme: 'light',
      showTips: true,
      compact: false
    });
    expect(consoleError).toHaveBeenCalled();
  });

  it('saves preferences with the contractual key', () => {
    const preferences = { theme: 'dark', showTips: false, compact: true };

    new PreferencesService().save(preferences);

    expect(JSON.parse(localStorage.getItem('workshop_preferences') ?? '{}')).toEqual(
      preferences
    );
  });
});
