// =============================================================================
// Task Controller — HTTP handlers for CRUD (guardrails 5, 7)
// =============================================================================

import type { Request, Response, NextFunction } from 'express';
import type { TaskService } from '../services';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskFiltersSchema,
  PaginationQuerySchema,
  UUIDSchema,
} from '../types';
import { sendSuccess, sendPaginated, buildPaginationMeta } from '../utils';
import { ValidationError } from '../errors';

export class TaskController {
  private readonly taskService: TaskService;

  constructor(taskService: TaskService) {
    this.taskService = taskService;
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.requireUser(req);
      const input = CreateTaskSchema.parse(req.body);
      const task = await this.taskService.create(input, userId, req.correlationId);
      sendSuccess(res, task, 201);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.requireUser(req);
      const taskId = UUIDSchema.parse(req.params.id);
      const task = this.taskService.getById(taskId, userId);
      sendSuccess(res, task);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.requireUser(req);
      const filters = TaskFiltersSchema.parse(req.query);
      const pagination = PaginationQuerySchema.parse(req.query);
      const { tasks, total } = this.taskService.list(
        userId,
        filters,
        pagination.page,
        pagination.limit,
      );
      const meta = buildPaginationMeta(pagination.page, pagination.limit, total);
      sendPaginated(res, tasks, meta);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.requireUser(req);
      const taskId = UUIDSchema.parse(req.params.id);
      const input = UpdateTaskSchema.parse(req.body);
      const task = await this.taskService.update(taskId, input, userId, req.correlationId);
      sendSuccess(res, task);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.requireUser(req);
      const taskId = UUIDSchema.parse(req.params.id);
      await this.taskService.delete(taskId, userId, req.correlationId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  private requireUser(req: Request): string {
    if (!req.user) {
      throw new ValidationError('User context not found');
    }
    return req.user.userId;
  }
}
