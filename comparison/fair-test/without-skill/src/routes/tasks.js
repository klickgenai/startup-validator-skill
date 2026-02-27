const express = require('express');
const { getDatabase } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// Helper to validate date format (YYYY-MM-DD)
function isValidDate(dateString) {
  if (!dateString) return true; // due_date is optional
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// GET /api/tasks - List all tasks for the authenticated user
router.get('/', (req, res) => {
  const db = getDatabase();
  const { status, priority, sort, order } = req.query;

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [req.userId];

  // Filter by status
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    query += ' AND status = ?';
    params.push(status);
  }

  // Filter by priority
  if (priority) {
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }
    query += ' AND priority = ?';
    params.push(priority);
  }

  // Sorting
  const allowedSortFields = ['created_at', 'updated_at', 'due_date', 'priority', 'status', 'title'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  query += ` ORDER BY ${sortField} ${sortOrder}`;

  const tasks = db.prepare(query).all(...params);

  res.json({
    count: tasks.length,
    tasks
  });
});

// GET /api/tasks/:id - Get a single task
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(
    req.params.id,
    req.userId
  );

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json({ task });
});

// POST /api/tasks - Create a new task
router.post('/', (req, res) => {
  const { title, description, status, priority, due_date } = req.body;

  // Validate required fields
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Validate status if provided
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  // Validate priority if provided
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  // Validate due_date if provided
  if (!isValidDate(due_date)) {
    return res.status(400).json({ error: 'Invalid due_date format. Use YYYY-MM-DD' });
  }

  const db = getDatabase();
  const result = db.prepare(`
    INSERT INTO tasks (user_id, title, description, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    req.userId,
    title.trim(),
    description || '',
    status || 'todo',
    priority || 'medium',
    due_date || null
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    message: 'Task created successfully',
    task
  });
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', (req, res) => {
  const db = getDatabase();

  // Check if task exists and belongs to user
  const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(
    req.params.id,
    req.userId
  );

  if (!existingTask) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, status, priority, due_date } = req.body;

  // Validate status if provided
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  // Validate priority if provided
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  // Validate due_date if provided
  if (due_date !== undefined && !isValidDate(due_date)) {
    return res.status(400).json({ error: 'Invalid due_date format. Use YYYY-MM-DD' });
  }

  // Validate title if provided
  if (title !== undefined && title.trim() === '') {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  const updatedTask = {
    title: title !== undefined ? title.trim() : existingTask.title,
    description: description !== undefined ? description : existingTask.description,
    status: status || existingTask.status,
    priority: priority || existingTask.priority,
    due_date: due_date !== undefined ? (due_date || null) : existingTask.due_date
  };

  db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(
    updatedTask.title,
    updatedTask.description,
    updatedTask.status,
    updatedTask.priority,
    updatedTask.due_date,
    req.params.id,
    req.userId
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

  res.json({
    message: 'Task updated successfully',
    task
  });
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', (req, res) => {
  const db = getDatabase();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(
    req.params.id,
    req.userId
  );

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(
    req.params.id,
    req.userId
  );

  res.json({ message: 'Task deleted successfully' });
});

module.exports = router;
