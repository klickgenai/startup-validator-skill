# Architecture Patterns — Enterprise Reference

Read this file during Phase 2 (ARCHITECT) when making architecture decisions. Each pattern includes when to use it, the folder structure, dependency rules, and code examples.

---

## Choosing the Right Architecture

| Project Scale | Pattern | When to Use |
|--------------|---------|-------------|
| **Hobby / Prototype** | 3-Layer (Controller → Service → Repository) | < 5 entities, 1 developer, shipping fast |
| **Startup MVP** | Clean Architecture (Domain / Application / Infrastructure) | 5-20 entities, 1-3 developers, needs to evolve |
| **Enterprise** | Domain-Driven Design + Clean Architecture | 20+ entities, 3+ developers, multiple bounded contexts |

**Default to Clean Architecture** unless you have a strong reason not to. It scales down to small projects without overhead and scales up to enterprise without rewriting.

---

## Pattern 1: 3-Layer Architecture

### When to Use
- Quick MVPs, internal tools, single-developer projects
- < 5 database tables, no complex business logic
- You need to ship in days, not weeks

### Folder Structure

```
src/
├── controllers/          # HTTP handlers — parse request, call service, send response
│   ├── auth.controller.ts
│   └── task.controller.ts
├── services/             # Business logic — orchestration, rules, validation
│   ├── auth.service.ts
│   └── task.service.ts
├── repositories/         # Data access — SQL, ORM, external APIs
│   ├── user.repository.ts
│   └── task.repository.ts
├── middleware/            # Express/framework middleware
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   └── error.middleware.ts
├── types/                # Shared TypeScript types
│   ├── auth.types.ts
│   └── task.types.ts
├── utils/                # Pure utility functions
│   └── response.ts
├── config/               # Environment, database, external service config
│   ├── env.ts
│   └── database.ts
├── app.ts                # Express app factory (no server.listen)
└── index.ts              # Server entry point (server.listen)
```

### Dependency Rule

```
Controller → Service → Repository → Database
     ↓           ↓           ↓
   Types       Types       Types
```

Controllers never import repositories. Repositories never import services. No circular dependencies.

### Example

```typescript
// types/task.types.ts
export interface Task {
  id: string;
  userId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: Task['status'];
}

// repositories/task.repository.ts
export class TaskRepository {
  constructor(private db: Database) {}

  async findByUserId(userId: string, page: number, limit: number): Promise<{ tasks: Task[]; total: number }> {
    // Parameterized query, paginated, specific columns
  }

  async create(userId: string, input: CreateTaskInput): Promise<Task> {
    // Insert with UUID, timestamps
  }
}

// services/task.service.ts
export class TaskService {
  constructor(private taskRepo: TaskRepository) {}

  async listTasks(userId: string, page: number, limit: number) {
    return this.taskRepo.findByUserId(userId, page, limit);
  }

  async createTask(userId: string, input: CreateTaskInput) {
    // Business validation, then delegate to repository
    return this.taskRepo.create(userId, input);
  }
}

// controllers/task.controller.ts
export class TaskController {
  constructor(private taskService: TaskService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await this.taskService.listTasks(req.userId, Number(page), Number(limit));
      sendSuccess(res, result.tasks, { pagination: { page, limit, total: result.total } });
    } catch (err) {
      next(err);
    }
  };
}
```

---

## Pattern 2: Clean Architecture

### When to Use
- Projects that will grow beyond MVP
- Multiple developers will work on this
- Business logic is non-trivial
- You'll need to swap infrastructure (e.g., SQLite → PostgreSQL, REST → GraphQL)

### Folder Structure

