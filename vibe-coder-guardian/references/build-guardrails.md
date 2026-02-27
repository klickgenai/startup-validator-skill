# Build Guardrails — Detailed Patterns & Examples

Read this file during Phase 3 (BUILD) when you need detailed guidance on a specific guardrail. Each section corresponds to a non-negotiable rule from the core SKILL.md.

---

## 1. Input Validation

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

## 2. Error Handling

**Every external operation needs error handling:**
- Database queries
- API calls to third-party services
- File system operations
- Email/SMS sending
- Payment processing
- Authentication provider calls

**Rules:**

1. **Catch at the right level.** Don't wrap the entire function in one giant try-catch. Catch where you can handle the error meaningfully.

2. **Never swallow errors silently.**
   ```
   BAD:  try { doThing() } catch(e) { /* ignore */ }
   GOOD: try { doThing() } catch(e) { logger.error('doThing failed', { error: e, context }); throw e; }
   ```

3. **Meaningful user messages — no internals exposed:**
   ```
   BAD:  "Error: ECONNREFUSED 127.0.0.1:5432"
   BAD:  "Something went wrong"
   GOOD: "Unable to save your changes right now. Please try again in a moment."
   ```

4. **Handle specific error types:**
   - Network timeout: retry with backoff (max 3)
   - 401 Unauthorized: redirect to login / refresh token
   - 404 Not Found: show "not found" UI, don't crash
   - 409 Conflict: "someone else updated this, refresh to see changes"
   - 429 Rate Limit: back off, show "please wait"
   - 500 Server Error: log full error server-side, generic message to user

5. **Handle partial failures:** If saving 5 items and item 3 fails — roll back all 5 (transaction) OR save the 4 that worked and report item 3's failure. Choose based on whether partial state is acceptable.

6. **Error boundaries in UI frameworks** (React ErrorBoundary, Vue errorHandler): one per major section/route so a crash in the sidebar doesn't kill the whole page.

---

## 3. Authentication & Authorization

**Authentication** = "Who are you?" (login, session, token)
**Authorization** = "What are you allowed to do?" (permissions, roles, ownership)

**Authentication checklist:**
- Passwords hashed with bcrypt (cost >= 10) or argon2. NEVER MD5, SHA-1, SHA-256 for passwords.
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

## 4. Database Integrity

**Schema rules:**
- Every table has a primary key
- Every foreign key has ON DELETE behavior (CASCADE, SET NULL, or RESTRICT)
- Required columns are NOT NULL
- Unique columns have UNIQUE constraints (email, username, slug)
- CHECK constraints for value ranges (price >= 0, status IN ('active','archived'))
- `created_at` and `updated_at` timestamps on every table
- UUIDs instead of auto-increment if IDs are exposed in URLs (prevents enumeration)

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

## 5. Frontend Resilience

**Layout & Responsiveness:**
- Test at mobile (375px), tablet (768px), and desktop (1280px)
- Never fixed pixel widths for containers with dynamic content
- Long text: `overflow-wrap: break-word`, `text-overflow: ellipsis`, or truncation
- Images: explicit width/height or aspect-ratio to prevent layout shift
- Modals/dropdowns must not get cut off on small screens

**User action edge cases:**

| Edge Case | What Happens | Fix |
|-----------|-------------|-----|
| Double-click submit | Duplicate data | Disable button on first click |
| Back button after submit | Form resubmits | POST-Redirect-GET pattern |
| Refresh during loading | State resets | Store state in URL/sessionStorage |
| Paste huge text | Field/API explodes | maxLength + server validation |
| Navigate away during upload | Orphaned file | beforeunload warning + server cleanup |
| Session expires mid-action | 401, lost work | Intercept 401, save draft, redirect to login |
| Slow network | Multiple clicks | Loading states, disable actions during requests |

