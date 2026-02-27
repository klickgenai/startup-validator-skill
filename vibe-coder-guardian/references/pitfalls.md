# Common Pitfalls — Full Reference

Read this file when you spot a pattern that matches one of these known pitfalls. Each entry has the symptom, common causes, and the action you must take.

---

## Pitfall 1: "It Works on Localhost"

**Symptom:** App works in development, breaks in production.

**Common causes:**
- Hardcoded `localhost` URLs instead of environment variables
- Development-only dependencies in production
- Different database engine (SQLite locally, PostgreSQL in production)
- Missing environment variables in production
- CORS not configured for production domain
- File paths that work on Mac but break on Linux (case sensitivity)
- No Docker — "works on my machine" but not on the server

**Your action:** Check for environment-specific code. Use env vars for ALL URLs, keys, and configuration. If `.env.example` doesn't exist, create it. If Dockerfile doesn't exist, create it. Validate env vars at startup with Zod — crash immediately if missing.

---

## Pitfall 2: "I'll Add Tests Later"

**Symptom:** No tests. Changes in one file break another. Nobody notices until a user reports it.

**Your action:** Write tests NOW, following the testing pyramid. Unit tests for domain logic, integration tests for API endpoints. Read `references/testing-strategy.md` for the full strategy. If the project has zero tests, add test setup (Jest + Supertest) and write tests for the code YOU write.

---

## Pitfall 3: "Just Store It in State"

**Symptom:** Critical data lives only in frontend state. Refresh = gone. New tab = out of sync.

**Your action:** Identify the source of truth for every piece of data. If it needs to survive a page refresh, it must be in the database, URL params, or persistent storage — not just React state or Zustand.

---

## Pitfall 4: "The API Returns Whatever"

**Symptom:** API returns different shapes for success vs. error, different field names across endpoints, no pagination, 200 for everything.

**Your action:** Enforce consistent response shapes from the start. Use a response helper (see `references/build-guardrails.md`). Two shapes: success and error. Machine-readable error codes. Pagination on every list endpoint.

---

## Pitfall 5: "Nobody Would Do That"

**Symptom:** App crashes on emoji in name field, 50,000-character paste, .exe avatar upload, or direct deep link navigation.

**Your action:** Users will do everything you don't expect. Use Zod schemas for input validation. Set length limits. Handle bizarre cases. Code should never crash from unexpected input — reject it gracefully with a typed error.

---

## Pitfall 6: "I'll Handle Errors Later"

**Symptom:** Unhandled promise rejections. White screens. Infinite spinners. "undefined" or "NaN" in the UI.

**Your action:** Every external call gets error handling. Every data display handles null/undefined. Every async operation has loading and error states. Use typed error classes (see `references/build-guardrails.md`). Do this while building, not after.

---

## Pitfall 7: "Let Me Just Add This Quick Feature"

**Symptom:** New feature works great. Two existing features are broken. Nobody connects the dots.

**Your action:** Run the Feature Clash Checklist (in `references/checklists.md`) before every new feature. Check shared state, APIs, DB tables, UI space. After implementing, run the Regression Quick-Check.

---

## Pitfall 8: "The Database Handles That"

**Symptom:** App trusts the database to enforce all constraints. But the DB doesn't have constraints, or the ORM bypasses them, or a migration dropped them.

**Your action:** Validate at BOTH application level AND database level. Application validation (Zod schemas) gives nice error messages. Database constraints (NOT NULL, UNIQUE, CHECK, FK) are the last line of defense. You need both.

---

## Pitfall 9: "We Can Scale Later"

**Symptom:** Works for 5 test users. Gets 100 real users. Queries take 30 seconds. Pages timeout. Jobs pile up.

**Your action:** You don't need to architect for millions. But you DO need: pagination on every list, indexes on every queried column, connection pooling, no N+1 queries, no unbounded `SELECT *`, caching for read-heavy data, queues for slow operations. Free now, expensive later.

---

## Pitfall 10: "The Frontend Handles Auth"

**Symptom:** "Admin" button hidden in UI, but `/api/admin/users` has no auth check. Anyone with the URL can access it.

**Your action:** NEVER rely on the frontend to enforce security. Every API endpoint independently verifies authentication and authorization. Frontend controls what users SEE. Backend controls what users CAN DO. Both required.

---

## Pitfall 11: "We Don't Need Types"

**Symptom:** Runtime `TypeError: Cannot read property 'x' of undefined`. Function receives wrong shape of data. Refactoring breaks things silently.

**Common causes:**
- No TypeScript, or TypeScript with `any` everywhere
- Interfaces not defined between layers
- API response types not matching actual responses
- No compile-time verification of contracts

**Your action:** TypeScript `strict: true` from day one. Types ARE documentation. Define interfaces for every layer boundary. Use Zod for runtime validation at system boundaries. See `references/build-guardrails.md` for TypeScript patterns.

---

## Pitfall 12: "Let Me Just Import It Directly"

**Symptom:** Service creates its own database connection. Changing the database requires changing every service. Can't write unit tests without a real database.

**Common causes:**
- No dependency injection — services instantiate their own dependencies
- No interfaces — services depend on concrete implementations
- Tight coupling between business logic and infrastructure

**Your action:** Dependency injection via constructor. Services receive their dependencies, never create them. Define interfaces in domain/application layer, implement in infrastructure. Wire everything in a container at startup. See `references/architecture-patterns.md` for the full DI pattern.

---

## Pitfall 13: "One File Is Fine for Now"

**Symptom:** 500-line controller with validation, business logic, database queries, and error handling all in one function. Nobody can understand it. Nobody wants to touch it.

**Common causes:**
- No layer separation from the start
- "It's just a small project" thinking
- Belief that structure adds overhead

**Your action:** Proper layer separation from the first feature. Controller → Service → Repository from day one. Each layer has a single responsibility. Refactoring a monolith file later costs 10x what structuring it right from the start costs. See `references/architecture-patterns.md`.

---

## Pitfall 14: "We'll Add Monitoring Later"

**Symptom:** Production is down. Nobody knows. Users report the outage on Twitter before the team notices. When investigating, logs say `console.log("error")` with no context.

**Common causes:**
- `console.log` instead of structured logging
- No health check endpoint
- No log levels (everything is `info` or nothing is logged)
- No correlation IDs to trace a request through the system

**Your action:** Structured logging (JSON format with pino or winston) from the first deployment. Log levels (debug/info/warn/error). Correlation IDs on every request. Health check endpoint that checks database and external dependencies. See `references/devops-operations.md`.

---

## Pitfall 15: "Tests Slow Us Down"

**Symptom:** "We'll move faster without tests." Ship a feature. It breaks something. Spend 4 hours debugging. Ship the fix. It breaks something else. Repeat.

**Your action:** Tests slow you down today. No tests slow you down every day after. Follow the testing pyramid — unit tests are fast (< 10ms each). Write them while building. See `references/testing-strategy.md`. A project with 80%+ coverage can be refactored with confidence. A project with 0% coverage can't be changed safely.
