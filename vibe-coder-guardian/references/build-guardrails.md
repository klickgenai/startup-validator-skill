# Build Guardrails — Detailed Patterns & Examples

Read this file during Phase 4 (BUILD) when you need detailed guidance on a specific guardrail. Each section corresponds to a non-negotiable rule from the core SKILL.md.

---

## 1. TypeScript Strict Mode

**`strict: true` in tsconfig from line 1. No `any` except at system boundaries with runtime validation.**

### Why TypeScript is Non-Negotiable

- Types ARE documentation — they tell the next developer what this function expects and returns
- Types catch bugs at compile time — cheaper than catching them in production
- Types enable IDE support — autocomplete, refactoring, navigation
- Types enforce contracts — interfaces between layers prevent drift

### Rules

1. **`strict: true` always.** This enables `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, and more.
2. **No `any`.** Use `unknown` at system boundaries and validate at runtime.
3. **Typed errors.** Don't throw generic `Error`. Create typed error classes.
4. **Typed API responses.** Define response types for every endpoint.
5. **Typed environment.** Validate env vars with Zod and export typed config.

### Patterns

```typescript
// BAD — any everywhere
function processData(data: any): any {
  return data.items.map((item: any) => item.name);
}

// GOOD — typed with safety
interface DataPayload {
  items: Array<{ name: string; value: number }>;
}

function processData(data: DataPayload): string[] {
  return data.items.map(item => item.name);
}

// GOOD — unknown at system boundary with validation
function handleWebhook(payload: unknown): ProcessedWebhook {
  const parsed = webhookSchema.parse(payload); // Zod validates at runtime
  return transformWebhook(parsed); // Now it's typed
}
```

### Typed Error Classes

```typescript
// domain/errors/base.error.ts
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// domain/errors/not-found.error.ts
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`);
  }
}

// domain/errors/validation.error.ts
export class ValidationError extends AppError {
  readonly statusCode = 422;
  readonly code = 'VALIDATION_ERROR';
  readonly fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.fields = fields;
  }
}

// domain/errors/unauthorized.error.ts
export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'UNAUTHORIZED';

  constructor(message = 'Authentication required') {
    super(message);
  }
}

// domain/errors/forbidden.error.ts
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN';

  constructor(message = 'You do not have permission to perform this action') {
    super(message);
  }
}

// domain/errors/conflict.error.ts
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';

  constructor(message: string) {
    super(message);
  }
}
```

---

## 2. Input Validation

**Validate ALL external input at the system boundary.** External input means:
- API request bodies, query params, URL params
- Form submissions
- File uploads
- Webhook payloads
- URL fragments or hash params
- Data from localStorage/cookies/sessionStorage that users could tamper with

**For every input field, check:**

| Check | Why | Example |
|-------|-----|---------|
| **Type** | Prevent type confusion | Is `price` a number, not a string "abc"? |
| **Required** | Prevent null/undefined crashes | Is `email` actually provided? |
| **Length / Size** | Prevent overflow and abuse | Is `username` 3-50 chars? Is file < 10MB? |
| **Format** | Prevent malformed data | Does `email` match format? Is `date` valid ISO? |
| **Range** | Prevent logical errors | Is `quantity` 1-999? Is `age` 0-150? |
| **Allowed values** | Prevent injection | Is `role` one of ["user", "admin"]? |
| **Sanitization** | Prevent XSS/injection | Strip HTML tags from user text before rendering |

### Use a Validation Library

Don't write validation by hand. Use Zod (recommended), Joi, or class-validator.

```typescript
// validators/task.validators.ts
import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less'),
  description: z.string()
    .trim()
    .max(5000, 'Description must be 5000 characters or less')
    .optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .refine(val => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && val === date.toISOString().split('T')[0];
    }, 'Invalid date (e.g., Feb 30 does not exist)')
    .optional()
    .nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
```

### Validation Middleware

```typescript
// middleware/validate.middleware.ts
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError('Invalid input', formatZodErrors(err)));
      } else {
        next(err);
      }
    }
  };
}
```

**Dangerous patterns to catch:**

