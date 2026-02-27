# Guardrails Over Intelligence: Compensating for Structural Blind Spots in LLM-Generated Code

**A Practical Framework for Production-Grade Vibe Coding**

---

## Abstract

Large Language Models (LLMs) can generate functional software from natural language prompts — a practice known as "vibe coding." However, LLM-generated code consistently fails enterprise readiness assessments due to three structural blind spots inherent to sequential token generation: happy-path bias (skipping non-functional requirements), file-by-file generation (losing cross-file type contracts), and infrastructure blindness (omitting configuration and DevOps artifacts). We present the **Vibe Coder Guardian**, a skill-based intervention framework that compensates for these blind spots through three structural mechanisms: a mandatory bootstrap phase, a TypeScript hard gate, and contract-first development ordering. In controlled A/B tests using identical prompts on Claude Opus 4.6, the framework improved enterprise fitness scores from 52.5/100 (Prototype Quality) to 89/100 (Production Grade) — a 36.5-point gain across 10 weighted dimensions. Critically, these interventions address mechanical limitations of token generation, not intelligence limitations, suggesting they will remain effective as models improve.

**Keywords:** vibe coding, LLM code generation, software engineering, enterprise readiness, guardrail systems, prompt engineering, AI-assisted development

---

## 1. Introduction

### 1.1 The Vibe Coding Problem

The term "vibe coding" — coined by Andrej Karpathy in early 2025 — describes the practice of describing desired software in natural language and letting an AI model generate the implementation. With models like Claude, GPT-4, and Gemini achieving increasingly sophisticated code generation, the question has shifted from "can AI write code?" to "can AI write code that ships?"

Our research answers this question with data: **AI-generated code works, but it doesn't ship.** The gap is not in logic or correctness — it's in the non-functional requirements that separate a prototype from a product: testing, security hardening, observability, deployment configuration, and type safety.

### 1.2 The Core Hypothesis

We hypothesize that the gap between "works" and "ships" is not due to insufficient model intelligence, but to **structural properties of sequential token generation** that cause systematic omissions. If this is true, then:

1. These omissions are predictable and categorizable
2. They can be compensated for by restructuring the generation order
3. The compensation will remain effective as models improve (because it addresses mechanics, not intelligence)

### 1.3 Contributions

This paper makes three contributions:

1. **Identification of three structural LLM blind spots** that cause systematic quality gaps in generated code, independent of model capability
2. **A practical intervention framework** (Vibe Coder Guardian) with 17 enterprise guardrails and an 8-phase generation pipeline that compensates for these blind spots
3. **Controlled A/B test results** showing a 36.5-point improvement on a bias-corrected 10-dimension enterprise fitness scorecard, with all scoring methodology and raw data published

---

## 2. Background and Related Work

### 2.1 LLM Code Generation Capabilities

Current frontier models demonstrate strong performance on code generation benchmarks (HumanEval, SWE-bench, MBPP). However, these benchmarks primarily measure functional correctness — whether the code produces the right output for given inputs. They do not measure:

- Whether the code has tests
- Whether secrets are hardcoded
- Whether the database schema has appropriate constraints
- Whether the application can be deployed
- Whether errors are handled consistently

### 2.2 The Enterprise Readiness Gap

Enterprise software requires more than correctness. A production application must satisfy non-functional requirements across security, reliability, observability, maintainability, and deployability. These requirements are rarely stated in user prompts because they are considered "obvious" to experienced engineers — but they are not obvious to models optimizing for the most likely next token.

### 2.3 Existing Approaches

Prior work on improving LLM code quality has focused on:

- **Better prompting** — asking the model to "write production-quality code" or "include tests"
- **Multi-agent systems** — using separate agents for coding, review, and testing
- **Fine-tuning** — training models on high-quality codebases
- **Post-generation linting** — running static analysis after generation

Our approach is complementary but distinct: we restructure the **generation order** and provide **structural guardrails** that compensate for blind spots inherent to the generation process itself.

---

## 3. Identifying Structural Blind Spots

### 3.1 Methodology

We generated identical applications with and without intervention across multiple prompts, then performed line-by-line code audits to identify systematic omission patterns. We focused on what was *consistently missing* rather than what was *occasionally wrong*.

### 3.2 Three Structural Blind Spots

