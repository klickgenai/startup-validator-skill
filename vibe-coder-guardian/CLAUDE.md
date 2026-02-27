# CLAUDE.md

> Copy this file to your project root when starting a new project with the Vibe Coder Guardian skill.

---

## Guardian (Always Active)

You MUST follow the vibe-coder-guardian skill for EVERY code interaction. No exceptions.

- Run all 5 phases on every task: UNDERSTAND → PLAN → BUILD → VERIFY → EXPLAIN
- Output status updates after each phase so I always know what's happening
- Load reference files from `.claude/skills/vibe-coder-guardian/references/` when entering each phase
- Never skip the Feature Clash Checklist when adding features
- Never skip the Security Quick-Scan after changes
- Never say "done" with open CRITICAL or WARNING issues
- Track every issue found and report at the end of every interaction

---

## Starting From Scratch

This project is being built from zero. Follow these rules for the bootstrap phase:

### Before Writing Any Code

1. **Confirm the vision.** Ask me:
   - What are we building? (1-sentence description)
   - What stack? (framework, database, styling, hosting)
   - What's the first feature to ship?
2. **Fill in the Project Info section below** once we've decided

### Bootstrap the Foundation Right

The first implementation of anything becomes the pattern for everything after it. Be deliberate.

1. **Project structure** — proper folder structure for the chosen framework from day one
2. **Environment** — `.env.example` and `.gitignore` from the first commit
3. **Database** — proper constraints (PKs, FKs, NOT NULL, indexes, timestamps) from the first table
4. **API responses** — consistent shapes from the first endpoint
5. **Error handling** — proper patterns from the first external call
6. **Auth** — auth middleware and ownership checks from the first protected route
7. **Tests** — test setup and at least happy-path tests from the first feature
8. **Types/Validation** — input validation at boundaries from the first form or endpoint

### As the Project Grows

- Follow the patterns already established in this project — don't invent new ones
- When a new pattern is needed, document it in the Conventions section below
- Every new feature runs through the full 5-phase pipeline
- The 10 non-negotiable guardrails apply from line 1, not "later when we need them"

---

## Project Info

<!-- Fill this in when you start building -->

**App:** [What you're building — 1 sentence]
**Stack:** [e.g., Next.js, PostgreSQL, Tailwind, Vercel]
**Status:** Bootstrapping

---

## Conventions

<!-- These get filled in as patterns are established -->
<!-- The guardian follows whatever patterns exist here -->
<!-- Example entries: -->

<!-- **API Response Shape:**
```json
{ "data": { ... }, "meta": { ... } }        // success
{ "error": { "code": "...", "message": "..." } }  // error
``` -->

<!-- **File Naming:** kebab-case for files, PascalCase for components -->

<!-- **State Management:** [your choice here] -->

<!-- **Database Naming:** snake_case for tables and columns -->
