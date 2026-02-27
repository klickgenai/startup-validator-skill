// =============================================================================
// SQLite User Repository — parameterized queries only (guardrail 2)
// =============================================================================

import type Database from 'better-sqlite3';
import type { User } from '../types';
import type { IUserRepository } from './user-repository.interface';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteUserRepository implements IUserRepository {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  create(user: User): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(user.id, user.email, user.passwordHash, user.createdAt, user.updatedAt);
    return user;
  }

  findById(id: string): User | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as UserRow | undefined;
    return row ? rowToUser(row) : undefined;
  }

  findByEmail(email: string): User | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email) as UserRow | undefined;
    return row ? rowToUser(row) : undefined;
  }

  existsByEmail(email: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM users WHERE email = ?');
    return stmt.get(email) !== undefined;
  }
}