```
DANGEROUS: req.body.id used directly in SQL query
SAFE:      Parameterized query: WHERE id = $1

DANGEROUS: user input rendered as innerHTML
SAFE:      Rendered as textContent, or sanitized with DOMPurify

DANGEROUS: file upload with no type/size check
SAFE:      Check MIME type, file extension, and size before accepting

DANGEROUS: URL redirect using user-provided URL (open redirect)
SAFE:      Whitelist allowed redirect domains

DANGEROUS: eval() or new Function() with user input
SAFE:      Never eval user input. Parse with a proper parser.

DANGEROUS: User input in shell commands (command injection)
SAFE:      Parameterized command execution or avoid shell entirely
```

---

## 3. Error Handling

**Every external operation needs error handling:**
- Database queries
- API calls to third-party services
- File system operations
- Email/SMS sending
- Payment processing
- Authentication provider calls

### Rules

1. **Use typed error classes** (see TypeScript section above). Don't throw generic `Error`.

2. **Catch at the right level.** Don't wrap the entire function in one giant try-catch.

3. **Never swallow errors silently.**
   ```typescript
   // BAD
   try { doThing() } catch(e) { /* ignore */ }

   // GOOD
   try { doThing() } catch(e) {
     logger.error({ err: e, context: 'doThing' }, 'Operation failed');
     throw e;
   }
   ```

4. **Global error handler catches everything the specific handlers don't:**

   ```typescript
   // middleware/error.middleware.ts
   export function globalErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
     // Known operational errors
     if (err instanceof AppError) {
       req.log.warn({ err, code: err.code }, err.message);
       return sendError(res, err.message, err.statusCode, err.code);
     }

     // Zod validation errors
     if (err instanceof ZodError) {
       return sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR');
     }

     // Unknown errors — log full details, return generic message
     req.log.error({ err }, 'Unhandled error');
     return sendError(res, 'An unexpected error occurred', 500, 'INTERNAL_ERROR');
   }
   ```

5. **Handle specific error types from external services:**
   - Network timeout: retry with backoff (max 3)
   - 401 Unauthorized: redirect to login / refresh token
   - 404 Not Found: show "not found" UI, don't crash
   - 409 Conflict: "someone else updated this, refresh to see changes"
   - 429 Rate Limit: back off, show "please wait"
   - 500 Server Error: log full error server-side, generic message to user

6. **Handle partial failures:** If saving 5 items and item 3 fails — roll back all 5 (transaction) OR save the 4 that worked and report item 3's failure. Choose based on whether partial state is acceptable.

---

## 4. Authentication & Authorization

**Authentication** = "Who are you?" (login, session, token)
**Authorization** = "What are you allowed to do?" (permissions, roles, ownership)

**Authentication checklist:**
- Passwords hashed with bcrypt (cost >= 12) or argon2. NEVER MD5, SHA-1, SHA-256 for passwords.
- JWT tokens have an expiration time (not infinite)
- Refresh tokens stored securely (httpOnly cookie, not localStorage)
- Session invalidated on password change
- Failed login attempts rate-limited (prevent brute force)
- Password reset tokens single-use and expire within 1 hour
- OAuth flows validate the `state` parameter (prevent CSRF)

**Authorization checklist — on EVERY endpoint:**
- Is the user authenticated? (middleware check)
- Is the user authorized for this ACTION? (role check)
- Is the user authorized for this RESOURCE? (ownership check)

**The most common authorization bug:**
```
User A is logged in. They call GET /api/orders/42.
Order 42 belongs to User B.
If your API returns order 42 to User A — critical vulnerability.

ALWAYS: SELECT * FROM orders WHERE id = $1 AND user_id = $currentUserId
```

- Admin-only routes protected by role middleware, not just hidden UI
- API endpoints don't rely on "security through obscurity"
- Bulk operations check authorization for EACH item, not just the first

---

## 5. Database Integrity

**Schema rules:**
- Every table has a primary key
- Every foreign key has ON DELETE behavior (CASCADE, SET NULL, or RESTRICT)
- Required columns are NOT NULL
- Unique columns have UNIQUE constraints (email, username, slug)
- CHECK constraints for value ranges (price >= 0, status IN ('active','archived'))
- `created_at` and `updated_at` timestamps on every table
- UUIDs instead of auto-increment if IDs are exposed in URLs (prevents enumeration)
- `version` column for optimistic locking on frequently edited entities

**Query rules:**
- ALWAYS parameterized queries. No exceptions.
- Transactions for multi-step writes (if step 2 fails, step 1 rolls back)
- Handle NULL explicitly: `WHERE status != 'archived'` does NOT return NULL rows
- LIMIT on every SELECT, even internal queries
- Specific columns in SELECT, not `SELECT *`

