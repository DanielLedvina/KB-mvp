import { Component, input, output } from '@angular/core';
import { Task } from '../../models';
import { TaskCard } from '../task-card/task-card';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, CircleCheck } from 'lucide-angular';

@Component({
  selector: 'app-task-column',
  standalone: true,
  imports: [CommonModule, TaskCard, LucideAngularModule],
  templateUrl: './task-column.html',
  styleUrl: './task-column.scss',
})
export class TaskColumn {
  title = input.required<string>();
  tasks = input.required<Task[]>();
  emptyMessage = input<string>('No tasks yet.');

  onToggle = output<Task>();
  onEdit = output<Task>();
  onDelete = output<Task>();
  onDragStart = output<Task>();
  onDrop = output<DragEvent>();

  readonly ClockIcon = Clock;
  readonly CircleCheckIcon = CircleCheck;

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDropHandler(event: DragEvent) {
    event.preventDefault();
    this.onDrop.emit(event);
  }
}