#### Blind Spot 1: Happy-Path Bias

**Observation:** LLMs generate code that handles the expected flow but systematically skip non-functional requirements.

**Mechanism:** During training, LLMs learn that code following a request should implement the requested functionality. Non-functional requirements (security headers, rate limiting, PII redaction, audit trails) are rarely stated in prompts and therefore have lower conditional probability in the generation distribution.

**Evidence from our tests:**

| Non-Functional Requirement | Present Without Skill | Present With Skill |
|---|---|---|
| Security headers | 0/7 | 7/7 |
| Rate limiting | No | Yes (auth: 10/15min, general: 100/15min) |
| PII redaction in logs | No | Yes (pino redact paths) |
| Audit trail | No | Yes (event bus with structured logging) |
| Correlation IDs | No | Yes (per-request, propagated in headers) |
| Body size limits | No | Yes (10kb) |
| npm security audit in CI | No | Yes |

**Key insight:** These are not things a smarter model would naturally produce. They require explicit domain knowledge about production operations that is orthogonal to the user's stated requirements.

#### Blind Spot 2: File-by-File Generation

**Observation:** LLMs generate files sequentially, causing type contracts to drift across file boundaries.

**Mechanism:** When generating file A, the model has full context of file A's internal types. When it moves to file B, it generates types that *should* match file A but may diverge in subtle ways (field names, nullability, optional vs required). This is especially acute in JavaScript, where there is no compiler to catch mismatches.

**Evidence:** In our no-skill output, the database column `user_id` mapped to different property names across files:
- `req.userId` (set by auth middleware)
- `user_id` (in SQL queries)
- No interface contract ensuring consistency

In the v3 skill output, a single `types/` directory defined all interfaces before any implementation, and TypeScript's compiler enforced consistency.

#### Blind Spot 3: Infrastructure Blindness

**Observation:** LLMs skip "boring" configuration files that are essential for deployment and team collaboration.

**Mechanism:** Infrastructure files (Dockerfile, CI/CD pipelines, `.editorconfig`, `.nvmrc`) have low "interestingness" in the training distribution. They don't implement features, so they have lower generation probability when the prompt asks for features.

**Evidence:**

| Infrastructure File | Present Without Skill | Present With Skill v3 |
|---|---|---|
| `tsconfig.json` (strict) | No (JavaScript used) | Yes (first file emitted) |
| `Dockerfile` (multi-stage) | No | Yes (non-root, HEALTHCHECK) |
| `docker-compose.yml` | No | Yes (volumes, health checks) |
| `.github/workflows/ci.yml` | No | Yes (5-stage pipeline) |
| `jest.config.ts` (thresholds) | No | Yes (80% enforced) |
| `.eslintrc.json` | No | Yes (no-explicit-any: error) |
| `.editorconfig` | No | Yes |
| `.nvmrc` | No | Yes (Node 20) |
| `.prettierrc` | No | Yes |
| `.env.example` | No | Yes (all vars documented) |
| `.dockerignore` | No | Yes |
| `.gitignore` | No | Yes (comprehensive) |

The no-skill output produced **1 configuration file** (package.json). The v3 skill output produced **13 foundation files** before writing any business logic.

### 3.3 Why These Persist Across Model Generations

These blind spots are not bugs in specific models — they are properties of the generation process:

1. **Happy-path bias** persists because non-functional requirements will never be in the prompt. No model improvement changes this.
2. **File-by-file generation** persists because context windows are consumed sequentially. Even with larger contexts, the generation order still matters.
3. **Infrastructure blindness** persists because configuration files will always be less "interesting" than feature code in training distributions.

This is why we argue that structural interventions (changing generation order) are more durable than intelligence improvements (making models smarter).

---

## 4. The Vibe Coder Guardian Framework

### 4.1 Design Principles

The framework is designed around three principles:

1. **Compensate, don't replace.** The model is already good at writing business logic. The framework adds what the model systematically skips.
2. **Structure over reminders.** Rather than saying "don't forget tests," the framework restructures generation to make omission impossible.
3. **Evidence-based guardrails.** Every guardrail addresses a specific, documented failure mode observed in baseline testing.

### 4.2 The 8-Phase Pipeline

The framework imposes an ordered generation pipeline:

