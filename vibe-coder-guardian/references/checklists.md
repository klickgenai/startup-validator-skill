# Vibe Coder Guardian — Enterprise Checklists

Read this file during PLAN (feature clash, architecture), VERIFY (regression, security, performance, architecture), and before deployment (pre-deploy). These are the checklists the agent runs on every interaction.

---

## Feature Clash Checklist

Run this BEFORE adding any new feature.

- [ ] **Shared state:** Does new feature read/write state other features also use?
  - If YES: How do you prevent race conditions and stale reads?
  - If YES: What if both features update the same state simultaneously?
- [ ] **Shared UI space:** Layout collisions, z-index conflicts, mobile breakage?
  - If YES: Does it break layout on mobile?
  - If YES: Do CSS class names or z-index values collide?
- [ ] **Shared API endpoints:** Request/response shapes still match?
  - If YES: Could increased load from the new feature degrade the existing one?
- [ ] **Shared database tables:** Migration breaks existing queries?
  - If YES: Do NULL defaults make sense for existing rows?
- [ ] **Event listeners / hooks:** Execution order conflicts?
  - If YES: Could they fire simultaneously? Is order guaranteed?
- [ ] **Route conflicts:** URL collisions with existing routes?
  - If YES: `/user/:id` vs `/user/settings` — does routing resolve correctly?
- [ ] **Background jobs:** Overlap with existing scheduled tasks?
  - If YES: What happens if the same job runs twice simultaneously?
- [ ] **Third-party integrations:** Rate limits, auth token conflicts?
  - If YES: Are we staying within rate limits? Refreshing tokens safely?

**If any box is YES: address it explicitly before writing code.**

---

## Architecture Review Checklist

Run this during ARCHITECT phase and during VERIFY.

### Dependency Direction
- [ ] Domain layer has ZERO imports from application or infrastructure
- [ ] Application layer imports from domain only (no infrastructure imports)
- [ ] Infrastructure depends on domain and application (implements interfaces defined there)
- [ ] No circular dependencies between modules
- [ ] Controllers contain ZERO business logic (only: parse request → call service → send response)

### Separation of Concerns
- [ ] Each service/use case has a single, clear responsibility
- [ ] Business rules live in domain entities, not in services or controllers
- [ ] Data access is behind repository interfaces
- [ ] Validation happens at system boundaries (middleware), not scattered through business logic
- [ ] Cross-cutting concerns (logging, notifications, analytics) use events, not direct calls

### Interface Design
- [ ] Services depend on interfaces, not concrete implementations
- [ ] Repository interfaces are defined in domain layer, implementations in infrastructure
- [ ] External service interfaces are defined in application layer
- [ ] Every dependency is injectable (constructor injection)

### Module Boundaries
- [ ] New feature doesn't require modifying more than 3 existing files (if it does, review boundaries)
- [ ] Adding this feature doesn't create coupling between previously independent modules
- [ ] If bounded contexts exist, communication between them is event-based only

---

## New Endpoint Checklist

- [ ] Input validation with Zod schema (not hand-written validators)
- [ ] Authentication middleware applied
- [ ] Authorization check (user owns resource, return 404 not 403)
- [ ] Error handling with typed error classes and appropriate status codes
- [ ] Rate limiting applied (auth: 10/15min, general: 100/15min)
- [ ] Response shape consistent with other endpoints (uses response helper)
- [ ] Paginated if returning a list (with full metadata: page, limit, total, totalPages, hasNextPage, hasPrevPage)
- [ ] SQL uses parameterized queries
- [ ] Logged with structured logger (pino), correlation ID attached, no sensitive data
- [ ] Audit event emitted for mutations (CREATE, UPDATE, DELETE)
- [ ] Return UUIDs, not auto-increment IDs
- [ ] TypeScript types defined for request and response shapes
- [ ] Tested: happy path + auth failure + invalid input + not found + ownership violation + rate limit

---

## New Database Table Checklist

- [ ] Primary key defined (UUID if exposed in URLs)
- [ ] Foreign keys with ON DELETE behavior (CASCADE, SET NULL, or RESTRICT)
- [ ] NOT NULL on required columns
- [ ] UNIQUE on naturally unique columns (email, slug)
- [ ] CHECK constraints on bounded values (status, priority, amounts >= 0)
- [ ] Indexes on columns used in WHERE / JOIN / ORDER BY
- [ ] `created_at` and `updated_at` timestamps
- [ ] `version` column if entity supports concurrent editing (optimistic locking)
- [ ] Migration is reversible (up AND down)
- [ ] Default values for existing rows if adding column to existing table
- [ ] No sensitive data stored in plain text (passwords hashed, PII encrypted if required)

