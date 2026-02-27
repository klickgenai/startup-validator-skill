// =============================================================================
// User Repository Interface — domain contract (guardrail 13)
// =============================================================================

import type { User } from '../types';

export interface IUserRepository {
  create(user: User): User;
  findById(id: string): User | undefined;
  findByEmail(email: string): User | undefined;
  existsByEmail(email: string): boolean;
}
