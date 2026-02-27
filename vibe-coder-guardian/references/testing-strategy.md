# Testing Strategy — Enterprise Reference

Read this file during Phase 5 (TEST). Contains the testing pyramid, patterns, factory examples, CI/CD integration, and coverage requirements.

---

## The Testing Pyramid

```
              ╱╲
             ╱ E2E ╲              ← 5-10 tests: Critical user journeys
            ╱────────╲               Slow, flaky, expensive. Use sparingly.
           ╱Integration╲          ← 20-50 tests: API endpoints, DB queries,
          ╱──────────────╲           service interactions. Real dependencies.
         ╱   Unit Tests    ╲      ← 100+ tests: Business logic, validators,
        ╱────────────────────╲       transformers, utilities. Fast, isolated.
```

### Time Budget

| Level | Count | Speed | Runs When |
|-------|-------|-------|-----------|
| Unit | 100+ | < 10ms each | Every save (watch mode) |
| Integration | 20-50 | < 500ms each | Pre-commit hook, CI |
| E2E | 5-10 | < 5s each | CI only, before deploy |

**Target: Full test suite completes in < 30 seconds.** If it takes longer, you're testing too much at the wrong level.

---

## Unit Tests

### What to Test

| Test | Examples |
|------|---------|
| Domain entities | Business rules, validation, state transitions |
| Value objects | Creation, validation, equality |
| Use cases / services | Orchestration logic with mocked dependencies |
| Validators | Input validation rules |
| Transformers / mappers | DTO ↔ Entity conversions |
| Utility functions | Formatters, calculators, parsers |

### What NOT to Unit Test

- Framework behavior (Express routing, ORM queries)
- Configuration loading
- Getter/setter methods with no logic
- Private methods (test through public API)
- Third-party library behavior

### Pattern: Arrange-Act-Assert

Every test follows this structure:

```typescript
describe('Task.complete()', () => {
  it('should change status to DONE and increment version', () => {
    // Arrange — set up the scenario
    const task = Task.create({
      userId: 'user-1',
      title: 'Test task',
      status: TaskStatus.IN_PROGRESS,
    });
    const originalVersion = task.version;

    // Act — perform the action
    task.complete();

    // Assert — verify the outcome
    expect(task.status).toBe(TaskStatus.DONE);
    expect(task.version).toBe(originalVersion + 1);
  });

  it('should throw when task is already completed', () => {
    // Arrange
    const task = Task.create({ userId: 'user-1', title: 'Test', status: TaskStatus.IN_PROGRESS });
    task.complete();

    // Act & Assert
    expect(() => task.complete()).toThrow(ValidationError);
    expect(() => task.complete()).toThrow('Task is already completed');
  });
});
```

### Pattern: Testing Use Cases with Mocks

```typescript
describe('CreateTaskUseCase', () => {
  let useCase: CreateTaskUseCase;
  let mockTaskRepo: jest.Mocked<ITaskRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    // Arrange — fresh mocks for each test
    mockTaskRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };
    useCase = new CreateTaskUseCase(mockTaskRepo, mockEventBus);
  });

  it('should create task and publish event', async () => {
    // Arrange
    const input = { userId: 'user-1', title: 'New task' };
    mockTaskRepo.create.mockResolvedValue(TaskFactory.build({ ...input, id: 'task-1' }));

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(mockTaskRepo.create).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TaskCreated' })
    );
    expect(result.id).toBe('task-1');
    expect(result.title).toBe('New task');
  });

  it('should reject empty title', async () => {
    await expect(useCase.execute({ userId: 'user-1', title: '' }))
      .rejects.toThrow(ValidationError);
    expect(mockTaskRepo.create).not.toHaveBeenCalled();
  });
});
```

---

## Integration Tests

### What to Test

| Test | Examples |
|------|---------|
| API endpoints | Request → Response cycle with real middleware |
| Database queries | Repository methods with real database |
| Authentication flow | Token generation → middleware verification |
| Middleware chains | Auth + validation + error handling together |

### Pattern: API Endpoint Testing