```
src/
├── domain/                    # INNER LAYER — Zero external dependencies
│   ├── entities/              # Business objects with behavior
│   │   ├── user.entity.ts
│   │   └── task.entity.ts
│   ├── value-objects/         # Immutable typed values
│   │   ├── email.vo.ts
│   │   ├── task-status.vo.ts
│   │   └── money.vo.ts
│   ├── errors/                # Domain-specific error types
│   │   ├── base.error.ts
│   │   ├── not-found.error.ts
│   │   ├── unauthorized.error.ts
│   │   └── validation.error.ts
│   ├── events/                # Domain events
│   │   ├── task-created.event.ts
│   │   └── user-registered.event.ts
│   └── repositories/         # Repository INTERFACES (not implementations)
│       ├── user.repository.ts
│       └── task.repository.ts
│
├── application/               # MIDDLE LAYER — Orchestrates domain, depends on domain only
│   ├── use-cases/             # One class per use case
│   │   ├── create-task.use-case.ts
│   │   ├── list-tasks.use-case.ts
│   │   ├── register-user.use-case.ts
│   │   └── login-user.use-case.ts
│   ├── services/              # Shared application services
│   │   └── auth.service.ts
│   ├── dtos/                  # Data Transfer Objects (input/output shapes)
│   │   ├── create-task.dto.ts
│   │   └── task-response.dto.ts
│   └── interfaces/            # Port interfaces for infrastructure
│       ├── hasher.interface.ts
│       ├── token.interface.ts
│       ├── event-bus.interface.ts
│       └── cache.interface.ts
│
├── infrastructure/            # OUTER LAYER — Implements interfaces, talks to external world
│   ├── database/
│   │   ├── connection.ts
│   │   ├── migrations/
│   │   │   └── 001_initial.ts
│   │   └── repositories/     # Repository IMPLEMENTATIONS
│   │       ├── sqlite-user.repository.ts
│   │       └── sqlite-task.repository.ts
│   ├── auth/
│   │   ├── bcrypt-hasher.ts        # Implements HasherInterface
│   │   └── jwt-token.service.ts    # Implements TokenInterface
│   ├── cache/
│   │   └── redis-cache.ts          # Implements CacheInterface
│   ├── events/
│   │   └── in-memory-event-bus.ts  # Implements EventBusInterface
│   ├── http/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   └── task.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── validators/
│   │   │   ├── auth.validators.ts
│   │   │   └── task.validators.ts
│   │   └── routes/
│   │       ├── auth.routes.ts
│   │       └── task.routes.ts
│   └── config/
│       └── env.ts
│
├── container.ts               # Dependency Injection container — wires everything together
├── app.ts                     # Express app factory
└── index.ts                   # Entry point
```

### The Dependency Rule

```
┌──────────────────────────────┐
│      Infrastructure          │  ← Depends on Application + Domain
│  (DB, HTTP, External APIs)   │
├──────────────────────────────┤
│       Application            │  ← Depends on Domain ONLY
│  (Use Cases, Services)       │
├──────────────────────────────┤
│         Domain               │  ← Depends on NOTHING external
│  (Entities, Value Objects)   │
└──────────────────────────────┘

RULE: Dependencies point INWARD only. Inner layers never import from outer layers.
Domain has ZERO imports from application or infrastructure.
Application imports from domain only.
Infrastructure imports from both application and domain.
```

### Key Concept: Dependency Inversion

The domain defines the INTERFACE for a repository. Infrastructure provides the IMPLEMENTATION.

```typescript
// domain/repositories/task.repository.ts (INTERFACE — in domain layer)
export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByUserId(userId: string, options: PaginationOptions): Promise<PaginatedResult<Task>>;
  create(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
}

// infrastructure/database/repositories/sqlite-task.repository.ts (IMPLEMENTATION — in infra layer)
export class SqliteTaskRepository implements ITaskRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Task | null> {
    const row = this.db.prepare('SELECT id, user_id, title, status, created_at, updated_at FROM tasks WHERE id = ?').get(id);
    return row ? this.toDomain(row) : null;
  }

  // ... other methods
}
```

This means you can swap SQLite for PostgreSQL by writing a new `PostgresTaskRepository` that implements the same interface — without touching domain or application code.

### Use Case Pattern

