# A/B Test Framework: Enterprise Software Quality Assessment

## Why This Framework Exists

The previous tests answered: "Does the skill produce better code?" That's the wrong question. The right question is: **"Does the skill produce software that an enterprise would accept?"**

A head-to-head comparison tells you who won. This framework tells you **whether either output meets production standards** — and exactly where the gaps are.

---

## The 10-Dimension Enterprise Fitness Score

Each dimension is scored 1-5 with specific, objective criteria. No vibes. Every score has evidence.

### Dimension 1: Architecture (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | Single file, no separation of concerns |
| 2 | Basic folder structure but logic mixed across layers |
| 3 | Clear layers (controller/service/repository) with mostly correct dependency direction |
| 4 | Clean Architecture with interfaces, dependency inversion, and domain isolation |
| 5 | DDD with bounded contexts, event-driven communication, no architecture violations |

**How to measure:**
- Count layer violations (domain importing infrastructure)
- Check for circular dependencies
- Verify dependency direction (inner layers never import outer)
- Check for god classes/services (> 10 methods = suspect)
- Check if business logic is in controllers (violation)

### Dimension 2: Type Safety (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No TypeScript, or TypeScript with `any` everywhere |
| 2 | TypeScript with loose settings, `any` used frequently |
| 3 | TypeScript strict mode, minimal `any`, basic types for functions |
| 4 | Strict mode, typed errors, typed API responses, interfaces between layers |
| 5 | Full type coverage: value objects, branded types, discriminated unions, Zod schemas at boundaries |

**How to measure:**
- Check `tsconfig.json` for `strict: true`
- Count `any` occurrences (0 = 5, 1-5 = 4, 6-15 = 3, 16+ = 2, no TS = 1)
- Check if error types are defined or generic `Error` is thrown
- Check if API request/response types exist
- Check if repository interfaces exist in domain layer

### Dimension 3: Testing (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | Zero tests |
| 2 | A few happy-path tests, no failure cases |
| 3 | Unit tests for business logic + integration tests for API endpoints |
| 4 | Testing pyramid: unit + integration + edge cases + auth/ownership tests + factories |
| 5 | Full pyramid + coverage thresholds + CI integration + test for every failure mode |

