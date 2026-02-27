/**
 * Task model — all database operations for tasks.
 * Guardrails: #1 (parameterized queries), #3 (ownership on every query),
 *             #7 (DB integrity), #9 (race conditions via transactions)
 *
 * CRITICAL: Every query includes user_id in the WHERE clause.
 * A user can NEVER access, modify, or delete another user's tasks.
 */

const { getDatabase } = require('../config/database');

/**
 * Create a new task for a user.
 * Returns the created task.
 */
function createTask(userId, { title, description, status, priority, due_date }) {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO tasks (user_id, title, description, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    userId,
    title.trim(),
    description !== undefined && description !== null ? description : '',
    status || 'todo',
    priority || 'medium',
    due_date || null
  );

  // Return the created task
  return getTaskById(userId, result.lastInsertRowid);
}

/**
 * Get a single task by ID, scoped to the authenticated user.
 * Returns null if not found or not owned by user.
 */
function getTaskById(userId, taskId) {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
    FROM tasks
    WHERE id = ? AND user_id = ?
  `);

  return stmt.get(taskId, userId) || null;
}

/**
 * List tasks for a user with filtering, sorting, and pagination.
 * Guardrail #6: Always paginated.
 *
 * @param {number} userId - The authenticated user's ID
 * @param {object} options - { page, limit, status, priority, sort, order }
 * @returns {{ items: Array, total: number, page: number, limit: number }}
 */
function listTasks(userId, { page = 1, limit = 20, status = null, priority = null, sort = 'created_at', order = 'desc' }) {
  const db = getDatabase();

  // Build WHERE clause dynamically (all parameterized)
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (priority) {
    conditions.push('priority = ?');
    params.push(priority);
  }

  const whereClause = conditions.join(' AND ');

  // Sort field and order are validated/whitelisted in the validator layer,
  // so they are safe to interpolate here. They are NOT user-supplied raw strings.
  const orderClause = `${sort} ${order.toUpperCase()}`;

  // Count total matching records (for pagination metadata)
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM tasks WHERE ${whereClause}`);
  const { total } = countStmt.get(...params);

  // Fetch the page
  const offset = (page - 1) * limit;
  const dataStmt = db.prepare(`
    SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
    FROM tasks
    WHERE ${whereClause}
    ORDER BY ${orderClause}
    LIMIT ? OFFSET ?
  `);

  const items = dataStmt.all(...params, limit, offset);

  return { items, total, page, limit };
}

/**
 * Update a task. Only updates provided fields.
 * Guardrail #3: Ownership enforced — returns null if task doesn't belong to user.
 * Guardrail #9: Uses a transaction for atomicity.
 */
function updateTask(userId, taskId, updates) {
  const db = getDatabase();

  // First verify ownership
  const existing = getTaskById(userId, taskId);
  if (!existing) {
    return null;
  }

  // Build SET clause from provided fields only
  const fields = [];
  const params = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    params.push(updates.title.trim());
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    params.push(updates.description !== null ? updates.description : '');
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    params.push(updates.status);
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    params.push(updates.priority);
  }
  if (updates.due_date !== undefined) {
    fields.push('due_date = ?');
    params.push(updates.due_date);
  }

  // Always update the updated_at timestamp
  fields.push("updated_at = datetime('now')");

  // Add WHERE params
  params.push(taskId, userId);

  const updateStmt = db.prepare(`
    UPDATE tasks
    SET ${fields.join(', ')}
    WHERE id = ? AND user_id = ?
  `);

  const updateAndReturn = db.transaction(() => {
    updateStmt.run(...params);
    return getTaskById(userId, taskId);
  });

  return updateAndReturn();
}

/**
 * Delete a task. Ownership enforced.
 * Returns true if deleted, false if not found / not owned.
 */
function deleteTask(userId, taskId) {
  const db = getDatabase();

  const stmt = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
  const result = stmt.run(taskId, userId);

  return result.changes > 0;
}

module.exports = { createTask, getTaskById, listTasks, updateTask, deleteTask };