```typescript
// application/use-cases/create-task.use-case.ts
export class CreateTaskUseCase {
  constructor(
    private taskRepo: ITaskRepository,
    private eventBus: IEventBus,
  ) {}

  async execute(input: CreateTaskInput): Promise<TaskResponseDto> {
    // 1. Create domain entity (validates business rules internally)
    const task = Task.create({
      userId: input.userId,
      title: input.title,
      description: input.description,
      status: TaskStatus.TODO,
    });

    // 2. Persist through repository interface
    const saved = await this.taskRepo.create(task);

    // 3. Emit domain event (decoupled from side effects)
    await this.eventBus.publish(new TaskCreatedEvent(saved));

    // 4. Return DTO (not domain entity)
    return TaskResponseDto.fromEntity(saved);
  }
}
```

### Domain Entity with Business Rules

```typescript
// domain/entities/task.entity.ts
export class Task {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    private _title: string,
    private _status: TaskStatus,
    private _description: string | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _version: number,
  ) {}

  // Factory method — validates on creation
  static create(input: { userId: string; title: string; description?: string; status: TaskStatus }): Task {
    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError('Task title cannot be empty');
    }
    if (input.title.length > 255) {
      throw new ValidationError('Task title must be 255 characters or less');
    }

    return new Task(
      generateUUID(),
      input.userId,
      input.title.trim(),
      input.status,
      input.description?.trim() ?? null,
      new Date(),
      new Date(),
      1,
    );
  }

  // Business method — enforces rules
  complete(): void {
    if (this._status === TaskStatus.DONE) {
      throw new ValidationError('Task is already completed');
    }
    this._status = TaskStatus.DONE;
    this._updatedAt = new Date();
    this._version++;
  }

  get title(): string { return this._title; }
  get status(): TaskStatus { return this._status; }
  get version(): number { return this._version; }
}
```

### Value Objects

```typescript
// domain/value-objects/email.vo.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(input: string): Email {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || trimmed.length > 254) {
      throw new ValidationError('Invalid email length');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new ValidationError('Invalid email format');
    }
    return new Email(trimmed);
  }

  toString(): string { return this.value; }
  equals(other: Email): boolean { return this.value === other.value; }
}
```

### Dependency Injection Container

```typescript
// container.ts — Wires everything together. Called ONCE at startup.
export function createContainer(config: AppConfig) {
  // Infrastructure
  const db = createDatabase(config.databaseUrl);
  const hasher = new BcryptHasher(12);
  const tokenService = new JwtTokenService(config.jwtSecret, config.jwtExpiry);
  const eventBus = new InMemoryEventBus();
  const cache = config.redisUrl ? new RedisCache(config.redisUrl) : new InMemoryCache();

  // Repositories (implementations)
  const userRepo = new SqliteUserRepository(db);
  const taskRepo = new SqliteTaskRepository(db);

  // Use Cases (injected with interfaces)
  const registerUser = new RegisterUserUseCase(userRepo, hasher, tokenService, eventBus);
  const loginUser = new LoginUserUseCase(userRepo, hasher, tokenService);
  const createTask = new CreateTaskUseCase(taskRepo, eventBus);
  const listTasks = new ListTasksUseCase(taskRepo);

  // Controllers (injected with use cases)
  const authController = new AuthController(registerUser, loginUser);
  const taskController = new TaskController(createTask, listTasks);

  // Middleware
  const authMiddleware = new AuthMiddleware(tokenService, userRepo);

  return { authController, taskController, authMiddleware, db, eventBus };
}
```

---

## Pattern 3: Domain-Driven Design (Enterprise)

### When to Use
- Large systems with multiple bounded contexts
- Multiple teams working on different parts
- Complex business rules that change frequently
- The business domain IS the competitive advantage

### Additional Concepts on Top of Clean Architecture

**Bounded Contexts** — Each major domain area gets its own module with its own entities, repositories, and use cases. They communicate through events, not direct imports.

```
src/
├── modules/
│   ├── identity/              # Bounded Context: User identity & auth
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── task-management/       # Bounded Context: Task CRUD & workflows
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── notifications/         # Bounded Context: Email, push, in-app
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   └── analytics/             # Bounded Context: Usage tracking & reporting
│       ├── domain/
│       ├── application/
│       └── infrastructure/
├── shared/                    # Shared kernel (minimal — types, base classes)
│   ├── domain/
│   │   ├── base.entity.ts
│   │   ├── base.event.ts
│   │   └── base.error.ts
│   └── infrastructure/
│       ├── event-bus.ts
│       └── logger.ts
├── container.ts
├── app.ts
└── index.ts
```

