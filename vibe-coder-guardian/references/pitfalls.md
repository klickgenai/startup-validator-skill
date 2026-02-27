# Common Vibe Coder Pitfalls — Full Reference

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

**Your action:** Check for environment-specific code. Use env vars for ALL URLs, keys, and configuration. If `.env.example` doesn't exist, create it.

---

## Pitfall 2: "I'll Add Tests Later"

**Symptom:** No tests. Changes in one file break another. Nobody notices until a user reports it.

**Your action:** Write at least basic tests for critical paths (auth, payment, data mutation). Don't wait to be asked. If the project has zero tests, add a test setup and write tests for code YOU write.

---

## Pitfall 3: "Just Store It in State"

**Symptom:** Critical data lives only in frontend state. Refresh = gone. New tab = out of sync.

**Your action:** Identify the source of truth for every piece of data. If it needs to survive a page refresh, it must be in the database, URL params, or persistent storage — not just React state or Zustand.

---

## Pitfall 4: "The API Returns Whatever"

**Symptom:** API returns different shapes for success vs. error, different field names across endpoints, no pagination, 200 for everything.

**Your action:** Enforce consistent response shapes from the start. Use a response helper or serializer to ensure every endpoint returns the same structure.

---

## Pitfall 5: "Nobody Would Do That"

**Symptom:** App crashes on emoji in name field, 50,000-character paste, .exe avatar upload, or direct deep link navigation.

**Your action:** Users will do everything you don't expect. Validate inputs. Set limits. Handle bizarre cases. Code should never crash from unexpected input — reject it gracefully.

---

## Pitfall 6: "I'll Handle Errors Later"

**Symptom:** Unhandled promise rejections. White screens. Infinite spinners. "undefined" or "NaN" in the UI.

**Your action:** Every external call gets error handling. Every data display handles null/undefined. Every async operation has loading and error states. Do this while building, not after.

---

## Pitfall 7: "Let Me Just Add This Quick Feature"

**Symptom:** New feature works great. Two existing features are broken. Nobody connects the dots.

**Your action:** Run the Feature Clash Checklist (in `references/checklists.md`) before every new feature. Check shared state, APIs, DB tables, UI space. After implementing, run the Regression Quick-Check.

---

## Pitfall 8: "The Database Handles That"

**Symptom:** App trusts the database to enforce all constraints. But the DB doesn't have constraints, or the ORM bypasses them, or a migration dropped them.

**Your action:** Validate at BOTH application level AND database level. Application validation gives nice error messages. Database constraints are the last line of defense. You need both.

---

## Pitfall 9: "We Can Scale Later"

**Symptom:** Works for 5 test users. Gets 100 real users. Queries take 30 seconds. Pages timeout. Jobs pile up.

**Your action:** You don't need to architect for millions. But you DO need: pagination on every list, indexes on every queried column, connection pooling, no N+1 queries, no unbounded `SELECT *`. Free now, expensive later.

---

## Pitfall 10: "The Frontend Handles Auth"

**Symptom:** "Admin" button hidden in UI, but `/api/admin/users` has no auth check. Anyone with the URL can access it.

**Your action:** NEVER rely on the frontend to enforce security. Every API endpoint independently verifies authentication and authorization. Frontend controls what users SEE. Backend controls what users CAN DO. Both required.