**How to measure:**
- Count test files and test cases
- Check test types: unit only vs unit + integration
- Check for auth failure tests (no token, wrong token, other user's resource)
- Check for validation failure tests (missing fields, invalid types, boundary values)
- Check for edge case tests (empty, null, boundary, concurrent)
- Check for test factories/builders (vs repeated inline setup)
- Check for coverage configuration and thresholds
- Calculate ratio: test lines / source lines (0.5+ is good, 0.8+ is excellent)

### Dimension 4: Security (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | Hardcoded secrets, no auth, SQL injection possible |
| 2 | Auth exists but inconsistent, some endpoints unprotected, basic validation |
| 3 | Auth on all endpoints, parameterized queries, ownership checks, password hashing |
| 4 | + env-only secrets with startup validation, security headers, rate limiting, input length limits |
| 5 | + CSP headers, dependency scanning, audit logging, CORS properly configured, body size limits |

**How to measure:**
- Grep for hardcoded strings: `password`, `secret`, `api_key`, `Bearer`
- Check every endpoint for auth middleware
- Check every query for parameterization
- Check for ownership verification (WHERE user_id = ?)
- Check JWT secret source (env-only vs hardcoded fallback)
- Check for security headers (X-Content-Type-Options, X-Frame-Options, HSTS)
- Check for rate limiting on auth endpoints
- Check for input length validation
- Check for body size limit on JSON parsing
- Check for startup env validation

### Dimension 5: API Design (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | Inconsistent shapes, no status codes, no pagination |
| 2 | Basic REST but inconsistent response shapes |
| 3 | Consistent shapes, correct status codes, pagination on lists |
| 4 | + machine-readable error codes, pagination metadata, API versioning ready |
| 5 | + OpenAPI spec, typed request/response DTOs, HATEOAS links, API documentation |

**How to measure:**
- Count distinct response shapes (2 = good, 3+ = bad)
- Check HTTP status codes (200 for everything = bad)
- Check for pagination on list endpoints (with total, page, limit metadata)
- Check for machine-readable error codes (VALIDATION_ERROR, NOT_FOUND, etc.)
- Check for consistent naming (camelCase everywhere OR snake_case everywhere)
- Check for response helper/utility (centralized vs inline res.json)

### Dimension 6: Data Integrity (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No constraints, no indexes, auto-increment IDs exposed |
| 2 | Basic constraints (PK, some NOT NULL) |
| 3 | PKs, FKs with ON DELETE, NOT NULL, UNIQUE, timestamps |
| 4 | + indexes on queried columns, UUIDs for public IDs, optimistic locking |
| 5 | + reversible migrations, transactions for multi-step writes, CHECK constraints, connection pooling |

**How to measure:**
- Check schema for: PKs, FKs, NOT NULL, UNIQUE, CHECK constraints
- Check for indexes on WHERE/JOIN/ORDER BY columns
- Check ID type: auto-increment (enumerable, bad) vs UUID (non-enumerable, good)
- Check for created_at/updated_at timestamps
- Check for optimistic locking (version column)
- Check for transactions on multi-step writes
- Check for migration files with up AND down

### Dimension 7: Error Handling (Weight: 5%)

| Score | Criteria |
|-------|----------|
| 1 | No error handling, unhandled promise rejections |
| 2 | Basic try/catch, generic error messages |
| 3 | Global error handler, appropriate status codes, no stack traces to users |
| 4 | + typed error classes, structured error responses, specific handling per error type |
| 5 | + circuit breakers on external calls, retry with backoff, degraded mode fallback |

**How to measure:**
- Check for global error handler middleware
- Check if errors expose stack traces or internal details
- Check for typed error classes (vs generic Error)
- Check for try/catch on all external calls (DB, API, file)
- Check for retry logic on transient failures
- Check for timeout configuration on external calls

### Dimension 8: Observability (Weight: 5%)

| Score | Criteria |
|-------|----------|
| 1 | No logging, no health check |
| 2 | console.log statements, basic health check |
| 3 | Structured logging (JSON), health check with dependency status |
| 4 | + log levels, correlation IDs, sensitive data redaction, graceful shutdown |
| 5 | + distributed tracing, metrics collection, alerting rules, structured request/response logging |

**How to measure:**
- Check for console.log vs structured logger (pino, winston)
- Check for health check endpoint
- Check if health check tests dependencies (DB, Redis)
- Check for correlation IDs on requests
- Check for log levels (debug/info/warn/error)
- Check for sensitive data redaction in logs
- Check for graceful shutdown (SIGTERM/SIGINT handlers)

### Dimension 9: DevOps Readiness (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No env management, no gitignore, no containerization |
| 2 | .gitignore exists, some env vars used |
| 3 | .env.example documented, .gitignore complete, startup validates env |
| 4 | + Dockerfile, docker-compose for local dev, CI/CD pipeline config |
| 5 | + multi-stage Docker build, non-root user, CI with lint+typecheck+test+build+security, deployment strategy |

**How to measure:**
- Check for .env.example (exists and documents all variables)
- Check for .gitignore (covers node_modules, .env, *.db, coverage, dist)
- Check for .dockerignore
- Check for Dockerfile (multi-stage? non-root user? health check?)
- Check for docker-compose.yml
- Check for CI/CD config (.github/workflows/)
- Check for startup env validation (crash if missing, not silent fallback)

### Dimension 10: Maintainability (Weight: 5%)

| Score | Criteria |
|-------|----------|
| 1 | No structure, no comments, inconsistent naming |
| 2 | Basic structure but mixed patterns, no conventions documented |
| 3 | Consistent naming, clear folder structure, README with setup instructions |
| 4 | + CLAUDE.md with conventions, small focused functions (< 40 lines), separation of concerns |
| 5 | + ADR log, code follows single responsibility, DI enables swapping any component, new developer onboards in 30 min |

**How to measure:**
- Count functions > 40 lines (0 = good, 3+ = bad)
- Check for consistent naming conventions across files
- Check for CLAUDE.md or README with architecture documentation
- Check for separation: can you swap the database without touching business logic?
- Check for clear module boundaries: can you understand each module independently?
- Time-to-understand: could a new developer navigate this codebase in 30 minutes?

---

## Scoring Formula

```
Enterprise Fitness Score = Σ (dimension_score × weight) × 20

Dimensions and weights:
  Architecture:     15%
  Type Safety:      10%
  Testing:          15%
  Security:         15%
  API Design:       10%
  Data Integrity:   10%
  Error Handling:    5%
  Observability:     5%
  DevOps Readiness: 10%
  Maintainability:   5%

Score ranges:
  90-100: Enterprise Ready     — Ship to production with confidence
  80-89:  Production Grade     — Minor hardening needed
  70-79:  Startup Acceptable   — Good for MVP, needs work before scale
  60-69:  Prototype Quality    — Works but has production blockers
  50-59:  Proof of Concept     — Demonstrates functionality, not deployable
  Below 50: Not Production Viable
```

---

## Test Scenarios

Don't test one scenario. Test across different project types to see if the skill generalizes.

### Scenario 1: REST API (Current)
**Prompt:** "Build a task management API with user auth, CRUD, filtering, pagination. Node.js, Express, SQLite."
**Tests:** All 10 dimensions apply directly.

### Scenario 2: Real-Time Application
**Prompt:** "Build a collaborative todo app with real-time sync. Multiple users can share lists. WebSocket for live updates. React + Node.js + PostgreSQL."
**Tests:** Architecture (how are WebSockets integrated?), concurrency (two users edit same item), state management, event handling.

### Scenario 3: Data Pipeline
**Prompt:** "Build a service that ingests CSV files via API, validates data, transforms it, stores in database, and generates summary reports. Node.js, TypeScript, PostgreSQL."
**Tests:** Error handling (malformed CSV), queue pattern (large file processing), streaming (memory management), validation (data quality).

### Scenario 4: Multi-Tenant SaaS
**Prompt:** "Build a SaaS invoicing API. Organizations have members with roles (admin, member). Members create invoices. Invoices have line items. Support PDF generation. Node.js, Express, PostgreSQL."
**Tests:** Authorization (role-based + org-based), data isolation (tenants can't see each other's data), architecture (multi-tenancy strategy).

### Scenario 5: Third-Party Integration Heavy
**Prompt:** "Build a service that syncs contacts from 3 sources (Google, Outlook, CSV upload), deduplicates them, and provides a unified API. Node.js, TypeScript."
**Tests:** Resilience (what if Google API is down?), retry/backoff, circuit breaker, data consistency, error handling.

---

## Running the Test

### Step 1: Setup
```
For each scenario:
  1. Create two fresh directories: with-skill/ and without-skill/
  2. In without-skill/: Give Claude the scenario prompt only
  3. In with-skill/: Give Claude the same prompt + load SKILL.md and CLAUDE.md into context
  4. No bias instructions to either. No "be typical" or "follow every guardrail."
```

### Step 2: Generate
```
Let each agent build the complete project autonomously.
Time both builds (wall clock from prompt to "done").
```

### Step 3: Score
```
For each dimension:
  1. Read the generated code
  2. Apply the scoring criteria from the rubric above
  3. Record the score (1-5) with specific evidence
  4. Calculate weighted Enterprise Fitness Score
```

### Step 4: Verify (Automated Where Possible)
```
Automated checks:
  - npm run build (does it compile?)
  - npm run test (do tests pass? how many?)
  - npm run lint (how many lint errors?)
  - npm audit (how many vulnerabilities?)
  - tsc --noEmit (how many type errors?)
  - grep -r "any" src/ (how many 'any' types?)
  - grep -r "console.log" src/ (how many console.logs?)
  - grep -r "TODO\|FIXME\|HACK" src/ (how many known issues?)
  - Count: files, lines, test files, test lines, test cases
  - Calculate: test-to-source ratio, average function length

Manual checks:
  - Architecture diagram: draw the dependency graph. Any violations?
  - New developer test: could someone unfamiliar navigate this in 30 min?
  - Swap test: could you change the database without touching business logic?
  - Scale test: what happens with 100K rows? 1M rows?
```

### Step 5: Report
```
For each scenario, produce:
  1. Enterprise Fitness Score (both versions)
  2. Dimension-by-dimension breakdown with evidence
  3. Production blockers found (issues that MUST be fixed before deploy)
  4. Architecture analysis (dependency graph, layer violations)
  5. Time comparison (build time, lines generated)
  6. Key finding: What did the skill ADD that Claude didn't do naturally?
  7. Key finding: What did Claude do naturally WITHOUT the skill?
  8. Honest assessment: Is the skill worth the extra build time?
```

---

## Interpreting Results

### What Matters Most

The 10 dimensions are not equally important for every user:

| User Type | Priorities (top 3) |
|-----------|-------------------|
| **Solo founder shipping MVP** | Testing, Security, API Design |
| **Startup scaling to 10 devs** | Architecture, Maintainability, Testing |
| **Enterprise team** | Security, DevOps Readiness, Architecture |
| **Agency building for clients** | Maintainability, Testing, DevOps Readiness |

### The Real Question

The A/B test doesn't need to prove the skill is "better." It needs to answer:

1. **For which dimensions does the skill make the biggest difference?** (Testing and Architecture, based on prior results)
2. **For which dimensions is Claude already strong without the skill?** (Security basics, error handling basics)
3. **What's the cost?** (Build time, code volume, complexity)
4. **Is the trade-off worth it for the target user?** (Yes if they need production-grade. No if they need a quick prototype.)

### Honest Reporting Rules

1. **Always show what Claude does well WITHOUT the skill.** The skill's value is the delta, not the absolute.
2. **Always show the cost.** More code = more to maintain. Longer build time = slower iteration.
3. **Never inflate scores.** If both versions get 4/5 on security, say so. Don't pretend the skill added something it didn't.
4. **Acknowledge when the skill is overkill.** For a weekend hack, 15 guardrails is overhead. Be honest about that.
5. **Multiple scenarios prevent overfitting.** A skill that aces Scenario 1 but fails Scenario 3 is not enterprise-grade.

---

## Sample Scorecard Template

```
┌──────────────────────────────────────────────────────────────────┐
│              ENTERPRISE FITNESS SCORECARD                        │
│              Scenario: [Name]                                    │
│              Date: [YYYY-MM-DD]                                  │
├──────────────────────────────────────────────────────────────────┤
│ Dimension          │ Weight │ No Skill │ With Skill │ Delta     │
├────────────────────┼────────┼──────────┼────────────┼───────────┤
│ Architecture       │  15%   │   ?/5    │    ?/5     │   +?      │
│ Type Safety        │  10%   │   ?/5    │    ?/5     │   +?      │
│ Testing            │  15%   │   ?/5    │    ?/5     │   +?      │
│ Security           │  15%   │   ?/5    │    ?/5     │   +?      │
│ API Design         │  10%   │   ?/5    │    ?/5     │   +?      │
│ Data Integrity     │  10%   │   ?/5    │    ?/5     │   +?      │
│ Error Handling     │   5%   │   ?/5    │    ?/5     │   +?      │
│ Observability      │   5%   │   ?/5    │    ?/5     │   +?      │
│ DevOps Readiness   │  10%   │   ?/5    │    ?/5     │   +?      │
│ Maintainability    │   5%   │   ?/5    │    ?/5     │   +?      │
├────────────────────┼────────┼──────────┼────────────┼───────────┤
│ WEIGHTED SCORE     │  100%  │   ?/100  │    ?/100   │   +?      │
├────────────────────┼────────┼──────────┼────────────┼───────────┤
│ Grade              │        │    ?     │     ?      │           │
│ Production Blockers│        │    ?     │     ?      │           │
│ Build Time         │        │    ?     │     ?      │           │
│ Total Lines (src)  │        │    ?     │     ?      │           │
│ Total Lines (test) │        │    ?     │     ?      │           │
│ Test Cases         │        │    ?     │     ?      │           │
│ Source Files       │        │    ?     │     ?      │           │
└──────────────────────────────────────────────────────────────────┘
```