```typescript
describe('POST /api/tasks', () => {
  let app: Express;
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    // Set up test database, seed data
    app = createTestApp();
    testUser = await UserFactory.createInDb();
    authToken = generateTestToken(testUser.id);
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  it('should create task and return 201 with consistent shape', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Integration test task', status: 'todo' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        id: expect.any(String),
        title: 'Integration test task',
        status: 'todo',
        userId: testUser.id,
        createdAt: expect.any(String),
      },
    });
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'No auth' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('should return 422 with invalid input', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: '', status: 'invalid_status' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should not allow user A to see user B tasks', async () => {
    const userB = await UserFactory.createInDb();
    const task = await TaskFactory.createInDb({ userId: userB.id });
    const tokenA = generateTestToken(testUser.id);

    const res = await request(app)
      .get(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404); // Not 403 — don't reveal existence
  });
});
```

### Pattern: Repository Integration Testing

```typescript
describe('SqliteTaskRepository', () => {
  let repo: SqliteTaskRepository;
  let db: Database;

  beforeAll(() => {
    db = createTestDatabase(); // In-memory SQLite
    runMigrations(db);
    repo = new SqliteTaskRepository(db);
  });

  afterEach(() => {
    db.exec('DELETE FROM tasks');
    db.exec('DELETE FROM users');
  });

  afterAll(() => {
    db.close();
  });

  it('should paginate results correctly', async () => {
    const user = await UserFactory.createInDb(db);
    // Create 25 tasks
    for (let i = 0; i < 25; i++) {
      await TaskFactory.createInDb(db, { userId: user.id, title: `Task ${i}` });
    }

    const page1 = await repo.findByUserId(user.id, { page: 1, limit: 10 });
    const page2 = await repo.findByUserId(user.id, { page: 2, limit: 10 });
    const page3 = await repo.findByUserId(user.id, { page: 3, limit: 10 });

    expect(page1.tasks).toHaveLength(10);
    expect(page1.total).toBe(25);
    expect(page2.tasks).toHaveLength(10);
    expect(page3.tasks).toHaveLength(5);
  });

  it('should only return tasks for the specified user', async () => {
    const userA = await UserFactory.createInDb(db);
    const userB = await UserFactory.createInDb(db);
    await TaskFactory.createInDb(db, { userId: userA.id, title: 'A task' });
    await TaskFactory.createInDb(db, { userId: userB.id, title: 'B task' });

    const result = await repo.findByUserId(userA.id, { page: 1, limit: 20 });

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('A task');
  });
});
```

---

## Test Factories / Builders

**Never repeat test data setup.** Use factories.

```typescript
// tests/factories/user.factory.ts
export class UserFactory {
  private static counter = 0;

  static build(overrides: Partial<User> = {}): User {
    UserFactory.counter++;
    return {
      id: `user-${UserFactory.counter}`,
      email: `test${UserFactory.counter}@example.com`,
      passwordHash: '$2b$12$mock.hash.value',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    };
  }

  static async createInDb(db?: Database, overrides: Partial<User> = {}): Promise<User> {
    const user = UserFactory.build(overrides);
    // Insert into DB...
    return user;
  }
}

// tests/factories/task.factory.ts
export class TaskFactory {
  private static counter = 0;

  static build(overrides: Partial<Task> = {}): Task {
    TaskFactory.counter++;
    return {
      id: `task-${TaskFactory.counter}`,
      userId: 'user-1',
      title: `Test Task ${TaskFactory.counter}`,
      description: null,
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      version: 1,
      ...overrides,
    };
  }
}
```

---

## Test Setup & Teardown

### Database Setup for Tests

```typescript
// tests/setup.ts
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

let testDb: Database.Database;

export function createTestDatabase(): Database.Database {
  testDb = new Database(':memory:');
  testDb.pragma('journal_mode = WAL');
  testDb.pragma('foreign_keys = ON');

  // Run migrations
  const migration = readFileSync(join(__dirname, '../src/infrastructure/database/migrations/001_initial.sql'), 'utf-8');
  testDb.exec(migration);

  return testDb;
}

export function cleanupTestDb(): void {
  if (testDb) testDb.close();
}

// tests/helpers/test-app.ts
export function createTestApp(): Express {
  // Create app with test database and test config
  const container = createContainer({
    databaseUrl: ':memory:',
    jwtSecret: 'test-secret-at-least-32-characters-long',
    jwtExpiry: '1h',
    nodeEnv: 'test',
  });

  return createApp(container);
}
```

---

## Edge Cases to Always Test

### Input Edge Cases

