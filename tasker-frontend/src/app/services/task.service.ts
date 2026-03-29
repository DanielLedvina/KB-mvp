import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../environments/environment';
import { Task, CreateTaskDto, UpdateTaskDto } from '../models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tasks`;

  #tasks = signal<Task[]>([]);
  tasks = this.#tasks.asReadonly();

  loading = signal(false);
  error = signal<string | null>(null);

  loadTasks() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Task[]>(this.apiUrl).pipe(
      tap((data) => {
        this.#tasks.set(data);
        this.loading.set(false);
      }),
      catchError(() => {
        this.error.set('Failed to load tasks. Please try again.');
        this.loading.set(false);
        return EMPTY;
      }),
    ).subscribe();
  }

  createTask(dto: CreateTaskDto) {
    this.error.set(null);
    return this.http.post<Task>(this.apiUrl, dto).pipe(
      tap((task) => this.#tasks.update((tasks) => [...tasks, task])),
      catchError(() => {
        this.error.set('Failed to create task.');
        return EMPTY;
      }),
    );
  }

  updateTask(id: number, dto: UpdateTaskDto) {
    this.error.set(null);
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((updated) =>
        this.#tasks.update((tasks) => tasks.map((t) => (t.id === id ? updated : t))),
      ),
      catchError(() => {
        this.error.set('Failed to update task.');
        return EMPTY;
      }),
    );
  }

  deleteTask(id: number) {
    this.error.set(null);
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.#tasks.update((tasks) => tasks.filter((t) => t.id !== id))),
      catchError(() => {
        this.error.set('Failed to delete task.');
        return EMPTY;
      }),
    );
  }

}
