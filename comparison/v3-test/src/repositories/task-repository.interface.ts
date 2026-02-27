// =============================================================================
// Task Repository Interface — domain contract (guardrail 13)
// =============================================================================

import type { Task, TaskFilters } from '../types';

export interface TaskListResult {
  tasks: Task[];
  total: number;
}

export interface ITaskRepository {
  create(task: Task): Task;
  findById(id: string): Task | undefined;
  findByIdAndUserId(id: string, userId: string): Task | undefined;
  listByUserId(
    userId: string,
    filters: TaskFilters,
    page: number,
    limit: number,
  ): TaskListResult;
  update(task: Task): Task;
  delete(id: string, userId: string): boolean;
  countByUserId(userId: string): number;
}
