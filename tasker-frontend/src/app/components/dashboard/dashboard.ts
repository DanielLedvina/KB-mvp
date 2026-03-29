import { Component, inject, computed, signal, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskColumn } from '../task-column/task-column';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskColumn],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private taskService = inject(TaskService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  protected currentUser = computed(() => this.auth.currentUser());
  protected todoTasks = computed(() => this.taskService.tasks().filter((t) => !t.completed));
  protected doneTasks = computed(() => this.taskService.tasks().filter((t) => t.completed));
  protected taskError = computed(() => this.taskService.error());
  protected taskLoading = computed(() => this.taskService.loading());

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  });

  // Modal state
  protected showModal = signal(false);
  protected editingTask = signal<Task | null>(null);

  // Form fields
  protected formTitle = signal('');
  protected formTag = signal('DEFAULT');
  protected formDescription = signal('');

  // Async UI state
  protected saving = signal(false);

  // Drag & drop state
  private draggedTask = signal<Task | null>(null);

  ngOnInit() {
    this.taskService.loadTasks();
  }

  protected retryLoad() {
    this.taskService.loadTasks();
  }

  openAddModal() {
    this.editingTask.set(null);
    this.formTitle.set('');
    this.formTag.set('DEFAULT');
    this.formDescription.set('');
    this.showModal.set(true);
  }

  openEditModal(task: Task) {
    this.editingTask.set(task);
    this.formTitle.set(task.title);
    this.formTag.set(task.tag);
    this.formDescription.set(task.description || '');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveTask() {
    const title = this.formTitle().trim();
    if (!title) return;

    this.saving.set(true);
    const editing = this.editingTask();
    const request$ = editing
      ? this.taskService.updateTask(editing.id, {
          title,
          tag: this.formTag(),
          description: this.formDescription(),
        })
      : this.taskService.createTask({
          title,
          tag: this.formTag(),
          description: this.formDescription(),
        });

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      complete: () => {
        this.saving.set(false);
        if (!this.taskService.error()) this.closeModal();
      },
    });
  }

  toggleComplete(task: Task) {
    this.taskService.updateTask(task.id, { completed: !task.completed })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  deleteTask(task: Task) {
    this.taskService.deleteTask(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  // Drag & drop
  onDragStart(task: Task) {
    this.draggedTask.set(task);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDropTodo(_event: DragEvent) {
    const task = this.draggedTask();
    if (task?.completed) {
      this.taskService.updateTask(task.id, { completed: false })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
    this.draggedTask.set(null);
  }

  onDropDone(_event: DragEvent) {
    const task = this.draggedTask();
    if (task && !task.completed) {
      this.taskService.updateTask(task.id, { completed: true })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
    this.draggedTask.set(null);
  }
}
