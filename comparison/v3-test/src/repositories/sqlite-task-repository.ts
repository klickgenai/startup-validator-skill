// =============================================================================
// SQLite Task Repository — parameterized queries, pagination (guardrails 2, 7)
// =============================================================================

import type Database from 'better-sqlite3';
import type { Task, TaskFilters } from '../types';
import type { ITaskRepository, TaskListResult } from './task-repository.interface';

interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    dueDate: row.due_date,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteTaskRepository implements ITaskRepository {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  create(task: Task): Task {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, user_id, title, description, status, priority, due_date, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      task.id,
      task.userId,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.dueDate,
      task.version,
      task.createdAt,
      task.updatedAt,
    );
    return task;
  }

  findById(id: string): Task | undefined {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id) as TaskRow | undefined;
    return row ? rowToTask(row) : undefined;
  }

  findByIdAndUserId(id: string, userId: string): Task | undefined {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?');
    const row = stmt.get(id, userId) as TaskRow | undefined;
    return row ? rowToTask(row) : undefined;
  }

  listByUserId(
    userId: string,
    filters: TaskFilters,
    page: number,
    limit: number,
  ): TaskListResult {
    const conditions: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.priority) {
      conditions.push('priority = ?');
      params.push(filters.priority);
    }

    if (filters.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.join(' AND ');

    // Count total
    const countStmt = this.db.prepare(`SELECT COUNT(*) as total FROM tasks WHERE ${whereClause}`);
    const countResult = countStmt.get(...params) as { total: number };
    const total = countResult.total;

    // Fetch page
    const offset = (page - 1) * limit;
    const selectStmt = this.db.prepare(
      `SELECT * FROM tasks WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    );
    const rows = selectStmt.all(...params, limit, offset) as TaskRow[];
    const tasks = rows.map(rowToTask);

    return { tasks, total };
  }

  update(task: Task): Task {
    const stmt = this.db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, status = ?, priority = ?, due_date = ?,
          version = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND version = ?
    `);
    const result = stmt.run(
      task.title,
      task.description,
      task.status,
      task.priority,
      task.dueDate,
      task.version,
      task.updatedAt,
      task.id,
      task.userId,
      task.version - 1, // optimistic locking: where version = old version
    );

    if (result.changes === 0) {
      return task; // caller checks via ConflictError
    }

    return task;
  }

  delete(id: string, userId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  countByUserId(userId: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?');
    const row = stmt.get(userId) as { count: number };
    return row.count;
  }
}