**Data display states — handle ALL of these:**
- EMPTY: "No items yet" (not blank screen or broken layout)
- LOADING: Skeleton screens or spinners
- ERROR: "Couldn't load this. Try again." with retry button
- SINGLE vs PLURAL: "1 item" not "1 items"
- LARGE NUMBERS: Format with commas or abbreviate (1.2M)
- LONG STRINGS: Truncate with ellipsis, full on hover/click
- SPECIAL CHARACTERS: O'Brien, Jose, Francois, unicode — test with these

---

## 6. API Design

**Request/Response rules:**
- Consistent naming (camelCase OR snake_case, never mix)
- Consistent response shapes:
  ```
  SUCCESS: { "data": { ... }, "meta": { "page": 1, "total": 42 } }
  ERROR:   { "error": { "code": "INVALID_INPUT", "message": "Email is required" } }
  ```
- Appropriate HTTP status codes (not 200 for everything)
- Paginate list endpoints by default (`?page=1&limit=20`)
- Include total count in paginated responses
- ISO 8601 for all dates

**Backward compatibility:**
- Adding optional response field: safe
- Adding required request field: breaking — make optional with default
- Removing response field: breaking — deprecate first
- Changing field type: breaking — add new field instead
- If you MUST break: version the API (`/api/v2/users`)

**Rate limiting:**
- Auth endpoints (login, register, reset): 5-10/minute
- Expensive operations (search, export): 20-30/minute
- Public API: based on API key or IP
- Return 429 with `Retry-After` header

---

## 7. Environment & Configuration

- Never hardcode secrets, API keys, database URLs, or feature flags
- Provide `.env.example` with every variable needed (values blanked)
- Validate env vars at startup — crash immediately with clear error if missing
- Centralize config for different environments (don't scatter `if (NODE_ENV === 'production')`)
- Never commit `.env` files — add to `.gitignore`
- Docker: don't copy `.env` into the image — use runtime env vars

---

## 8. Secrets & Sensitive Data

**Secrets management:**
- API keys, DB passwords, JWT secrets, OAuth secrets: env vars ONLY
- Never log secrets. Mask sensitive fields in config logs.
- Never include secrets in error messages or API responses
- Never pass secrets as URL query parameters (browser history + server logs)
- Rotate secrets if ever committed to git (history retains them)

**Personal data handling:**
- Identify PII: email, name, phone, address, IP, payment info
- Encrypt PII at rest if required (GDPR, HIPAA, SOC2)
- Don't log PII — or redact/hash in logs
- Implement data deletion for account deletion requests
- Store payment info through a provider (Stripe) — never store card numbers yourself

---

## 9. Concurrency & Race Conditions

Race conditions are invisible during development, appear in production under load.

| Scenario | Problem | Fix |
|----------|---------|-----|
| Two users edit same document | Last write wins, changes lost | Optimistic locking (version check) or real-time sync |
| Double-click "Place Order" | Two orders created | Idempotency key: unique key on client, reject duplicate server-side |
| Two cron jobs same task | Duplicate processing | Distributed lock or claim mechanism |
| Concurrent counter increment | Lost updates | Atomic: `UPDATE SET balance = balance - 100` not read-then-write |
| Two API calls updating same row | Inconsistent state | DB transactions with appropriate isolation level |
| Background job + user action | Stale read | Refresh after background job, cache invalidation |

**Rule of thumb:** If two things can happen simultaneously and touch the same data, you have a potential race condition.

---

## 10. Third-Party Integrations

Every external service will go down eventually.

- **Timeout every call** (5-10 seconds max)
- **Retry with exponential backoff** for transient failures (max 3)
- **Cache responses** where possible (show cached data if service is down)
- **Design for degraded mode** (if email is down, queue and send later)
- **Store webhook payloads before processing** (replay if processing crashes)
- **Verify webhook signatures** (don't trust the source claim)
- **Pin API versions** in requests
- **Monitor usage** (response times, error rates, rate limit proximity)
