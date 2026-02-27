# Vibe Coder Guardian — Quick Reference Checklists

Printable/scannable checklists extracted from the main SKILL.md. These are the checklists the agent runs automatically on every interaction.

---

## New Endpoint Checklist
- [ ] Input validation on all parameters
- [ ] Authentication middleware applied
- [ ] Authorization check (user owns resource)
- [ ] Error handling with appropriate status codes
- [ ] Rate limiting (if public or auth-related)
- [ ] Response shape consistent with other endpoints
- [ ] Paginated if returning a list
- [ ] SQL uses parameterized queries
- [ ] Logged appropriately (no sensitive data in logs)
- [ ] Tested: happy path + auth failure + invalid input + not found

## New Database Table Checklist
- [ ] Primary key defined
- [ ] Foreign keys with ON DELETE behavior
- [ ] NOT NULL on required columns
- [ ] UNIQUE on naturally unique columns (email, slug)
- [ ] Indexes on columns used in WHERE / JOIN / ORDER BY
- [ ] created_at and updated_at timestamps
- [ ] Migration is reversible (up AND down)
- [ ] Default values for existing rows if adding column to existing table
- [ ] No sensitive data stored in plain text

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

## New Feature Checklist
- [ ] Read all related existing code first
- [ ] Mapped the blast radius (what could break?)
- [ ] Feature clash detection completed (Section 2.1 of SKILL.md)
- [ ] Follows existing codebase patterns
- [ ] Input validation at the boundary
- [ ] Error handling on all external calls
- [ ] Edge cases handled (empty, boundary, concurrent, error)
- [ ] Existing tests still pass
- [ ] New tests written (happy path + one failure case minimum)
- [ ] Security quick-scan completed
- [ ] Explained to user what was built and what to test

## Feature Clash Checklist
- [ ] Shared state: Does new feature read/write state other features use?
- [ ] Shared UI space: Layout collisions, z-index conflicts, mobile breakage?
- [ ] Shared API endpoints: Request/response shapes still match?
- [ ] Shared database tables: Migration breaks existing queries?
- [ ] Event listeners / hooks: Execution order conflicts?
- [ ] Route conflicts: URL collisions with existing routes?
- [ ] Background jobs: Overlap with existing scheduled tasks?
- [ ] Third-party integrations: Rate limits, auth token conflicts?

## Security Quick-Scan
- [ ] No hardcoded secrets in code
- [ ] No sensitive data in console.log / print statements
- [ ] Every new endpoint checks authentication
- [ ] Every new endpoint checks authorization (user owns resource)
- [ ] All user input validated and sanitized
- [ ] Database queries use parameterized statements
- [ ] File uploads check type, size, and content
- [ ] No open redirects
- [ ] Error messages don't expose internals
- [ ] CORS not accidentally opened to "*"

## Regression Quick-Check
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

## Pre-Deploy Checklist
- [ ] All tests pass
- [ ] No hardcoded secrets in code
- [ ] Environment variables documented in .env.example
- [ ] Database migrations tested (up AND down)
- [ ] No debug statements left in code
- [ ] Error tracking configured
- [ ] CORS and security headers set correctly
- [ ] Rate limiting active on auth endpoints
- [ ] Health check endpoint exists
- [ ] Rollback plan documented

## Scaling Sanity Check
- [ ] Every list query is paginated (LIMIT + OFFSET or cursor)
- [ ] Database indexes on columns in WHERE / JOIN / ORDER BY
- [ ] No N+1 query patterns
- [ ] No unbounded SELECT * queries
- [ ] Large files are streamed, not loaded into memory
- [ ] Connection pooling configured for database
- [ ] No O(n²) loops over data sets
- [ ] Background jobs for long-running operations (>5 seconds)
