// =============================================================================
// Task Test Factory — generates test task data
// =============================================================================

import type { CreateTaskInput } from '../../src/types';

let factoryCounter = 0;

export function buildCreateTaskInput(overrides?: Partial<CreateTaskInput>): CreateTaskInput {
  factoryCounter++;
  return {
    title: overrides?.title ?? `Test Task ${factoryCounter}`,
    description: overrides?.description ?? `Description for task ${factoryCounter}`,
    status: overrides?.status ?? 'todo',
    priority: overrides?.priority ?? 'medium',
    dueDate: overrides?.dueDate ?? null,
  };
}

export function resetTaskFactory(): void {
  factoryCounter = 0;
}