---

## New UI Component Checklist

- [ ] Loading state handled (spinner / skeleton)
- [ ] Error state handled (message + retry button)
- [ ] Empty state handled ("no items yet")
- [ ] Mobile responsive (375px, 768px, 1280px)
- [ ] Long text doesn't overflow containers
- [ ] Keyboard navigation works (Enter to submit, Escape to close)
- [ ] Double-click protection on submit buttons
- [ ] Meaningful error messages from API failures
- [ ] Doesn't crash if a prop is null / undefined
- [ ] Accessible: form labels, alt text, focus management

---

## New Feature Checklist (Full Pipeline)

- [ ] Read all related existing code first (UNDERSTAND)
- [ ] Mapped the blast radius (what could break?)
- [ ] Architecture review passed (dependency direction, separation, interfaces)
- [ ] Feature clash detection completed
- [ ] Follows existing codebase patterns
- [ ] Interface/contract defined before implementation
- [ ] Input validation at the boundary (Zod/Joi schema)
- [ ] Typed error handling on all external calls
- [ ] Consistent API response shapes (uses response helper)
- [ ] Existing tests still pass
- [ ] New tests written (unit + integration, minimum happy path + 2 failure cases)
- [ ] Coverage meets threshold (80% minimum)
- [ ] Security quick-scan completed
- [ ] Performance quick-check completed
- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
- [ ] Explained to user what was built, architecture decisions made, and what to test

---

## Regression Quick-Check

Run AFTER every change.

- [ ] The new feature works as described
- [ ] Modified page/component still renders correctly
- [ ] Other features sharing same data/state still work
- [ ] Navigation to/from modified pages works
- [ ] Loading state works
- [ ] Error state works
- [ ] Empty state works
- [ ] Form validation still works on modified forms
- [ ] Mobile layout not broken
- [ ] No new console errors or warnings
- [ ] All existing tests still pass

---

## Security Quick-Scan

Run AFTER every change.

- [ ] No hardcoded secrets in code (grep for `password`, `secret`, `api_key`, `token`)
- [ ] No sensitive data in logs (pino redaction configured for password, token, authorization, cookie)
- [ ] No `console.log` — use structured logger (pino)
- [ ] Every new endpoint checks authentication (middleware)
- [ ] Every new endpoint checks authorization (user owns resource, returns 404 not 403)
- [ ] All user input validated with Zod schemas (not hand-written validators)
- [ ] Database queries use parameterized statements (no string interpolation)
- [ ] File uploads check type, size, and content
- [ ] No open redirects (whitelist redirect targets)
- [ ] Error messages don't expose internals (stack traces, SQL errors, file paths)
- [ ] CORS not accidentally opened to "*" in production
- [ ] All 7 security headers present (X-Content-Type-Options, X-Frame-Options, HSTS, X-XSS-Protection, Referrer-Policy, Permissions-Policy, no X-Powered-By)
- [ ] Rate limiting active on auth endpoints (10 req/15min) and general API (100 req/15min)
- [ ] JWT secret is env-only, validated at startup with Zod (min 32 chars)
- [ ] Audit trail logs all mutations (CREATE, UPDATE, DELETE) with userId and correlationId

---

## Observability Quick-Check

Run AFTER every change. This compensates for the happy-path bias — observability is invisible when code works.

- [ ] **No console.log** — all logging through structured logger (pino)
- [ ] Logger configured with JSON output in production, pretty-print in dev
- [ ] Sensitive fields redacted (pino `redact` option: password, token, authorization, cookie, *.password, *.token)
- [ ] Correlation ID middleware present — every request gets a unique ID
- [ ] Request logging includes: method, URL, status code, duration (ms), correlationId
- [ ] Error handler logs full error + stack server-side, returns safe message to client
- [ ] Health check endpoint exists at `/api/health` with dependency status:
  - Database: connection status + latency
  - External services: status (if applicable)
  - Uptime: `process.uptime()`
- [ ] Graceful shutdown handles SIGTERM/SIGINT, closes DB connections, flushes logs
- [ ] Log levels configured per environment (debug in dev, info in production)

---

## Performance Quick-Check

Run AFTER every change that touches data or APIs.

