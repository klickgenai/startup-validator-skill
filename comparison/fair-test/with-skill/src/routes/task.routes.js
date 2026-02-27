/**
 * Task routes — full CRUD for tasks.
 * Guardrails: #1, #3, #4, #5, #6
 *
 * ALL routes require authentication (Guardrail #3).
 * ALL queries are scoped to the authenticated user (Guardrail #3).
 * ALL inputs are validated before processing (Guardrail #4).
 * ALL list endpoints are paginated (Guardrail #6).
 *
 * GET    /api/tasks       — list tasks (paginated, filterable, sortable)
 * POST   /api/tasks       — create a task
 * GET    /api/tasks/:id   — get a single task
 * PUT    /api/tasks/:id   — update a task
 * DELETE /api/tasks/:id   — delete a task
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { createTask, getTaskById, listTasks, updateTask, deleteTask } = require('../models/task.model');
const { validateCreateTask, validateUpdateTask, validateTaskQuery } = require('../validators/task.validators');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');

const router = express.Router();

// Guardrail #3: Auth on EVERY endpoint — applied to the entire router
router.use(authenticate);

/**
 * Helper: Parse and validate a task ID from the URL.
 * Returns the integer ID or sends an error response and returns null.
 */
function parseTaskId(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    sendError(res, 'Task ID must be a positive integer.', 400, 'INVALID_ID');
    return null;
  }
  return id;
}

/**
 * GET /api/tasks
 * List tasks with optional filtering, sorting, and pagination.
 */
router.get('/', (req, res, next) => {
  try {
    // Guardrail #4: Validate and sanitize query params
    const queryValidation = validateTaskQuery(req.query);
    if (!queryValidation.valid) {
      return sendError(res, queryValidation.errors.join(' '), 400, 'VALIDATION_ERROR');
    }

    const { page, limit, status, priority, sort, order } = queryValidation;
    const result = listTasks(req.userId, { page, limit, status, priority, sort, order });

    return sendPaginated(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks
 * Create a new task.
 */
router.post('/', (req, res, next) => {
  try {
    // Guardrail #4: Validate input
    const validation = validateCreateTask(req.body);
    if (!validation.valid) {
      return sendError(res, validation.errors.join(' '), 400, 'VALIDATION_ERROR');
    }

    const task = createTask(req.userId, req.body);
    return sendSuccess(res, task, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tasks/:id
 * Get a single task by ID (ownership enforced in model).
 */
router.get('/:id', (req, res, next) => {
  try {
    const taskId = parseTaskId(req, res);
    if (taskId === null) return;

    const task = getTaskById(req.userId, taskId);
    if (!task) {
      return sendError(res, 'Task not found.', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tasks/:id
 * Update a task (ownership enforced in model).
 */
router.put('/:id', (req, res, next) => {
  try {
    const taskId = parseTaskId(req, res);
    if (taskId === null) return;

    // Guardrail #4: Validate input
    const validation = validateUpdateTask(req.body);
    if (!validation.valid) {
      return sendError(res, validation.errors.join(' '), 400, 'VALIDATION_ERROR');
    }

    const task = updateTask(req.userId, taskId, req.body);
    if (!task) {
      return sendError(res, 'Task not found.', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task (ownership enforced in model).
 */
router.delete('/:id', (req, res, next) => {
  try {
    const taskId = parseTaskId(req, res);
    if (taskId === null) return;

    const deleted = deleteTask(req.userId, taskId);
    if (!deleted) {
      return sendError(res, 'Task not found.', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
