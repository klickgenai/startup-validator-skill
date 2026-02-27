const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { success, error } = require('../utils/response');
const { getDatabase } = require('../config/database');

const router = express.Router();

// ─── Constants ──────────────────────────────────────────────────────────────

const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_SORT_FIELDS = ['created_at', 'updated_at', 'due_date', 'priority', 'status', 'title'];
const VALID_SORT_ORDERS = ['asc', 'desc'];

// ISO 8601 date pattern (YYYY-MM-DD)
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) return 'due_date must be in YYYY-MM-DD format';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'due_date is not a valid date';
  return true;
}

// ─── Validation Schemas ─────────────────────────────────────────────────────

const createTaskSchema = {
  body: {
    title: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 255,
      sanitize: (v) => v.trim(),
    },
    description: {
      type: 'string',
      required: false,
      maxLength: 2000,
      sanitize: (v) => v.trim(),
    },
    status: {
      type: 'string',
      required: false,
      enum: VALID_STATUSES,
    },
    priority: {
      type: 'string',
      required: false,
      enum: VALID_PRIORITIES,
    },
    due_date: {
      type: 'string',
      required: false,
      custom: isValidDate,
    },
  },
};

const updateTaskSchema = {
  body: {
    title: {
      type: 'string',
      required: false,
      minLength: 1,
      maxLength: 255,
      sanitize: (v) => v.trim(),
    },
    description: {
      type: 'string',
      required: false,
      maxLength: 2000,
      sanitize: (v) => v.trim(),
    },
    status: {
      type: 'string',
      required: false,
      enum: VALID_STATUSES,
    },
    priority: {
      type: 'string',
      required: false,
      enum: VALID_PRIORITIES,
    },
    due_date: {
      type: 'string',
      required: false,
      custom: isValidDate,
    },
    version: {
      type: 'integer',
      required: true,
    },
  },
};

const taskIdSchema = {
  params: {
    id: {
      type: 'string',
      required: true,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      patternMessage: 'id must be a valid UUID',
    },
  },
};

const listTasksSchema = {
  query: {
    page: {
      type: 'integer',
      required: false,
      min: 1,
    },
    limit: {
      type: 'integer',
      required: false,
      min: 1,
      max: 100,
    },
    status: {
      type: 'string',
      required: false,
      enum: VALID_STATUSES,
    },
    priority: {
      type: 'string',
      required: false,
      enum: VALID_PRIORITIES,
    },
    sort_by: {
      type: 'string',
      required: false,
      enum: VALID_SORT_FIELDS,
    },
    sort_order: {
      type: 'string',
      required: false,
      enum: VALID_SORT_ORDERS,
    },
  },
};

// ─── All task routes require authentication ─────────────────────────────────

router.use(authenticate);

// ─── GET /api/tasks — List tasks (paginated) ────────────────────────────────
// Checklist: auth [x], ownership [x], input validation [x], pagination [x],
// parameterized SQL [x], error handling [x], consistent shape [x]