**Migration rules:**
- Reversible (include both up AND down)
- Never modify an applied migration — create a new one
- Test with realistic data volumes
- Adding required column to existing table? Needs DEFAULT or nullable first, backfill, then make required
- Renaming a column? Add new, copy data, remove old (across multiple deploys)

---

## 6. Consistent API Responses

**Every endpoint returns one of two shapes:**

```typescript
// Success
{
  success: true,
  data: { ... },
  meta?: {
    pagination?: { page: number, limit: number, total: number, totalPages: number }
  }
}

// Error
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",  // Machine-readable
    message: "Title is required",  // Human-readable
    fields?: { title: "Required" }  // Per-field errors (optional)
  }
}
```

### Response Helper

```typescript
// utils/response.ts
export function sendSuccess<T>(res: Response, data: T, meta?: Record<string, unknown>, status = 200) {
  res.status(status).json({ success: true, data, ...(meta && { meta }) });
}

export function sendError(res: Response, message: string, status: number, code: string, fields?: Record<string, string>) {
  res.status(status).json({
    success: false,
    error: { code, message, ...(fields && { fields }) },
  });
}

export function sendPaginated<T>(res: Response, items: T[], total: number, page: number, limit: number) {
  sendSuccess(res, items, {
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
}
```

### HTTP Status Codes

| Status | When |
|--------|------|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST that creates a resource) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (malformed JSON, missing required fields) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (valid token, but no permission) |
| 404 | Not Found (resource doesn't exist OR user doesn't own it) |
| 409 | Conflict (duplicate email, optimistic locking version mismatch) |
| 422 | Unprocessable Entity (validation failed — valid JSON but invalid values) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error (something unexpected broke) |

---

## 7. Secrets & Sensitive Data

**Secrets management:**
- API keys, DB passwords, JWT secrets, OAuth secrets: env vars ONLY
- Never log secrets. Mask sensitive fields in config logs.
- Never include secrets in error messages or API responses
- Never pass secrets as URL query parameters (browser history + server logs)
- Rotate secrets if ever committed to git (history retains them)

**Personal data handling:**
- Identify PII: email, name, phone, address, IP, payment info
- Don't log PII — or redact/hash in logs
- Implement data deletion for account deletion requests
- Store payment info through a provider (Stripe) — never store card numbers yourself

---

## 8. Concurrency & Race Conditions

Race conditions are invisible during development, appear in production under load.

| Scenario | Problem | Fix |
|----------|---------|-----|
| Two users edit same document | Last write wins, changes lost | Optimistic locking (version check) |
| Double-click "Place Order" | Two orders created | Idempotency key on client |
| Two cron jobs same task | Duplicate processing | Distributed lock or claim mechanism |
| Concurrent counter increment | Lost updates | Atomic: `SET balance = balance - 100` |
| Two API calls updating same row | Inconsistent state | DB transactions |

### Optimistic Locking Pattern

```typescript
async updateTask(id: string, userId: string, input: UpdateTaskInput, expectedVersion: number): Promise<Task> {
  const result = db.prepare(`
    UPDATE tasks SET title = ?, status = ?, version = version + 1, updated_at = ?
    WHERE id = ? AND user_id = ? AND version = ?
  `).run(input.title, input.status, new Date().toISOString(), id, userId, expectedVersion);

  if (result.changes === 0) {
    throw new ConflictError('Task was modified by another request. Please refresh and try again.');
  }

  return this.findById(id);
}
```

---

## 9. Third-Party Integrations

Every external service will go down eventually.

