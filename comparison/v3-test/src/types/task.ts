import { z } from 'zod';

// ---------------------------------------------------------------------------
// Domain enums
// ---------------------------------------------------------------------------
export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type TaskPriorityType = (typeof TaskPriority)[keyof typeof TaskPriority];

// ---------------------------------------------------------------------------
// Domain entity
// ---------------------------------------------------------------------------
export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatusType;
  priority: TaskPriorityType;
  dueDate: string | null;
  version: number; // optimistic locking
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Zod schemas for request validation
// ---------------------------------------------------------------------------
export const CreateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().max(2000).nullable().optional().default(null),
  status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid ISO 8601 date' })
    .nullable()
    .optional()
    .default(null),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid ISO 8601 date' })
    .nullable()
    .optional(),
  version: z.number().int().min(0, 'Version is required for optimistic locking'),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const TaskFiltersSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  search: z.string().max(255).optional(),
});

export type TaskFilters = z.infer<typeof TaskFiltersSchema>;
