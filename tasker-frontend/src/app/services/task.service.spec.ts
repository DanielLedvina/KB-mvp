import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TaskService } from './task.service';
import { Task } from '../models';

const mockTasks: Task[] = [
  { id: 1, title: 'Buy groceries', tag: 'PERSONAL', description: '', completed: false },
  { id: 2, title: 'Fix bug', tag: 'WORK', description: 'critical', completed: true },
];

const mockHttp = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };

function setup() {
  mockHttp.get.mockReturnValue(of(mockTasks));

  TestBed.configureTestingModule({
    providers: [
      TaskService,
      { provide: HttpClient, useValue: mockHttp },
    ],
  });

  const service = TestBed.inject(TaskService);
  service.loadTasks();
  return service;
}

describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  describe('loadTasks()', () => {
    it('should load tasks into signal', () => {
      const service = setup();
      expect(service.tasks()).toEqual(mockTasks);
    });

    it('should set loading to false after success', () => {
      const service = setup();
      expect(service.loading()).toBe(false);
    });

    it('should set error message on failure', () => {
      mockHttp.get.mockReturnValue(throwError(() => new Error('Network error')));
      TestBed.configureTestingModule({
        providers: [TaskService, { provide: HttpClient, useValue: mockHttp }],
      });
      const service = TestBed.inject(TaskService);
      service.loadTasks();
      expect(service.error()).toBe('Failed to load tasks. Please try again.');
      expect(service.tasks()).toEqual([]);
    });
  });

  describe('createTask()', () => {
    it('should append new task to signal', () => {
      const service = setup();
      const newTask: Task = { id: 3, title: 'New task', tag: 'DEFAULT', description: '', completed: false };
      mockHttp.post.mockReturnValue(of(newTask));

      service.createTask({ title: 'New task', tag: 'DEFAULT' }).subscribe();

      expect(service.tasks()).toHaveLength(3);
      expect(service.tasks()).toContainEqual(newTask);
    });

    it('should set error on failure', () => {
      const service = setup();
      mockHttp.post.mockReturnValue(throwError(() => new Error()));

      service.createTask({ title: 'Fail', tag: 'DEFAULT' }).subscribe();

      expect(service.error()).toBe('Failed to create task.');
    });
  });

  describe('updateTask()', () => {
    it('should replace updated task in signal', () => {
      const service = setup();
      const updated: Task = { ...mockTasks[0], title: 'Updated title' };
      mockHttp.patch.mockReturnValue(of(updated));

      service.updateTask(1, { title: 'Updated title' }).subscribe();

      expect(service.tasks().find((t) => t.id === 1)?.title).toBe('Updated title');
    });

    it('should toggle completed status', () => {
      const service = setup();
      const toggled: Task = { ...mockTasks[0], completed: true };
      mockHttp.patch.mockReturnValue(of(toggled));

      service.updateTask(1, { completed: true }).subscribe();

      expect(service.tasks().find((t) => t.id === 1)?.completed).toBe(true);
    });

    it('should set error on failure', () => {
      const service = setup();
      mockHttp.patch.mockReturnValue(throwError(() => new Error()));

      service.updateTask(1, { title: 'x' }).subscribe();

      expect(service.error()).toBe('Failed to update task.');
    });
  });

  describe('deleteTask()', () => {
    it('should remove task from signal', () => {
      const service = setup();
      mockHttp.delete.mockReturnValue(of({}));

      service.deleteTask(1).subscribe();

      expect(service.tasks()).toHaveLength(1);
      expect(service.tasks().find((t) => t.id === 1)).toBeUndefined();
    });

    it('should set error on failure', () => {
      const service = setup();
      mockHttp.delete.mockReturnValue(throwError(() => new Error()));

      service.deleteTask(1).subscribe();

      expect(service.error()).toBe('Failed to delete task.');
    });
  });
});