**Communication Between Contexts:**

```typescript
// task-management publishes event:
eventBus.publish(new TaskCompletedEvent({ taskId, userId, completedAt }));

// notifications subscribes to event (different context, no direct import):
eventBus.subscribe(TaskCompletedEvent, async (event) => {
  await notificationService.sendTaskCompletionEmail(event.userId, event.taskId);
});

// analytics subscribes to same event:
eventBus.subscribe(TaskCompletedEvent, async (event) => {
  await analyticsService.trackTaskCompletion(event.userId, event.completedAt);
});
```

**Rule:** Contexts NEVER import from each other's domain or application layers. Communication is event-based only.

---

## Dependency Injection Patterns

### Why DI Matters

Without DI, services create their own dependencies:
```typescript
// BAD — Service creates its own repository. Untestable. Unconfigurable.
class TaskService {
  private repo = new SqliteTaskRepository(new Database('./tasks.db'));
}
```

With DI, dependencies are passed in:
```typescript
// GOOD — Dependencies injected. Testable. Swappable.
class TaskService {
  constructor(private repo: ITaskRepository) {}
}

// In tests:
const mockRepo = { findById: jest.fn(), create: jest.fn() };
const service = new TaskService(mockRepo);

// In production:
const repo = new SqliteTaskRepository(db);
const service = new TaskService(repo);
```

### Simple DI (No Framework Needed)

For most projects, a simple `container.ts` file is sufficient. See the container example above. No DI framework needed unless you have 50+ services.

### When to Use a DI Framework

If the container becomes unwieldy (50+ services, complex lifecycles), use:
- **tsyringe** — Lightweight, decorator-based
- **inversify** — Full-featured, enterprise
- **awilix** — Auto-registration, no decorators

---

## Event-Driven Architecture

### When to Use Events

