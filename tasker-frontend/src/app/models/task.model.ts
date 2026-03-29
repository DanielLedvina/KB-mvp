export interface Task {
  id: number;
  title: string;
  completed: boolean;
  tag: string;
  description: string;
}

export interface CreateTaskDto {
  title: string;
  tag: string;
  description?: string;
}

export interface UpdateTaskDto {
  title?: string;
  tag?: string;
  description?: string;
  completed?: boolean;
}