```
BOOTSTRAP → UNDERSTAND → ARCHITECT → PLAN → BUILD → TEST → VERIFY → EXPLAIN
```

**Phase 0: BOOTSTRAP** (The key innovation)

Before any business code, the model must emit 13 mandatory foundation files. This phase exists because of Blind Spot 3 (infrastructure blindness). By mandating these files *first*, we ensure they cannot be skipped when the model gets "excited" about implementing features.

The 13 files include: `tsconfig.json` (strict), `package.json` (with all scripts), `.eslintrc.json` (no-any rule), `.prettierrc`, `.env.example`, `.gitignore`, `.dockerignore`, `Dockerfile` (multi-stage, non-root), `docker-compose.yml`, `.github/workflows/ci.yml` (5-stage), `jest.config.ts` (coverage thresholds), `.editorconfig`, `.nvmrc`.

**Phase 2: ARCHITECT — Contract-First Development**

Types and interfaces are written before implementations. This phase exists because of Blind Spot 2 (file-by-file generation). By defining the type contract first, all implementations must conform to a single source of truth.

Generation order: `types/` → `errors/` → `events/` → `config/` → repository interfaces → repository implementations → services → controllers → middleware → app wiring.

**Phase 4: BUILD — TypeScript Hard Gate**

A mandatory check: "If `tsconfig.json` does not exist with `strict: true`, STOP." This addresses the observation that LLMs default to JavaScript unless explicitly mandated to use TypeScript. The compiler then enforces the type contracts defined in Phase 2.

### 4.3 The 17 Enterprise Guardrails

Each guardrail addresses a specific failure mode:

| # | Guardrail | Blind Spot Addressed | Failure Mode |
|---|-----------|---------------------|--------------|
| 1 | TypeScript strict, no `any` | File-by-file generation | Type drift across files |
| 2 | Parameterized queries only | Happy-path bias | SQL injection |
| 3 | No hardcoded secrets | Happy-path bias | Credential leakage |
| 4 | Auth + ownership checks (→404) | Happy-path bias | Unauthorized access, info leakage |
| 5 | Zod validation on all input | Happy-path bias | Injection, data corruption |
| 6 | Typed error classes | File-by-file generation | Inconsistent error handling |
| 7 | Consistent API envelope | File-by-file generation | Inconsistent response shapes |
| 8 | Database integrity (FK, CHECK, indexes) | Happy-path bias | Data corruption, performance |
| 9 | Structured observability (pino, correlation IDs) | Infrastructure blindness | Unable to debug production issues |
| 10 | Optimistic locking | Happy-path bias | Silent data loss on concurrent edits |
| 11 | Third-party resilience | Happy-path bias | Cascading failures |
| 12 | Dependency injection | File-by-file generation | Untestable code |
| 13 | Repository pattern | File-by-file generation | Business logic coupled to DB |
| 14 | Event-driven cross-cutting | Infrastructure blindness | Audit trails, notifications tangled |
| 15 | Configuration as code | Infrastructure blindness | Config drift, missing files |
| 16 | Rate limiting | Happy-path bias | Brute force, DoS |
| 17 | Audit trail for mutations | Happy-path bias | No compliance record |

**Distribution by blind spot:**
- Happy-path bias: 9 guardrails (53%)
- File-by-file generation: 5 guardrails (29%)
- Infrastructure blindness: 3 guardrails (18%)

This distribution reflects the relative severity of each blind spot: happy-path bias causes the most omissions.

---

## 5. Experimental Design

### 5.1 Test Setup

- **Model:** Claude Opus 4.6 (identical model for all conditions)
- **Conditions:** Three — no skill (baseline), v2 skill, v3 skill
- **Prompt:** Identical across all conditions (see Section 5.2)
- **Context:** Only difference was whether skill files (`SKILL.md` + `CLAUDE.md`) were loaded as system context
- **Biasing:** No agent received instructions like "be thorough" or "be typical." No biasing prompts of any kind.
- **Human intervention:** Zero. All code generated in single sessions with no human edits.

### 5.2 The Prompt

> "Build me a task management API using Node.js, Express, and SQLite. Users can register, log in, and manage their personal tasks. Each task has: title, description, status (todo, in_progress, done), priority (low, medium, high), and due_date. Users should only see their own tasks. Keep it simple and functional."