```typescript
describe('Input Edge Cases', () => {
  // Empty / whitespace
  it('should reject empty string', () => {});
  it('should reject whitespace-only string', () => {});
  it('should trim leading/trailing whitespace', () => {});

  // Boundary values
  it('should accept minimum length (1 char)', () => {});
  it('should accept maximum length (255 chars)', () => {});
  it('should reject over maximum length (256 chars)', () => {});

  // Type coercion
  it('should reject number where string expected', () => {});
  it('should reject string where number expected', () => {});
  it('should handle null gracefully', () => {});
  it('should handle undefined gracefully', () => {});

  // Special characters
  it('should handle unicode characters', () => {});  // José, O'Brien
  it('should handle emoji', () => {});
  it('should escape HTML in text fields', () => {});

  // Date edge cases
  it('should reject impossible dates (Feb 30)', () => {});
  it('should handle leap year dates', () => {});
  it('should reject dates in distant past/future', () => {});
});
```

### Auth Edge Cases

```typescript
describe('Auth Edge Cases', () => {
  it('should return 401 with no auth header', () => {});
  it('should return 401 with malformed header (no Bearer)', () => {});
  it('should return 401 with expired token', () => {});
  it('should return 401 with token signed by wrong secret', () => {});
  it('should return 404 (not 403) when accessing other users resource', () => {});
});
```

### Pagination Edge Cases

```typescript
describe('Pagination Edge Cases', () => {
  it('should return empty array for page beyond total', () => {});
  it('should default to page 1 if page is 0 or negative', () => {});
  it('should cap limit at maximum (e.g., 100)', () => {});
  it('should return correct total regardless of page/limit', () => {});
  it('should work correctly with 0 total items', () => {});
  it('should work correctly with exactly 1 page of items', () => {});
});
```

---

## Coverage Requirements

| Layer | Minimum | Target |
|-------|---------|--------|
| Domain (entities, value objects) | 90% | 100% |
| Application (use cases, services) | 80% | 90% |
| Infrastructure (controllers, repos) | 70% | 80% |
| Overall | 80% | 85% |

### Coverage Configuration

```json
// jest.config.ts or package.json
{
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/**/types/**",
    "!src/**/interfaces/**"
  ],
  "coverageThresholds": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "src/domain/": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    }
  }
}
```

---

## CI/CD Integration

### Test Script Configuration

```json
// package.json
{
  "scripts": {
    "test": "jest --forceExit --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --forceExit --detectOpenHandles",
    "test:ci": "jest --ci --coverage --forceExit --detectOpenHandles --reporters=default --reporters=jest-junit",
    "test:unit": "jest --testPathPattern='unit' --forceExit",
    "test:integration": "jest --testPathPattern='integration' --forceExit --detectOpenHandles",
    "test:e2e": "jest --testPathPattern='e2e' --forceExit --detectOpenHandles"
  }
}
```

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:ci
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/
```

---

## Test Organization

### File Naming & Location

```
tests/
├── unit/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── task.entity.test.ts
│   │   └── value-objects/
│   │       └── email.vo.test.ts
│   └── application/
│       └── use-cases/
│           ├── create-task.test.ts
│           └── list-tasks.test.ts
├── integration/
│   ├── api/
│   │   ├── auth.test.ts
│   │   └── tasks.test.ts
│   └── repositories/
│       └── task.repository.test.ts
├── e2e/
│   └── task-workflow.test.ts
├── factories/
│   ├── user.factory.ts
│   └── task.factory.ts
└── helpers/
    ├── test-app.ts
    ├── test-db.ts
    └── auth.helper.ts
```

### Naming Convention

```typescript
// File: task.entity.test.ts
// Pattern: [unit-under-test].[test-type].test.ts

describe('Task Entity', () => {
  describe('create()', () => {
    it('should create task with valid input', () => {});
    it('should reject empty title', () => {});
    it('should trim whitespace from title', () => {});
  });

  describe('complete()', () => {
    it('should change status to DONE', () => {});
    it('should throw when already completed', () => {});
    it('should increment version', () => {});
  });
});
```

---

## Common Testing Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Testing implementation details | Tests break on refactor | Test behavior (inputs → outputs) |
| Shared mutable state between tests | Flaky, order-dependent | Fresh setup in `beforeEach` |
| Testing external services in unit tests | Slow, flaky, requires network | Mock external dependencies |
| No negative test cases | Only testing happy path | Test failures, edge cases, auth failures |
| Snapshot tests for everything | Tests pass but nobody reviews | Snapshots for UI, assertions for logic |
| console.log in tests | Noisy output, not assertions | Use proper assertions |
| Ignoring async errors | Tests pass but promises rejected | Always `await` and assert rejections |