- **Timeout every call** (5-10 seconds max)
- **Retry with exponential backoff** for transient failures (max 3)
- **Circuit breaker** for repeated failures (stop calling, return cached/fallback)
- **Cache responses** where possible (show cached data if service is down)
- **Design for degraded mode** (if email is down, queue and send later)
- **Store webhook payloads before processing** (replay if processing crashes)
- **Verify webhook signatures** (don't trust the source claim)
- **Pin API versions** in requests

---

## 10. Dependency Injection

**Services receive their dependencies, never import them directly.**

```typescript
// BAD — Service creates its own dependencies. Untestable.
class TaskService {
  private repo = new SqliteTaskRepository(new Database('./tasks.db'));
  private emailService = new SendGridEmailService('sg-api-key-12345');
}

// GOOD — Dependencies injected. Testable. Swappable.
class TaskService {
  constructor(
    private repo: ITaskRepository,
    private emailService: IEmailService,
  ) {}
}

// In tests: pass mocks
const service = new TaskService(mockRepo, mockEmailService);

// In production: pass real implementations
const service = new TaskService(sqliteRepo, sendGridService);
```

See `references/architecture-patterns.md` for the full DI container pattern.

---

## 11. Repository Pattern

**Business logic never touches the database directly. All data access through repository interfaces.**

```typescript
// domain/repositories/task.repository.ts (INTERFACE)
export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByUserId(userId: string, options: PaginationOptions): Promise<PaginatedResult<Task>>;
  create(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
}

// infrastructure/database/repositories/sqlite-task.repository.ts (IMPLEMENTATION)
export class SqliteTaskRepository implements ITaskRepository {
  constructor(private db: Database) {}
  // ... implements all methods with SQL
}
```

This means you can swap SQLite for PostgreSQL by writing a new implementation — without touching domain or application code.

---

## 12. Event-Driven for Cross-Cutting Concerns

**Logging, notifications, analytics, audit trails — use events, not direct calls.**

```typescript
// BAD — Task service knows about email, analytics, audit
class CreateTaskUseCase {
  async execute(input) {
    const task = await this.taskRepo.create(input);
    await this.emailService.sendNewTaskNotification(task);  // Coupling
    await this.analyticsService.trackTaskCreation(task);     // More coupling
    await this.auditService.logAction('task_created', task); // Even more coupling
    return task;
  }
}

// GOOD — Task service publishes event, other services subscribe
class CreateTaskUseCase {
  async execute(input) {
    const task = await this.taskRepo.create(input);
    await this.eventBus.publish(new TaskCreatedEvent(task)); // One line. Decoupled.
    return task;
  }
}

// Separately registered event handlers:
eventBus.subscribe(TaskCreatedEvent, async (event) => {
  await emailService.sendNewTaskNotification(event.task);
});
eventBus.subscribe(TaskCreatedEvent, async (event) => {
  await analyticsService.trackTaskCreation(event.task);
});
```

---

## 13. Configuration as Code

**Linting, formatting, TypeScript, test config, Docker, CI — all in the repo.**

Every project needs from commit one:

```
.eslintrc.json     # Linting rules
.prettierrc        # Formatting rules
tsconfig.json      # TypeScript config (strict: true)
jest.config.ts     # Test configuration
Dockerfile         # Container build
docker-compose.yml # Local dev stack
.github/workflows/ # CI/CD pipeline
.env.example       # Environment variable documentation
.gitignore         # What not to commit
.dockerignore      # What not to build into Docker image
```

See `references/devops-operations.md` for detailed templates.

---

## Frontend Resilience

### Layout & Responsiveness
- Test at mobile (375px), tablet (768px), and desktop (1280px)
- Never fixed pixel widths for containers with dynamic content
- Long text: `overflow-wrap: break-word`, `text-overflow: ellipsis`, or truncation
- Images: explicit width/height or aspect-ratio to prevent layout shift

### User Action Edge Cases

| Edge Case | What Happens | Fix |
|-----------|-------------|-----|
| Double-click submit | Duplicate data | Disable button on first click |
| Back button after submit | Form resubmits | POST-Redirect-GET pattern |
| Refresh during loading | State resets | Store state in URL/sessionStorage |
| Paste huge text | Field/API explodes | maxLength + server validation |
| Navigate away during upload | Orphaned file | beforeunload warning + server cleanup |
| Session expires mid-action | 401, lost work | Intercept 401, save draft, redirect to login |
| Slow network | Multiple clicks | Loading states, disable actions during requests |

### Data Display States — Handle ALL of These

- EMPTY: "No items yet" (not blank screen or broken layout)
- LOADING: Skeleton screens or spinners
- ERROR: "Couldn't load this. Try again." with retry button
- SINGLE vs PLURAL: "1 item" not "1 items"
- LARGE NUMBERS: Format with commas or abbreviate (1.2M)
- LONG STRINGS: Truncate with ellipsis, full on hover/click
- SPECIAL CHARACTERS: O'Brien, José, François, unicode — test with these