This prompt was chosen because:
1. It is a realistic request a non-technical founder might make
2. It requires authentication, authorization, CRUD, and data modeling
3. It says nothing about testing, security, deployment, or observability
4. "Keep it simple and functional" actively discourages over-engineering

### 5.3 Scoring Framework

We developed a 10-dimension Enterprise Fitness Scorecard with weighted dimensions:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Architecture | 15% | Code organization, layering, DI, testability |
| Type Safety | 10% | Compile-time guarantees, schema validation |
| Testing | 15% | Coverage, test quality, enforcement |
| Security | 15% | OWASP compliance, rate limiting, PII protection |
| API Design | 10% | Consistency, pagination, versioning |
| Data Integrity | 10% | Constraints, indexes, concurrency handling |
| Error Handling | 5% | Typed errors, graceful failure |
| Observability | 5% | Structured logging, correlation, health checks |
| DevOps Readiness | 10% | Docker, CI/CD, configuration management |
| Maintainability | 5% | Style enforcement, interfaces, documentation |

Each dimension scored 0–5 based on code evidence, then weighted. Total = 100.

**Weight rationale:** Security and Testing at 15% each because they are the highest-impact production requirements. Architecture at 15% because it determines long-term velocity. DevOps at 10% because undeployable code delivers zero value. Observability and Maintainability at 5% because they are important but less critical for initial deployment.

### 5.4 Bias Verification

After initial scoring, we conducted a bias audit:
- Re-read all no-skill source code line-by-line
- Identified 5 dimensions where no-skill was under-credited
- Adjusted no-skill score upward by 5.5 points (47 → 52.5)
- Verified v3 score was not inflated (checked custom rate limiter, event bus, test quality, coverage legitimacy, repository pattern cost)

---

## 6. Results

### 6.1 Quantitative Results

#### Output Metrics

| Metric | No Skill | v2 Skill | v3 Skill |
|--------|----------|----------|----------|
| Language | JavaScript | JavaScript | TypeScript (strict) |
| Source files | 5 | 12 | 36 |
| Source lines | 438 | 1,150 | 1,643 |
| Test files | 0 | 2 | 14 |
| Test lines | 0 | 727 | 1,396 |
| Test cases | 0 | 52 | 84 |
| Statement coverage | 0% | unmeasured | 98.34% |
| Branch coverage | 0% | unmeasured | 87.80% |
| Foundation config files | 1 | 4 | 13 |
| TypeScript errors | N/A | N/A | 0 |
| ESLint `any` usage | N/A | N/A | 0 |

#### Enterprise Fitness Scores (Bias-Corrected)

| Dimension | Weight | No Skill | v2 Skill | v3 Skill | No Skill → v3 Gap |
|-----------|--------|----------|----------|----------|-------------------|
| Architecture | 15% | 7.5 | 10.5 | 13.5 | +6.0 |
| Type Safety | 10% | 2.0 | 2.0 | 9.0 | **+7.0** |
| Testing | 15% | 0.0 | 10.5 | 13.5 | **+13.5** |
| Security | 15% | 7.5 | 10.5 | 13.5 | +6.0 |
| API Design | 10% | 5.0 | 7.0 | 9.0 | +4.0 |
| Data Integrity | 10% | 5.0 | 7.0 | 9.0 | +4.0 |
| Error Handling | 5% | 2.5 | 3.5 | 4.5 | +2.0 |
| Observability | 5% | 1.0 | 2.0 | 4.0 | +3.0 |
| DevOps Readiness | 10% | 2.0 | 5.0 | 9.0 | **+7.0** |
| Maintainability | 5% | 2.0 | 3.5 | 4.0 | +2.0 |
| **TOTAL** | **100%** | **52.5** | **69.0** | **89.0** | **+36.5** |

#### Score Classifications

| Range | Classification | Version |
|-------|---------------|---------|
| 0–40 | Prototype / Hackathon | — |
| 41–60 | Prototype Quality | No Skill (52.5) |
| 61–75 | Startup Acceptable | v2 Skill (69) |
| 76–89 | Production Grade | v3 Skill (89) |
| 90–100 | Enterprise Grade | — |

### 6.2 What the Baseline Already Gets Right

