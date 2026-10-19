import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { SessionService } from '../services/session.service';
import { TasksService } from '../services/tasks.service';
import { MemoryStorage } from '../testing/memory-storage';

describe('DashboardComponent characterization', () => {
  const navigate = vi.fn();
  const detectChanges = vi.fn();
  const loadTasks = vi.fn();
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

  function createComponent(): DashboardComponent {
    return new DashboardComponent(
      { navigate } as never,
      { detectChanges } as never,
      zone as never,
      new SessionService(),
      { loadTasks } as unknown as TasksService
    );
  }

  it('redirects to login without requesting tasks when there is no token', async () => {
    const component = createComponent();

    await component.ngOnInit();

    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(loadTasks).not.toHaveBeenCalled();
  });

  it('requests the owner tasks using the bearer token from the session', async () => {
    localStorage.setItem('workshop_token', 'token-123');
    localStorage.setItem('workshop_user', JSON.stringify({ username: 'student' }));
    loadTasks.mockResolvedValue([]);
    const component = createComponent();

    await component.ngOnInit();

    expect(loadTasks).toHaveBeenCalledWith('student', 'token-123');
    expect(component.loading).toBe(false);
  });

  it('requests tasks with an empty owner when the stored user has no username', async () => {
    localStorage.setItem('workshop_token', 'token-123');
    localStorage.setItem('workshop_user', JSON.stringify({}));
    loadTasks.mockResolvedValue([]);
    const component = createComponent();

    await component.ngOnInit();

    expect(loadTasks).toHaveBeenCalledWith('', 'token-123');
  });

  it('filters archived tasks, labels visible tasks and sorts them by priority', async () => {
    localStorage.setItem('workshop_token', 'token-123');
    localStorage.setItem('workshop_user', JSON.stringify({ username: 'student' }));
    loadTasks.mockResolvedValue([
        { title: 'Low', status: 'TODO', priority: 'low', owner: 'student' },
        { title: 'Archived', status: 'ARCHIVED', priority: 'high', owner: 'student' },
        { title: 'High', status: 'DONE', priority: 'high', owner: 'student' }
      ]);
    const component = createComponent();

    await component.ngOnInit();

    expect(component.tasks).toHaveLength(3);
    expect(component.visibleTasks.map((task) => task.title)).toEqual(['Low', 'High']);
    expect(component.visibleTasks.map((task) => task.label)).toEqual([
      'LOW · STUDENT',
      'HIGH · STUDENT'
    ]);
    expect(detectChanges).toHaveBeenCalled();
  });

  it('exposes a task loading error and finishes loading', async () => {
    localStorage.setItem('workshop_token', 'token-123');
    localStorage.setItem('workshop_user', JSON.stringify({ username: 'student' }));
    loadTasks.mockRejectedValue({
      error: { detail: 'Tasks unavailable' }
    });
    const component = createComponent();

    await component.ngOnInit();

    expect(component.error).toBe('Tasks unavailable');
    expect(component.loading).toBe(false);
    expect(detectChanges).toHaveBeenCalled();
  });

  it('keeps the user on the dashboard and shows the detail for an invalid token', async () => {
    localStorage.setItem('workshop_token', 'expired-token');
    localStorage.setItem('workshop_user', JSON.stringify({ username: 'student' }));
    loadTasks.mockRejectedValue({
      status: 401,
      error: { detail: 'Token inválido' }
    });
    const component = createComponent();

    await component.ngOnInit();

    expect(component.error).toBe('Token inválido');
    expect(component.loading).toBe(false);
    expect(localStorage.getItem('workshop_token')).toBe('expired-token');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('uses the available network error message when task loading fails', async () => {
    localStorage.setItem('workshop_token', 'token-123');
    localStorage.setItem('workshop_user', JSON.stringify({ username: 'student' }));
    loadTasks.mockRejectedValue(new Error('Network unavailable'));
    const component = createComponent();

    await component.ngOnInit();

    expect(component.error).toBe('Network unavailable');
    expect(component.loading).toBe(false);
  });

  it('uses the fallback message when a task error has no detail or message', async () => {
    localStorage.setItem('workshop_token', 'token-123');
    localStorage.setItem('workshop_user', JSON.stringify({ username: 'student' }));
    loadTasks.mockRejectedValue({});
    const component = createComponent();

    await component.ngOnInit();

    expect(component.error).toBe('No se pudo cargar el dashboard');
    expect(component.loading).toBe(false);
  });

  it('treats a null task response as an error and finishes loading', async () => {
    localStorage.setItem('workshop_token', 'token-123');
    localStorage.setItem('workshop_user', JSON.stringify({ username: 'student' }));
    loadTasks.mockRejectedValue(new Error('No se pudo cargar el dashboard'));
    const component = createComponent();

    await component.ngOnInit();

    expect(component.error).toBe('No se pudo cargar el dashboard');
    expect(component.loading).toBe(false);
    expect(component.visibleTasks).toEqual([]);
  });

  it('reports an unexpected object response as an error', async () => {
    localStorage.setItem('workshop_token', 'token-123');
    localStorage.setItem('workshop_user', JSON.stringify({ username: 'student' }));
    loadTasks.mockRejectedValue(new Error('No se pudo cargar el dashboard'));
    const component = createComponent();

    await component.ngOnInit();

    expect(component.tasks).toEqual([]);
    expect(component.visibleTasks).toEqual([]);
    expect(component.error).toBe('No se pudo cargar el dashboard');
    expect(component.loading).toBe(false);
  });

  it('shows an empty collection when every task is archived', async () => {
    localStorage.setItem('workshop_token', 'token-123');
    localStorage.setItem('workshop_user', JSON.stringify({ username: 'student' }));
    loadTasks.mockResolvedValue([
        {
          title: 'Archived',
          status: 'ARCHIVED',
          priority: 'high',
          owner: 'student'
        }
      ]);
    const component = createComponent();

    await component.ngOnInit();

    expect(component.tasks).toHaveLength(1);
    expect(component.visibleTasks).toEqual([]);
    expect(component.error).toBe('');
    expect(component.loading).toBe(false);
  });

  it('translates known statuses and preserves unknown statuses', () => {
    const component = createComponent();

    expect(component.statusLabel('in_progress')).toBe('En progreso');
    expect(component.statusLabel('BLOCKED')).toBe('BLOCKED');
    expect(component.statusLabel('')).toBe('');
  });

  it('removes session data, preserves preferences and navigates on logout', async () => {
    localStorage.setItem('workshop_token', 'token-123');
    localStorage.setItem('workshop_user', JSON.stringify({ username: 'student' }));
    localStorage.setItem('workshop_preferences', JSON.stringify({ theme: 'dark' }));
    const component = createComponent();

    await component.logout();

    expect(localStorage.getItem('workshop_token')).toBeNull();
    expect(localStorage.getItem('workshop_user')).toBeNull();
    expect(localStorage.getItem('workshop_preferences')).toBe('{"theme":"dark"}');
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