- [ ] Every list query is paginated (LIMIT + OFFSET or cursor)
- [ ] Database indexes on columns in WHERE / JOIN / ORDER BY
- [ ] No N+1 query patterns (loading related entities in a loop)
- [ ] No unbounded `SELECT *` queries
- [ ] Large files are streamed, not loaded into memory
- [ ] Connection pooling configured for database
- [ ] No O(n²) loops over data sets
- [ ] Background jobs for long-running operations (> 2 seconds)
- [ ] Hot paths are cacheable (read 10x more than written)
- [ ] Response payloads are reasonably sized (no sending 1MB JSON for a list)

---

## Code Review Checklist

Run this as a self-review before presenting code to the user.

### Correctness
- [ ] Code does what the requirements describe
- [ ] Edge cases handled (empty, null, boundary values, concurrent)
- [ ] Error paths handled (not just happy path)
- [ ] Types are correct and strict (no `any`, no type assertions without validation)

### Readability
- [ ] Functions are < 40 lines (if longer, consider extracting)
- [ ] Variable names describe their purpose (not `x`, `temp`, `data`)
- [ ] No nested ternaries or deeply nested conditionals (> 3 levels)
- [ ] Comments explain WHY, not WHAT (code should explain what)
- [ ] Consistent naming conventions (camelCase for functions, PascalCase for classes/types)

### Architecture
- [ ] New code follows existing project patterns
- [ ] No new dependencies added without justification
- [ ] No architecture violations (see Architecture Review Checklist)
- [ ] No technical debt introduced without flagging it

### Testing
- [ ] Tests cover the new code
- [ ] Tests are readable (good names, AAA pattern)
- [ ] Tests don't test implementation details
- [ ] No flaky tests (timing-dependent, order-dependent)

---

## Pre-Deploy Checklist

- [ ] All tests pass (unit + integration + e2e)
- [ ] Test coverage meets thresholds (80% global, 90% domain)
- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
- [ ] ESLint passes with zero errors (no `any` in codebase)
- [ ] No hardcoded secrets in code
- [ ] Environment variables documented in `.env.example` and validated with Zod at startup
- [ ] Database migrations tested (up AND down)
- [ ] No debug statements left in code (`console.log`, `debugger`, `TODO`)
- [ ] All 7 security headers present
- [ ] Rate limiting active on auth endpoints (10/15min) and general API (100/15min)
- [ ] Health check endpoint exists and returns dependency status (DB latency, uptime)
- [ ] Structured logging configured (pino, JSON format, log levels, redaction for PII/secrets)
- [ ] Correlation ID middleware present on all requests
- [ ] Audit trail logging all mutations
- [ ] Graceful shutdown handles SIGTERM/SIGINT, closes DB, flushes logs
- [ ] Docker image builds successfully (multi-stage, non-root user, HEALTHCHECK)
- [ ] CI/CD pipeline passes all stages (lint → typecheck → test → security → build)
- [ ] Rollback plan documented (previous version available, migrations reversible)

---

## Scaling Sanity Check

- [ ] Every list query is paginated (LIMIT + OFFSET or cursor)
- [ ] Database indexes on columns in WHERE / JOIN / ORDER BY
- [ ] No N+1 query patterns
- [ ] No unbounded SELECT * queries
- [ ] Large files are streamed, not loaded into memory
- [ ] Connection pooling configured for database
- [ ] No O(n²) loops over data sets
- [ ] Background jobs for long-running operations (> 5 seconds)
- [ ] Cache strategy for read-heavy data
- [ ] Queue strategy for async operations (email, notifications, exports)

---

## Incident Response Checklist

When something breaks in production:

### Immediate (0-5 minutes)
- [ ] Acknowledge the incident
- [ ] Check health endpoint — is the service up?
- [ ] Check logs for errors (filter by error level, last 15 minutes)
- [ ] Check recent deploys — was anything deployed in the last hour?

### Diagnose (5-15 minutes)
- [ ] Identify the failing component (API, database, external service, infrastructure)
- [ ] Check error rates — is this affecting all users or a subset?
- [ ] Check database connections — pool exhaustion? Slow queries?
- [ ] Check external services — are dependencies healthy?

### Mitigate (15-30 minutes)
- [ ] If recent deploy caused it: ROLLBACK to previous version
- [ ] If external service is down: activate degraded mode / fallback
- [ ] If database issue: check connections, restart if needed, investigate slow queries
- [ ] Communicate status to affected users if applicable

### Post-Incident
- [ ] Write brief incident report (what happened, when, impact, resolution)
- [ ] Identify root cause
- [ ] Create task to prevent recurrence
- [ ] Update monitoring / alerting to catch this earlier next time
