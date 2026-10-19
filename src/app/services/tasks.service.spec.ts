import '@angular/compiler';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  it('gets owner tasks with the bearer token', async () => {
    const get = vi.fn().mockReturnValue(of([]));
    const service = new TasksService({ get } as unknown as HttpClient);

    await expect(service.loadTasks('student', 'token-123')).resolves.toEqual([]);
    expect(get).toHaveBeenCalledOnce();
    const [url, options] = get.mock.calls[0];
    expect(url).toBe('http://localhost:8000/api/tasks?owner=student');
    expect(options.headers).toBeInstanceOf(HttpHeaders);
    expect(options.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('rejects a response that is not an array', async () => {
    const get = vi.fn().mockReturnValue(of({ title: 'Not an array' }));
    const service = new TasksService({ get } as unknown as HttpClient);

    await expect(service.loadTasks('student', 'token-123')).rejects.toThrow(
      'No se pudo cargar el dashboard'
    );
  });
});
