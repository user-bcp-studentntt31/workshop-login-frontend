import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { AuthService } from './services/auth.service';
import { PreferencesService } from './services/preferences.service';
import { SessionService } from './services/session.service';
import { TasksService } from './services/tasks.service';
import { MemoryStorage } from './testing/memory-storage';

describe('Authentication flow', () => {
  const navigate = vi.fn();
  const detectChanges = vi.fn();
  const zone = {
    run: <T>(callback: () => T): T => callback()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
  });

  it('logs in with valid credentials and loads the user tasks', async () => {
    const loginRequest = vi.fn().mockResolvedValue({
      token: 'token-123',
      user: { username: 'student', displayName: 'Student' }
    });
    const loadTasks = vi.fn().mockResolvedValue([
        {
          title: 'Prepare workshop',
          description: 'Review the requirements',
          status: 'TODO',
          priority: 'high',
          owner: 'student'
        }
      ]);
    const login = new LoginComponent(
      { navigate } as never,
      new SessionService(),
      { login: loginRequest } as unknown as AuthService,
      new PreferencesService()
    );
    login.username = 'student';
    login.password = 'Workshop123!';

    await login.login();

    expect(navigate).toHaveBeenCalledWith(['/dashboard']);

    const dashboard = new DashboardComponent(
      { navigate } as never,
      { detectChanges } as never,
      zone as never,
      new SessionService(),
      { loadTasks } as unknown as TasksService
    );

    await dashboard.ngOnInit();

    expect(loadTasks).toHaveBeenCalledWith('student', 'token-123');
    expect(dashboard.visibleTasks).toHaveLength(1);
    expect(dashboard.visibleTasks[0]).toMatchObject({
      title: 'Prepare workshop',
      label: 'HIGH · STUDENT'
    });
    expect(dashboard.loading).toBe(false);
    expect(dashboard.error).toBe('');
  });
});
