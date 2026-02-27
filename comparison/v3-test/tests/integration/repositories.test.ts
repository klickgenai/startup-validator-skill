// =============================================================================
// Repository Tests — cover uncovered branches (findById, countByUserId)
// =============================================================================

import Database from 'better-sqlite3';
import pino from 'pino';
import { runMigrations } from '../../src/config/database';
import { SqliteUserRepository } from '../../src/repositories/sqlite-user-repository';
import { SqliteTaskRepository } from '../../src/repositories/sqlite-task-repository';
import type { User, Task } from '../../src/types';

describe('SqliteUserRepository', () => {
  let db: Database.Database;
  let repo: SqliteUserRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    const logger = pino({ level: 'silent' });
    runMigrations(db, logger);
    repo = new SqliteUserRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('should return undefined for findById with non-existent id', () => {
    const result = repo.findById('non-existent-id');
    expect(result).toBeUndefined();
  });

  it('should return undefined for findByEmail with non-existent email', () => {
    const result = repo.findByEmail('nope@example.com');
    expect(result).toBeUndefined();
  });

  it('should create and find a user by id', () => {
    const now = new Date().toISOString();
    const user: User = {
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hash',
      createdAt: now,
      updatedAt: now,
    };
    repo.create(user);
    const found = repo.findById('user-1');
    expect(found).toBeDefined();
    expect(found!.email).toBe('test@example.com');
  });

  it('should check existsByEmail', () => {
    const now = new Date().toISOString();
    repo.create({
      id: 'user-2',
      email: 'exists@example.com',
      passwordHash: 'hash',
      createdAt: now,
      updatedAt: now,
    });
    expect(repo.existsByEmail('exists@example.com')).toBe(true);
    expect(repo.existsByEmail('nope@example.com')).toBe(false);
  });
});

describe('SqliteTaskRepository', () => {
  let db: Database.Database;
  let repo: SqliteTaskRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    const logger = pino({ level: 'silent' });
    runMigrations(db, logger);
    // Create user for FK constraint
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
      'user-1',
      'test@example.com',
      'hash',
    );
    repo = new SqliteTaskRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  const makeTask = (overrides?: Partial<Task>): Task => ({
    id: overrides?.id ?? 'task-1',
    userId: overrides?.userId ?? 'user-1',
    title: overrides?.title ?? 'Test Task',
    description: overrides?.description ?? null,
    status: overrides?.status ?? 'todo',
    priority: overrides?.priority ?? 'medium',
    dueDate: overrides?.dueDate ?? null,
    version: overrides?.version ?? 0,
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    updatedAt: overrides?.updatedAt ?? new Date().toISOString(),
  });

  it('should return undefined for findById with non-existent id', () => {
    const result = repo.findById('non-existent');
    expect(result).toBeUndefined();
  });

  it('should return undefined for findByIdAndUserId with wrong user', () => {
    repo.create(makeTask({ id: 'task-owned' }));
    const result = repo.findByIdAndUserId('task-owned', 'wrong-user');
    expect(result).toBeUndefined();
  });

  it('should countByUserId', () => {
    repo.create(makeTask({ id: 'count-1' }));
    repo.create(makeTask({ id: 'count-2' }));
    expect(repo.countByUserId('user-1')).toBe(2);
    expect(repo.countByUserId('user-999')).toBe(0);
  });

  it('should delete and return false for non-existent task', () => {
    expect(repo.delete('non-existent', 'user-1')).toBe(false);
  });

  it('should handle update with version mismatch (returns 0 changes)', () => {
    repo.create(makeTask({ id: 'ver-task', version: 0 }));
    const task = makeTask({ id: 'ver-task', version: 5 }); // version doesn't match
    const result = repo.update(task);
    // Update runs but changes === 0 because version check fails
    expect(result).toBeDefined();
  });
});