router.get('/', validate(listTasksSchema), (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    // Build WHERE clause dynamically (all parameterized)
    const conditions = ['user_id = ?'];
    const params = [userId];

    if (req.query.status) {
      conditions.push('status = ?');
      params.push(req.query.status);
    }

    if (req.query.priority) {
      conditions.push('priority = ?');
      params.push(req.query.priority);
    }

    const whereClause = conditions.join(' AND ');

    // Sort — only allow whitelisted columns (prevents SQL injection via ORDER BY)
    const sortBy = VALID_SORT_FIELDS.includes(req.query.sort_by)
      ? req.query.sort_by
      : 'created_at';
    const sortOrder = req.query.sort_order === 'asc' ? 'ASC' : 'DESC';

    // Count total matching tasks (for pagination meta)
    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM tasks WHERE ${whereClause}`)
      .get(...params);
    const total = countRow.total;

    // Fetch page of tasks
    const tasks = db
      .prepare(
        `SELECT id, title, description, status, priority, due_date, version, created_at, updated_at
         FROM tasks
         WHERE ${whereClause}
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    return success(res, tasks, 200, {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('List tasks error:', { userId: req.user.id });
    return error(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.');
  }
});

// ─── GET /api/tasks/:id — Get single task ───────────────────────────────────
// Checklist: auth [x], ownership [x], input validation [x], parameterized SQL [x],
// error handling [x], consistent shape [x]

router.get('/:id', validate(taskIdSchema), (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    // Parameterized query — ownership check built into WHERE
    const task = db
      .prepare(
        `SELECT id, title, description, status, priority, due_date, version, created_at, updated_at
         FROM tasks
         WHERE id = ? AND user_id = ?`
      )
      .get(req.params.id, userId);

    if (!task) {
      return error(res, 404, 'NOT_FOUND', 'Task not found');
    }

    return success(res, task);
  } catch (err) {
    console.error('Get task error:', { taskId: req.params.id, userId: req.user.id });
    return error(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.');
  }
});

// ─── POST /api/tasks — Create task ──────────────────────────────────────────
// Checklist: auth [x], input validation [x], parameterized SQL [x],
// error handling [x], consistent shape [x], idempotency key not needed (create is not idempotent by design)

router.post('/', validate(createTaskSchema), (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    const id = uuidv4();
    const now = new Date().toISOString();
    const {
      title,
      description = '',
      status = 'todo',
      priority = 'medium',
      due_date = null,
    } = req.body;

    // Parameterized insert
    db.prepare(
      `INSERT INTO tasks (id, user_id, title, description, status, priority, due_date, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).run(id, userId, title, description, status, priority, due_date, now, now);

    const task = db
      .prepare(
        `SELECT id, title, description, status, priority, due_date, version, created_at, updated_at
         FROM tasks WHERE id = ?`
      )
      .get(id);

    return success(res, task, 201);
  } catch (err) {
    console.error('Create task error:', { userId: req.user.id });
    return error(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.');
  }
});

// ─── PUT /api/tasks/:id — Update task (with optimistic locking) ─────────────
// Checklist: auth [x], ownership [x], input validation [x], parameterized SQL [x],
// error handling [x], consistent shape [x], optimistic locking [x]

router.put('/:id', validate(taskIdSchema), validate(updateTaskSchema), (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const taskId = req.params.id;

    // Fetch existing task — ownership check
    const existing = db
      .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
      .get(taskId, userId);

    if (!existing) {
      return error(res, 404, 'NOT_FOUND', 'Task not found');
    }

    // Optimistic locking: client must send the version they last saw
    const clientVersion = parseInt(req.body.version, 10);
    if (clientVersion !== existing.version) {
      return error(
        res,
        409,
        'CONFLICT',
        'Task has been modified by another request. Please refresh and try again.',
      );
    }

    // Merge: only update fields that were provided
    const title = req.body.title !== undefined ? req.body.title : existing.title;
    const description = req.body.description !== undefined ? req.body.description : existing.description;
    const status = req.body.status !== undefined ? req.body.status : existing.status;
    const priority = req.body.priority !== undefined ? req.body.priority : existing.priority;
    const due_date = req.body.due_date !== undefined ? req.body.due_date : existing.due_date;
    const now = new Date().toISOString();
    const newVersion = existing.version + 1;

    // Parameterized update
    db.prepare(
      `UPDATE tasks
       SET title = ?, description = ?, status = ?, priority = ?, due_date = ?,
           version = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND version = ?`
    ).run(title, description, status, priority, due_date, newVersion, now, taskId, userId, clientVersion);

    const updated = db
      .prepare(
        `SELECT id, title, description, status, priority, due_date, version, created_at, updated_at
         FROM tasks WHERE id = ?`
      )
      .get(taskId);

    return success(res, updated);
  } catch (err) {
    console.error('Update task error:', { taskId: req.params.id, userId: req.user.id });
    return error(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.');
  }
});

// ─── DELETE /api/tasks/:id — Delete task ────────────────────────────────────
// Checklist: auth [x], ownership [x], input validation [x], parameterized SQL [x],
// error handling [x], consistent shape [x]

router.delete('/:id', validate(taskIdSchema), (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    // Ownership check built into WHERE — if no rows affected, either doesn't exist
    // or belongs to another user. Either way: 404 (don't leak existence).
    const result = db
      .prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
      .run(req.params.id, userId);

    if (result.changes === 0) {
      return error(res, 404, 'NOT_FOUND', 'Task not found');
    }

    return success(res, { message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', { taskId: req.params.id, userId: req.user.id });
    return error(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred. Please try again later.');
  }
});

module.exports = router;
