import { Injectable } from '@angular/core';
import { DEFAULT_PREFERENCES, Preferences } from '../models/preferences.models';

const PREFERENCES_KEY = 'workshop_preferences';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  load(): Preferences {
    const storedPreferences = localStorage.getItem(PREFERENCES_KEY);
    if (!storedPreferences) {
      return { ...DEFAULT_PREFERENCES };
    }

    try {
      const parsed = JSON.parse(storedPreferences) as Partial<Preferences>;
      return {
        theme: typeof parsed.theme === 'string' ? parsed.theme : DEFAULT_PREFERENCES.theme,
        showTips: typeof parsed.showTips === 'boolean'
          ? parsed.showTips
          : DEFAULT_PREFERENCES.showTips,
        compact: typeof parsed.compact === 'boolean'
          ? parsed.compact
          : DEFAULT_PREFERENCES.compact
      };
    } catch (error) {
      console.error('Preferences could not be loaded', error);
      return { ...DEFAULT_PREFERENCES };
    }
  }

  save(preferences: Preferences): void {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }
}