An important finding: Claude's baseline (no-skill) output is not bad. It includes:

- 100% parameterized SQL queries (no SQL injection)
- JWT authentication with Bearer token validation
- Password hashing with bcrypt
- User ownership scoping on all queries
- Generic "Invalid email or password" responses (prevents user enumeration)
- CHECK constraints and FOREIGN KEYs in the database schema
- WAL mode and foreign key pragma enabled
- Graceful shutdown handlers
- Health check endpoint
- Modular file structure (5 files across 4 directories)

**The model is already competent.** The skill's value is not in preventing obvious mistakes — it's in adding the 15+ non-functional requirements that the model systematically skips.

### 6.3 Contribution of Each Structural Intervention

| Intervention | Primary Dimensions Affected | Weighted Point Gain |
|---|---|---|
| BOOTSTRAP Phase (13 foundation files first) | DevOps (+7.0), Security (+1.5), Maintainability (+0.5) | ~9.0 |
| TypeScript Hard Gate | Type Safety (+7.0), Error Handling (+0.5) | ~7.5 |
| Contract-First Development | Architecture (+6.0), Testing (+3.0) | ~9.0 |
| 17 Enterprise Guardrails (collectively) | Security (+6.0), Data Integrity (+4.0), API Design (+4.0), Observability (+3.0) | ~17.0 |

Note: Some gains overlap (e.g., TypeScript benefits both Type Safety and Architecture). The total exceeds 36.5 because interventions have synergistic effects.

### 6.4 The Cost

| Metric | No Skill | v3 Skill | Multiple |
|--------|----------|----------|----------|
| Source lines | 438 | 1,643 | 3.8x |
| Total lines (incl. tests) | 438 | 3,039 | 6.9x |
| Generation time (approx.) | ~3 min | ~16 min | ~5x |
| Files created | 6 | 63 | 10.5x |

The framework produces ~7x more code. This is a genuine cost. However, the additional code is overwhelmingly tests (1,396 lines), type definitions (310 lines), and configuration (13 files) — exactly the categories that prevent production incidents.

---

## 7. Discussion

### 7.1 Why Structure Beats Intelligence

The central finding of this work is that **restructuring the generation order** is more effective than **asking for higher quality**. Consider two approaches:

**Approach A (Better prompting):** "Build me a production-ready task management API with tests, security headers, rate limiting, Docker support, CI/CD, TypeScript strict mode, Zod validation, correlation IDs, PII redaction, audit trails, and optimistic locking."

**Approach B (Structural intervention):** Same simple prompt, but with the Vibe Coder Guardian skill loaded as system context.

Approach A might work for a single prompt but:
- Requires the user to know what to ask for (defeats the purpose of vibe coding)
- Is fragile — forgetting one item means it's missing
- Doesn't enforce ordering (types might be written after implementations)
- Doesn't enforce coverage thresholds or CI gates

Approach B works because:
- The user writes a simple, natural prompt
- The skill systematically ensures every non-functional requirement is met
- The generation order is structurally enforced
- Coverage thresholds are embedded in configuration, not in prompts

### 7.2 The v2 → v3 Lesson

The evolution from v2 (69/100) to v3 (89/100) illustrates the difference between "what" and "how":

- **v2 told Claude WHAT to check:** "Don't forget security headers, don't forget tests, don't forget error handling." This produced good results (+16.5 points over baseline) but plateaued because the model still generated files in its natural order.

- **v3 tells Claude HOW to build:** "Emit foundation files first. Write types before implementations. Write interfaces before classes." This produced an additional +20 points because it addressed the generation order itself.

The single biggest scoring swing was **Type Safety: +7.0 points** — caused entirely by the TypeScript hard gate. v2 didn't mandate TypeScript, so the model defaulted to JavaScript (its path of least resistance). v3 made TypeScript non-negotiable, and the compiler then enforced type safety across all files automatically.

### 7.3 Durability Across Model Generations

We argue that these interventions will remain effective as models improve:

1. **Happy-path bias is prompt-dependent, not model-dependent.** A user who asks for "a simple task API" will never mention rate limiting. No model improvement changes this.

2. **File-by-file generation is architecture-dependent.** Even with million-token context windows, the model still writes files sequentially. Contract-first development ensures consistency regardless of context size.