Use events when:
1. **Multiple things need to happen** after an action (send email + update analytics + invalidate cache)
2. **The side effects are not the caller's concern** (task service shouldn't know about email)
3. **Side effects can happen asynchronously** (user doesn't need to wait for the email to send)
4. **You want to add new reactions without modifying existing code** (open/closed principle)

### Simple In-Memory Event Bus

```typescript
// application/interfaces/event-bus.interface.ts
export interface IEventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  subscribe<T extends DomainEvent>(eventType: new (...args: any[]) => T, handler: (event: T) => Promise<void>): void;
}

// infrastructure/events/in-memory-event-bus.ts
export class InMemoryEventBus implements IEventBus {
  private handlers = new Map<string, Array<(event: any) => Promise<void>>>();

  subscribe<T extends DomainEvent>(eventType: new (...args: any[]) => T, handler: (event: T) => Promise<void>): void {
    const name = eventType.name;
    if (!this.handlers.has(name)) this.handlers.set(name, []);
    this.handlers.get(name)!.push(handler);
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.constructor.name) ?? [];
    await Promise.allSettled(handlers.map(h => h(event)));
  }
}
```

### When to Graduate to a Message Queue

Move to Redis/BullMQ/RabbitMQ when:
- Events need to survive server restarts
- Events need to be processed by different services
- You need guaranteed delivery (at-least-once)
- You need retry with backoff on failure
- Load is high enough that synchronous processing causes latency

---

## Caching Strategy

### What to Cache

| Cache If | Don't Cache If |
|----------|---------------|
| Read 10x more than written | Data changes every request |
| Expensive to compute | Cheap to compute |
| Stable data (configs, reference data) | User-specific sensitive data |
| External API responses (weather, exchange rates) | Real-time data (stock prices) |

### Cache Invalidation Strategies

| Strategy | When | Example |
|----------|------|---------|
| **TTL (Time-to-Live)** | Data is eventually consistent | Cache exchange rates for 5 minutes |
| **Write-Through** | Cache + DB updated together | Update user profile → update cache + DB |
| **Cache-Aside (Lazy)** | Read-heavy, write-infrequent | Check cache → miss → read DB → store in cache |
| **Event-Driven** | Precise invalidation needed | TaskUpdated event → invalidate task cache |

### Implementation

```typescript
// application/interfaces/cache.interface.ts
export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}

// In use case:
class ListTasksUseCase {
  constructor(private taskRepo: ITaskRepository, private cache: ICache) {}

  async execute(userId: string, page: number): Promise<PaginatedResult<Task>> {
    const cacheKey = `tasks:${userId}:page:${page}`;
    const cached = await this.cache.get<PaginatedResult<Task>>(cacheKey);
    if (cached) return cached;

    const result = await this.taskRepo.findByUserId(userId, { page, limit: 20 });
    await this.cache.set(cacheKey, result, 300); // 5 min TTL
    return result;
  }
}
```

---

## Queue / Background Job Patterns

### When to Use Queues

| Queue It If | Don't Queue If |
|-------------|---------------|
| Takes > 2 seconds | User needs immediate result |
| Can fail independently | Failure means user's action should fail too |
| Needs retry with backoff | One-shot operation |
| High volume, needs rate limiting | Low volume, real-time needed |

### Common Queue Use Cases

- Sending emails / SMS / push notifications
- Processing file uploads (resize images, generate thumbnails)
- Generating reports / exports
- Syncing data to external services
- Scheduled tasks (daily cleanup, weekly reports)

### Implementation

```typescript
// application/interfaces/queue.interface.ts
export interface IJobQueue {
  enqueue<T>(jobType: string, payload: T, options?: JobOptions): Promise<string>;
}

export interface JobOptions {
  delay?: number;        // Delay before processing (ms)
  retries?: number;      // Max retry attempts
  backoff?: number;      // Backoff multiplier
  priority?: number;     // Higher = processed first
}

// In use case:
class RegisterUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private hasher: IHasher,
    private queue: IJobQueue,
  ) {}

  async execute(input: RegisterInput): Promise<User> {
    const user = await this.createUser(input);

    // Don't make user wait for email. Queue it.
    await this.queue.enqueue('send-welcome-email', {
      userId: user.id,
      email: user.email,
    }, { retries: 3, backoff: 2000 });

    return user;
  }
}
```

---

## Architecture Decision Records (ADRs)

Track WHY decisions were made so future developers (or future you) don't reverse good decisions.

### Template

```markdown
## ADR-001: Use Clean Architecture with Repository Pattern

**Date:** 2026-02-27
**Status:** Accepted
**Context:** Building a task management API that needs to be testable, maintainable, and potentially migrated from SQLite to PostgreSQL.
**Decision:** Use Clean Architecture with domain/application/infrastructure layers and repository interfaces.
**Consequences:**
- (+) Domain logic is testable without database
- (+) Can swap database without touching business logic
- (+) Clear boundaries prevent spaghetti
- (-) More files and boilerplate than a flat structure
- (-) Overkill if the project never grows beyond 3 endpoints
**Alternatives Considered:**
- 3-Layer (too simple for our needs)
- DDD with bounded contexts (overkill at current scale)
```

Record ADRs in the project's CLAUDE.md so they persist across sessions.

---

## Anti-Patterns to Catch

| Anti-Pattern | Symptom | Fix |
|-------------|---------|-----|
| **God Service** | One service with 20+ methods | Split by use case or subdomain |
| **Anemic Domain** | Entities are just data bags, all logic in services | Move business rules into entities |
| **Circular Dependencies** | Module A imports B, B imports A | Extract shared types, use events |
| **Leaky Abstraction** | Database-specific types in domain layer | Use domain types, map at boundary |
| **Smart Controller** | Controller has business logic, validation, DB calls | Controller should only parse request → call service → send response |
| **Shotgun Surgery** | Adding one feature requires changing 10+ files | Review boundaries, consolidate related code |
| **Missing Interface** | Service directly depends on concrete repository | Define interface in domain, implement in infrastructure |
