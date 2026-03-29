import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, EMPTY } from 'rxjs';
import { Dashboard } from './dashboard';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models';
import { AuthService } from '../../services/auth.service';

const mockTasks: Task[] = [
  { id: 1, title: 'Todo task', tag: 'WORK', description: '', completed: false },
  { id: 2, title: 'Done task', tag: 'WORK', description: '', completed: true },
];

const mockUser = { id: 1, name: 'Daniel', email: 'daniel@tasker.com', token: 'mock-token' };

function setup() {
  const httpMock = {
    get: vi.fn(() => of(mockTasks)),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockUser));
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});

  TestBed.configureTestingModule({
    imports: [Dashboard],
    providers: [
      TaskService,
      AuthService,
      { provide: HttpClient, useValue: httpMock },
      { provide: Router, useValue: { navigate: vi.fn(), parseUrl: vi.fn() } },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });

  const fixture = TestBed.createComponent(Dashboard);
  fixture.detectChanges();
  const component = fixture.componentInstance as any;
  return { fixture, component };
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  describe('computed signals', () => {
    it('should split tasks into todo and done', () => {
      const { component } = setup();
      expect(component.todoTasks()).toHaveLength(1);
      expect(component.todoTasks()[0].title).toBe('Todo task');
      expect(component.doneTasks()).toHaveLength(1);
      expect(component.doneTasks()[0].title).toBe('Done task');
    });

    it('should show current user from AuthService', () => {
      const { component } = setup();
      expect(component.currentUser()?.name).toBe('Daniel');
    });

    it('should return a valid greeting string', () => {
      const { component } = setup();
      expect(['Good Morning', 'Good Afternoon', 'Good Evening']).toContain(component.greeting());
    });
  });

  describe('modal', () => {
    it('should open add modal with empty fields', () => {
      const { component } = setup();
      component.openAddModal();
      expect(component.showModal()).toBe(true);
      expect(component.editingTask()).toBeNull();
      expect(component.formTitle()).toBe('');
      expect(component.formTag()).toBe('DEFAULT');
    });

    it('should open edit modal pre-filled with task data', () => {
      const { component } = setup();
      component.openEditModal(mockTasks[0]);
      expect(component.showModal()).toBe(true);
      expect(component.editingTask()).toEqual(mockTasks[0]);
      expect(component.formTitle()).toBe('Todo task');
      expect(component.formTag()).toBe('WORK');
    });

    it('should close modal', () => {
      const { component } = setup();
      component.openAddModal();
      component.closeModal();
      expect(component.showModal()).toBe(false);
    });

    it('should not save when title is empty', () => {
      const { component } = setup();
      const createSpy = vi.spyOn(component.taskService, 'createTask');
      component.formTitle.set('');
      component.saveTask();
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('toggleComplete()', () => {
    it('should call updateTask with inverted completed value', () => {
      const { component } = setup();
      const updateSpy = vi.spyOn(component.taskService, 'updateTask').mockReturnValue(EMPTY);
      component.toggleComplete(mockTasks[0]);
      expect(updateSpy).toHaveBeenCalledWith(1, { completed: true });
    });
  });

  describe('deleteTask()', () => {
    it('should call deleteTask on service with correct id', () => {
      const { component } = setup();
      const deleteSpy = vi.spyOn(component.taskService, 'deleteTask').mockReturnValue(EMPTY);
      component.deleteTask(mockTasks[0]);
      expect(deleteSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('drag & drop', () => {
    it('should store dragged task on onDragStart', () => {
      const { component } = setup();
      component.onDragStart(mockTasks[0]);
      expect(component.draggedTask()).toEqual(mockTasks[0]);
    });

    it('should mark completed task as incomplete when dropped in todo column', () => {
      const { component } = setup();
      const updateSpy = vi.spyOn(component.taskService, 'updateTask').mockReturnValue(EMPTY);
      component.onDragStart(mockTasks[1]);
      component.onDropTodo({} as DragEvent);
      expect(updateSpy).toHaveBeenCalledWith(2, { completed: false });
      expect(component.draggedTask()).toBeNull();
    });

    it('should mark incomplete task as complete when dropped in done column', () => {
      const { component } = setup();
      const updateSpy = vi.spyOn(component.taskService, 'updateTask').mockReturnValue(EMPTY);
      component.onDragStart(mockTasks[0]);
      component.onDropDone({} as DragEvent);
      expect(updateSpy).toHaveBeenCalledWith(1, { completed: true });
      expect(component.draggedTask()).toBeNull();
    });

    it('should skip update when task dropped in same column state', () => {
      const { component } = setup();
      const updateSpy = vi.spyOn(component.taskService, 'updateTask').mockReturnValue(EMPTY);
      component.onDragStart(mockTasks[0]);
      component.onDropTodo({} as DragEvent);
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
