import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Task } from '../models/task.models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  constructor(private http: HttpClient) {}

  async loadTasks(owner: string, token: string): Promise<Task[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const response = await firstValueFrom(
      this.http.get<unknown>(
        `${environment.tasksApiUrl}/api/tasks?owner=${owner}`,
        { headers }
      )
    );

    if (!Array.isArray(response)) {
      throw new Error('No se pudo cargar el dashboard');
    }

    return response as Task[];
  }
}