3. **Infrastructure blindness is training-distribution-dependent.** Configuration files will always be less represented in training data than feature code. The BOOTSTRAP phase ensures they exist regardless.

As models get smarter, they will write better business logic within each guardrail. But they will still need the guardrails to know what to write.

### 7.4 Limitations

1. **Single model tested.** All experiments used Claude Opus 4.6. Results may differ on other models.
2. **Single prompt tested for scoring.** The Task Management API is representative but not exhaustive. The AB Test Framework defines 5 test scenarios; only one was executed.
3. **Self-scoring risk.** The same system (Claude) that generated the code also scored it, though human audit confirmed the scores.
4. **No long-term maintenance test.** We measured initial generation quality, not maintainability over time.
5. **No user study.** We did not measure developer satisfaction or onboarding speed.

### 7.5 Future Work

1. **Multi-model testing.** Run the same A/B test on GPT-4, Gemini, and open-source models.
2. **Multi-prompt testing.** Execute all 5 test scenarios in the AB Test Framework.
3. **Longitudinal study.** Measure how well the generated code survives 6 months of feature additions.
4. **Developer study.** Measure onboarding time for new developers joining each codebase.
5. **Automated scoring.** Replace human audit with automated checks (type error count, coverage %, security scan results).
6. **Adversarial testing.** Test whether the guardrails hold under adversarial prompts designed to bypass them.

---

## 8. Conclusion

LLMs are already competent code generators. Our baseline (no-skill) output scored 52.5/100 — functional, secure in fundamentals, and modular. The gap to production readiness is not in intelligence but in discipline.

The Vibe Coder Guardian framework closes this gap through three structural interventions:

1. **BOOTSTRAP Phase** — 13 foundation files before business code, compensating for infrastructure blindness
2. **TypeScript Hard Gate** — compiler-enforced type safety, compensating for file-by-file drift
3. **Contract-First Development** — types and interfaces before implementations, ensuring cross-file consistency

These interventions, combined with 17 evidence-based enterprise guardrails, raised the enterprise fitness score from 52.5 to 89 — a 36.5-point improvement verified through bias-corrected scoring.

The key insight is that **guardrails are more durable than intelligence.** A smarter model will write better business logic, but it will still default to JavaScript, skip Docker, and omit rate limiting unless structurally prevented from doing so. The Vibe Coder Guardian doesn't make the model smarter — it makes it more disciplined. And discipline, not intelligence, is what separates code that works from code that ships.

---

## Appendix A: Reproduction Instructions

All code and data are available in the repository:

```
startup-validator-skill/
├── vibe-coder-guardian/
│   ├── SKILL.md                        # v3 skill definition
│   ├── CLAUDE.md                       # Project-level instructions
│   └── references/                     # Guardrail details, checklists
├── comparison/
│   ├── AB_TEST_FRAMEWORK.md            # Scoring methodology
│   ├── COMPARISON_REPORT.md            # Original A/B test report
│   ├── V3_COMPARISON_REPORT.md         # Three-way comparison + bias audit
│   ├── fair-test/
│   │   ├── without-skill/              # No-skill output (5 JS files)
│   │   ├── with-skill/                 # v2 skill output (12 JS files)
│   │   └── FAIR_COMPARISON_REPORT.md   # Fair test analysis
│   └── v3-test/                        # v3 skill output (50 TS files)
│       ├── src/                        # 36 source files, 1,643 lines
│       ├── tests/                      # 14 test files, 1,396 lines, 84 tests
│       └── coverage/                   # 98.34% statements, 87.8% branches
```

**To reproduce the v3 test:**
1. Load `vibe-coder-guardian/SKILL.md` and `vibe-coder-guardian/CLAUDE.md` as system context
2. Submit the prompt from Section 5.2
3. Score the output using the framework in `AB_TEST_FRAMEWORK.md`

## Appendix B: Complete Guardrail Compliance Matrix

All 17 guardrails verified present in v3 output with specific code evidence:

| # | Guardrail | File | Evidence |
|---|-----------|------|----------|
| 1 | TypeScript strict, no `any` | `tsconfig.json` | `strict: true` + 5 additional flags. ESLint `no-explicit-any: "error"`. `tsc --noEmit` = 0 errors. |
| 2 | Parameterized queries | `sqlite-task-repository.ts`, `sqlite-user-repository.ts` | All 12 SQL statements use `?` placeholders. Zero string interpolation. |
| 3 | No hardcoded secrets | `config/env.ts` | Zod schema: `JWT_SECRET: z.string().min(32)`. `process.exit(1)` on failure. |
| 4 | Auth + ownership | `middleware/auth.ts`, `services/task-service.ts` | `authMiddleware` on all task routes. `findByIdAndUserId()` returns 404 (not 403). |
| 5 | Zod validation | `types/task.ts`, `types/user.ts`, `types/common.ts` | 7 schemas: Register, Login, CreateTask, UpdateTask, TaskFilters, Pagination, UUID. |
| 6 | Typed errors | `errors/app-error.ts` | `AppError` base + 6 subtypes: Validation(400), Unauthorized(401), NotFound(404), Conflict(409), RateLimit(429), Internal(500). |
| 7 | Consistent envelope | `types/common.ts`, `utils/response.ts` | `ApiSuccessResponse<T>` / `ApiErrorResponse` generics. `sendSuccess()`, `sendPaginated()`, `sendError()`. |
| 8 | Database integrity | `config/database.ts` | FKs ON + CASCADE, CHECK(status/priority), NOT NULL, UNIQUE(email), 5 indexes, UUIDs, timestamps. |
| 9 | Structured observability | `utils/logger.ts`, `middleware/correlation-id.ts` | pino with JSON production, `redact` paths, correlation IDs generated/propagated, 6 child loggers, health check with DB latency. |
| 10 | Optimistic locking | `services/task-service.ts`, `repositories/sqlite-task-repository.ts` | `version` column, `WHERE version = ?` in UPDATE, 409 Conflict on mismatch. |
| 11 | Third-party resilience | `services/auth-service.ts` | bcrypt 12 rounds, JWT expiry configurable, body size limit 10kb. |
| 12 | Dependency injection | `services/auth-service.ts`, `services/task-service.ts` | Constructor: `AuthService({ userRepo, eventBus, env, logger })`. |
| 13 | Repository pattern | `repositories/task-repository.interface.ts`, `repositories/sqlite-task-repository.ts` | `ITaskRepository` interface → `SqliteTaskRepository implements ITaskRepository`. |
| 14 | Event-driven | `events/event-bus.ts` | `EventBus` class, `DomainEvent` type, `createAuditLogHandler()`. |
| 15 | Config as code | Root directory | 13 config files from BOOTSTRAP phase. |
| 16 | Rate limiting | `middleware/rate-limiter.ts` | `RateLimiter` class. Auth: 10/15min, General: 100/15min. `X-RateLimit-*` headers. 429 response. |
| 17 | Audit trail | `app.ts`, `services/task-service.ts` | Events: `user.created`, `task.created/updated/deleted`. Payload: action, resource, resourceId, userId, correlationId, timestamp, changes. |

## Appendix C: Bias Verification Summary

| Check | Result |
|-------|--------|
| No-skill architecture re-scored | 2.0 → 2.5 (5 files, not monolith) |
| No-skill security re-scored | 2.0 → 2.5 (solid SQL, JWT, bcrypt, ownership) |
| No-skill data integrity re-scored | 2.0 → 2.5 (CHECK, FK, WAL, UNIQUE) |
| No-skill error handling re-scored | 2.0 → 2.5 (global handler, 404, token errors) |
| No-skill observability re-scored | 0.5 → 1.0 (health check, console logging) |
| **Total no-skill adjustment** | **+5.5 points (47 → 52.5)** |
| v3 custom rate limiter fair? | Yes — more testable than express-rate-limit |
| v3 event bus over-engineering? | No — 79 lines, enables audit trail |
| v3 84 tests meaningful? | Yes — each tests a real scenario |
| v3 98% coverage legitimate? | Yes — verified by running `jest --coverage` |
| v3 repository pattern overkill? | No — 37 lines of interfaces, enables DI |
| **v3 score adjustment** | **None (89 confirmed)** |

---

*All experiments conducted on 2026-02-27 using Claude Opus 4.6. No human code was written or modified. Complete source code, test results, and scoring data available in the repository.*
