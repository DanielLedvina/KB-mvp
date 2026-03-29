import { Component, input, output } from '@angular/core';
import { Task } from '../../models';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Pencil, Trash2, Check } from 'lucide-angular';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  providers: [{ provide: 'lucide-icons', useValue: { Pencil, Trash2, Check } }],
})
export class TaskCard {
  task = input.required<Task>();

  onToggle = output<Task>();
  onEdit = output<Task>();
  onDelete = output<Task>();
  onDragStart = output<Task>();

  readonly PencilIcon = Pencil;
  readonly Trash2Icon = Trash2;
  readonly CheckIcon = Check;
}
