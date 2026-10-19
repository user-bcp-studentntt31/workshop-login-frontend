import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionUser } from '../models/auth.models';
import { Task, VisibleTask } from '../models/task.models';
import { SessionService } from '../services/session.service';
import { TasksService } from '../services/tasks.service';
import { formatTaskLabel } from '../utils/legacy-format';

const STATUS_LABELS: Record<string, string> = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  DONE: 'Completado',
  RESUELTO: 'Resuelto',
  COMPLETED: 'Completado'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  tasks: Task[] = [];
  visibleTasks: VisibleTask[] = [];
  user: SessionUser = { username: '' };
  loading = true;
  error = '';

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private session: SessionService,
    private tasksService: TasksService
  ) {}

  statusLabel(status: string): string {
    return STATUS_LABELS[(status || '').toUpperCase()] || status;
  }

  async ngOnInit(): Promise<void> {
    const token = this.session.getToken();
    this.user = this.session.getUser() ?? { username: '' };
    if (!token) {
      await this.router.navigate(['/login']);
      return;
    }
    try {
      const tasks = await this.tasksService.loadTasks(this.user.username || '', token);
      const visibleTasks: VisibleTask[] = [];
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].status !== 'ARCHIVED') {
          visibleTasks.push({
            ...tasks[i],
            label: formatTaskLabel(tasks[i])
          });
        }
      }
      visibleTasks.sort((a, b) =>
        String(a.priority ?? '') > String(b.priority ?? '') ? -1 : 1
      );
      this.zone.run(() => {
        this.tasks = tasks;
        this.visibleTasks = visibleTasks;
        this.loading = false;
        this.cdr.detectChanges();
      });
    } catch (error: unknown) {
      this.zone.run(() => {
        this.error = this.errorMessage(error);
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }

  async logout(): Promise<void> {
    this.session.clearSession();
    await this.router.navigate(['/login']);
  }

  private errorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const httpError = 'error' in error ? error.error : undefined;
      if (
        httpError &&
        typeof httpError === 'object' &&
        'detail' in httpError &&
        typeof httpError.detail === 'string'
      ) {
        return httpError.detail;
      }

      const response = 'response' in error ? error.response : undefined;
      if (response && typeof response === 'object' && 'data' in response) {
        const data = response.data;
        if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
          return data.detail;
        }
      }

      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
    }

    return 'No se pudo cargar el dashboard';
  }
}
