import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('application routes', () => {
  it('declares login, dashboard and fallback navigation', () => {
    expect(routes.map((route) => route.path)).toEqual([
      'login',
      'dashboard',
      '',
      '**'
    ]);
    expect(routes[2]).toMatchObject({
      redirectTo: 'login',
      pathMatch: 'full'
    });
    expect(routes[3]).toMatchObject({
      redirectTo: 'login'
    });
  });
});
