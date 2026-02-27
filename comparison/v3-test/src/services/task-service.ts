// =============================================================================
// Task Service — business logic with ownership enforcement (guardrails 4, 10, 12, 17)
// =============================================================================

import { randomUUID } from 'crypto';
import type { Logger } from 'pino';
import type { ITaskRepository, TaskListResult } from '../repositories';
import type { EventBus } from '../events';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from '../types';
import { NotFoundError, ConflictError } from '../errors';

export class TaskService {
  private readonly taskRepo: ITaskRepository;
  private readonly eventBus: EventBus;
  private readonly logger: Logger;

  constructor(deps: {
    taskRepo: ITaskRepository;
    eventBus: EventBus;
    logger: Logger;
  }) {
    this.taskRepo = deps.taskRepo;
    this.eventBus = deps.eventBus;
    this.logger = deps.logger.child({ service: 'TaskService' });
  }

  async create(input: CreateTaskInput, userId: string, correlationId: string): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      userId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      dueDate: input.dueDate ?? null,
      version: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.logger.info({ taskId: task.id, userId, correlationId }, 'Creating task');
    const created = this.taskRepo.create(task);

    await this.eventBus.emit({
      type: 'task.created',
      payload: {
        action: 'CREATE',
        resource: 'task',
        resourceId: created.id,
        userId,
        correlationId,
        timestamp: now,
        changes: { title: input.title, status: created.status, priority: created.priority },
      },
    });

    return created;
  }

  getById(taskId: string, userId: string): Task {
    // Return 404 for unauthorized resources (guardrail 4)
    const task = this.taskRepo.findByIdAndUserId(taskId, userId);
    if (!task) {
      throw new NotFoundError('Task');
    }
    return task;
  }

  list(
    userId: string,
    filters: TaskFilters,
    page: number,
    limit: number,
  ): TaskListResult {
    return this.taskRepo.listByUserId(userId, filters, page, limit);
  }

  async update(
    taskId: string,
    input: UpdateTaskInput,
    userId: string,
    correlationId: string,
  ): Promise<Task> {
    const existing = this.taskRepo.findByIdAndUserId(taskId, userId);
    if (!existing) {
      throw new NotFoundError('Task');
    }

    // Optimistic locking (guardrail 10)
    if (existing.version !== input.version) {
      throw new ConflictError(
        'Task has been modified by another request. Please refresh and try again.',
      );
    }

    const now = new Date().toISOString();
    const updated: Task = {
      ...existing,
      title: input.title ?? existing.title,
      description: input.description !== undefined ? input.description : existing.description,
      status: input.status ?? existing.status,
      priority: input.priority ?? existing.priority,
      dueDate: input.dueDate !== undefined ? input.dueDate : existing.dueDate,
      version: existing.version + 1,
      updatedAt: now,
    };

    this.logger.info({ taskId, userId, correlationId }, 'Updating task');
    const result = this.taskRepo.update(updated);

    // Build changes object for audit
    const changes: Record<string, unknown> = {};
    if (input.title !== undefined && input.title !== existing.title) changes.title = input.title;
    if (input.description !== undefined && input.description !== existing.description) changes.description = input.description;
    if (input.status !== undefined && input.status !== existing.status) changes.status = input.status;
    if (input.priority !== undefined && input.priority !== existing.priority) changes.priority = input.priority;
    if (input.dueDate !== undefined && input.dueDate !== existing.dueDate) changes.dueDate = input.dueDate;

    await this.eventBus.emit({
      type: 'task.updated',
      payload: {
        action: 'UPDATE',
        resource: 'task',
        resourceId: taskId,
        userId,
        correlationId,
        timestamp: now,
        changes,
      },
    });

    return result;
  }

  async delete(taskId: string, userId: string, correlationId: string): Promise<void> {
    const existing = this.taskRepo.findByIdAndUserId(taskId, userId);
    if (!existing) {
      throw new NotFoundError('Task');
    }

    this.logger.info({ taskId, userId, correlationId }, 'Deleting task');
    this.taskRepo.delete(taskId, userId);

    await this.eventBus.emit({
      type: 'task.deleted',
      payload: {
        action: 'DELETE',
        resource: 'task',
        resourceId: taskId,
        userId,
        correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
