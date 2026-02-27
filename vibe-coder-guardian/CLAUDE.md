# CLAUDE.md

> Copy this file to your project root when starting a new project with the Vibe Coder Guardian skill.

---

## Guardian (Always Active)

You MUST follow the vibe-coder-guardian skill for EVERY code interaction. No exceptions.

- Run all 8 phases on every task: [BOOTSTRAP →] UNDERSTAND → ARCHITECT → PLAN → BUILD → TEST → VERIFY → EXPLAIN
- Output status updates after each phase so I always know what's happening
- Load reference files from `.claude/skills/vibe-coder-guardian/references/` when entering each phase
- Never skip the Feature Clash Checklist when adding features
- Never skip the Architecture Review when changing structure
- Never skip the Security Quick-Scan after changes
- Never skip the Observability Quick-Check after changes
- Never skip tests — follow the testing pyramid, enforce coverage thresholds (80% global, 90% domain)
- Never say "done" with open CRITICAL, WARNING, or ARCH issues
- Track every issue found and report at the end of every interaction
- Use TypeScript strict mode for all code — NEVER use `any`, convert JS to TS if needed
- Use Zod for ALL input validation — not hand-written validators
- Use pino for ALL logging — NEVER use console.log
- Use dependency injection — services receive their dependencies, never create them
- Use repository pattern — business logic never touches the database directly
- Use typed error classes — never throw generic Error objects
- Rate limit auth endpoints (10/15min) and general API (100/15min)
- Emit audit events for all mutations (CREATE, UPDATE, DELETE)

---

## Architecture

<!-- Fill this in after the ARCHITECT phase of the first feature -->

**Pattern:** [e.g., Clean Architecture / 3-Layer / DDD]
**Layers:** [e.g., Domain → Application → Infrastructure]
**Dependency Rule:** [e.g., Inner layers have zero external imports. Dependencies point inward only.]

```
[Paste your folder structure here once established]
```

---

## Starting From Scratch

This project is being built from zero. Follow these rules for the bootstrap phase:

### Before Writing Any Code

1. **Confirm the vision.** Ask me:
   - What are we building? (1-sentence description)
   - What stack? (framework, database, ORM, styling, hosting)
   - What scale? (hobby, startup MVP, enterprise)
   - What's the first feature to ship?
2. **Fill in the Project Info section below** once we've decided
3. **Select architecture pattern** — read `references/architecture-patterns.md` and propose the right pattern for the scale

### Bootstrap the Foundation Right

The first implementation of anything becomes the pattern for everything after it. Be deliberate.

1. **Architecture** — layer structure with dependency direction from the first file
2. **TypeScript** — `strict: true` from the first line of code
3. **Project structure** — proper folder structure matching the chosen architecture
4. **Environment** — `.env.example`, `.gitignore`, `.dockerignore` from the first commit
5. **Database** — proper constraints (PKs, FKs, NOT NULL, indexes, timestamps, UUIDs) from the first table
6. **API responses** — consistent shapes (success + error) using response helpers from the first endpoint
7. **Error handling** — typed error classes and global error handler from the first endpoint
8. **Auth** — auth middleware and ownership checks from the first protected route
9. **Validation** — Zod schemas at system boundaries from the first form or endpoint
10. **Tests** — testing pyramid setup (Jest + Supertest) and happy-path tests from the first feature
11. **Logging** — structured logging (pino/winston) with correlation IDs from the first request
12. **DI container** — dependency injection wired at startup from the first service
13. **Docker** — Dockerfile and docker-compose.yml from the first deploy
14. **CI** — GitHub Actions pipeline (lint + typecheck + test + build) from the first push

### As the Project Grows

- Follow the patterns already established in this project — don't invent new ones
- When a new pattern is needed, document it in the Conventions section below and create an ADR
- Every new feature runs through the full 8-phase pipeline
- All 17 guardrails apply from line 1, not "later when we need them"

---

## Project Info

<!-- Fill this in when you start building -->

**App:** [What you're building — 1 sentence]
**Stack:** [e.g., Node.js, Express, TypeScript, PostgreSQL, Redis, Docker]
**Scale:** [Hobby / Startup MVP / Enterprise]
**Status:** Bootstrapping

---

## Conventions

<!-- These get filled in as patterns are established -->
<!-- The guardian follows whatever patterns exist here -->

<!-- **API Response Shape:**
```json
{ "success": true, "data": { ... }, "meta": { ... } }
{ "success": false, "error": { "code": "...", "message": "..." } }
``` -->

<!-- **File Naming:** kebab-case for files, PascalCase for classes/types, camelCase for functions -->

<!-- **Error Handling:** Typed error classes extending AppError. Global error handler catches all. -->

<!-- **Database Naming:** snake_case for tables and columns, UUIDs for public IDs -->

<!-- **Testing:** Unit tests for domain/application, integration tests for API endpoints, factories for test data -->

<!-- **State Management:** [your choice here] -->

---

## ADR Log

<!-- Architecture Decision Records — track WHY decisions were made -->

<!-- ### ADR-001: [Decision Title]
**Date:** YYYY-MM-DD
**Context:** [Why this decision was needed]
**Decision:** [What was decided]
**Consequences:** [Trade-offs, what this enables, what this prevents]
-->
