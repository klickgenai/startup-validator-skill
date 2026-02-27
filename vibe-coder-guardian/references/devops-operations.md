# DevOps & Operations — Enterprise Reference

Read this file when setting up infrastructure, CI/CD, monitoring, or deployment. Contains Docker, CI/CD templates, observability patterns, and deployment strategies.

---

## Docker

### When to Dockerize

- **Always** for production deployments
- **Always** for team projects (eliminates "works on my machine")
- **Optional** for solo local development (but recommended)

### Standard Dockerfile (Node.js)

```dockerfile
# ── Build Stage ──
FROM node:20-alpine AS builder
WORKDIR /app

# Dependencies first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Source code
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Production Stage ──
FROM node:20-alpine AS production
WORKDIR /app

# Security: non-root user
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup

# Production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Built artifacts from builder
COPY --from=builder /app/dist ./dist

# Security: drop privileges
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/api/health || exit 1

EXPOSE ${PORT:-3000}
CMD ["node", "dist/index.js"]
```

### Key Dockerfile Rules

1. **Multi-stage builds** — Build stage has devDependencies, production stage doesn't
2. **Non-root user** — Never run as root in production
3. **Layer caching** — Copy `package.json` before source code (dependencies change less often)
4. **Alpine base** — Smallest image, smallest attack surface
5. **Health check** — Container orchestrator needs to know if the app is healthy
6. **No secrets in image** — Use runtime environment variables, never bake secrets into layers
7. **`.dockerignore`** — Exclude `node_modules`, `.git`, `.env`, tests, docs

### .dockerignore

```
node_modules
.git
.gitignore
.env
.env.*
*.md
tests/
coverage/
.vscode/
.idea/
docker-compose*.yml
Dockerfile
.dockerignore
```

### docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: builder  # Use build stage for dev (has devDependencies)
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./src:/app/src  # Hot reload
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npm run dev

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

---

## CI/CD Pipeline

### GitHub Actions — Complete Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  # ── Stage 1: Quality Checks (parallel) ──
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run typecheck

  # ── Stage 2: Tests (after quality checks) ──
  test:
    needs: [lint, typecheck]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run test:ci
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  # ── Stage 3: Security Scan ──
  security:
    needs: [lint, typecheck]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm audit --audit-level=high
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --only-verified

  # ── Stage 4: Build (after tests pass) ──
  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  # ── Stage 5: Docker Build + Push (main only) ──
  docker:
    needs: [build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ── Stage 6: Deploy (main only, after Docker) ──
  deploy:
    needs: [docker]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: echo "Deploy step — customize per hosting provider"
```

### Pipeline Stages Explained

```
Push to Branch
    │
    ├──► Lint (parallel)        ← ESLint + Prettier check
    ├──► Type Check (parallel)  ← tsc --noEmit
    │
    ▼
    ├──► Unit + Integration Tests  ← Jest with coverage
    ├──► Security Scan (parallel)  ← npm audit + secret scanning
    │
    ▼
    Build                         ← TypeScript compilation
    │
    ▼
    Docker Build + Push           ← (main branch only)
    │
    ▼
    Deploy                        ← (main branch only, requires approval)
```

---

## Structured Logging

### Why Structured Logging

```
# BAD — unstructured, unparseable
console.log("User 123 created task 456 in 45ms");

# GOOD — structured JSON, queryable
{"level":"info","message":"Task created","userId":"123","taskId":"456","durationMs":45,"timestamp":"2026-02-27T10:00:00.000Z","correlationId":"req-abc"}
```

### Logger Setup

```typescript
// infrastructure/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  redact: {
    paths: ['password', 'token', 'authorization', 'cookie', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      correlationId: req.correlationId,
    }),
  },
});

export type Logger = typeof logger;
```

### Correlation IDs

Every request gets a unique ID that follows it through all logs:

```typescript
// middleware/correlation.middleware.ts
import { randomUUID } from 'crypto';

export function correlationMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.correlationId = req.headers['x-correlation-id'] as string ?? randomUUID();
  req.log = logger.child({ correlationId: req.correlationId });
  next();
}
```

### Log Levels

| Level | When | Example |
|-------|------|---------|
| `error` | Something broke, needs attention | Database connection failed, unhandled exception |
| `warn` | Something concerning, might break soon | Rate limit approaching, deprecated API called |
| `info` | Normal operations worth knowing | User registered, task completed, deploy started |
| `debug` | Development diagnostics | SQL query executed, cache hit/miss, request details |

### What to Log / What NOT to Log

| Log | Don't Log |
|-----|----------|
| Request method + URL + status + duration | Request/response bodies (too verbose) |
| User actions (created, updated, deleted) | Passwords, tokens, API keys |
| Errors with stack traces | Personally identifiable information (PII) |
| External service calls + duration | Health check requests (too noisy) |
| Business events (order placed, payment received) | Debug logs in production |

---

## Health Checks

### Application Health Check

```typescript
// routes/health.routes.ts
app.get('/api/health', async (_req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
    },
  };

  const isHealthy = Object.values(checks.checks).every(c => c.status === 'ok');
  res.status(isHealthy ? 200 : 503).json(checks);
});

async function checkDatabase(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  try {
    await db.query('SELECT 1');
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    return { status: 'error', latencyMs: Date.now() - start };
  }
}
```

### Three Types of Health Checks

| Type | Purpose | Endpoint |
|------|---------|----------|
| **Liveness** | "Is the process alive?" | `/health/live` — returns 200 if process is running |
| **Readiness** | "Can it handle requests?" | `/health/ready` — checks DB, cache, dependencies |
| **Startup** | "Is it done initializing?" | `/health/startup` — checks migrations, config loaded |

---

## Environment Management

### .env.example (Document Every Variable)

```bash
# ── Server ──
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# ── Database ──
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app

# ── Authentication ──
JWT_SECRET=           # Required. Min 32 characters. Generate: openssl rand -hex 32
JWT_EXPIRY=24h

# ── Redis (optional) ──
REDIS_URL=redis://localhost:6379

# ── External Services ──
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=

# ── Rate Limiting ──
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Startup Validation

```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('24h'),
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}
```

---

## Graceful Shutdown

```typescript
// index.ts
const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server started');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');

  // 1. Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // 2. Wait for in-flight requests (with timeout)
  const timeout = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30_000);

  try {
    // 3. Close database connections
    await db.close();
    // 4. Close Redis
    await redis?.quit();
    // 5. Flush logs
    logger.flush();

    clearTimeout(timeout);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

---

## Deployment Strategies

| Strategy | Risk | When |
|----------|------|------|
| **Rolling** | Low | Default. Replace instances one by one. |
| **Blue-Green** | Very Low | Two environments. Switch traffic. Instant rollback. |
| **Canary** | Lowest | Route 5% traffic to new version. Monitor. Scale up. |

### Rollback Plan

Every deploy needs a rollback plan:

1. **Application rollback:** Deploy previous version (keep last 3 Docker tags)
2. **Database rollback:** Every migration has a `down` script
3. **Feature rollback:** Feature flags to disable new features without deploying
4. **Data rollback:** Backups before destructive migrations

---

## Security Hardening

### HTTP Security Headers (Mandatory)

Every project MUST have these headers. This is a non-functional requirement that LLMs consistently skip.

```typescript
// middleware/security-headers.middleware.ts
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Remove server fingerprint
  res.removeHeader('X-Powered-By');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Disable legacy XSS filter (CSP replaces this)
  res.setHeader('X-XSS-Protection', '0');

  // Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
}

// Apply BEFORE routes:
// app.use(securityHeaders);
```

**All 7 headers are mandatory.** Missing any one = security issue in VERIFY phase.

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
}));

// Stricter limit on auth endpoints
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many auth attempts' } },
}));
```

### Dependency Scanning

```json
// package.json
{
  "scripts": {
    "audit": "npm audit --audit-level=high",
    "audit:fix": "npm audit fix"
  }
}
```

Run `npm audit` in CI. Fail the build on high/critical vulnerabilities.

---

## Project Configuration Files

### Essential Config Files (Create from Day 1 — Phase 0: BOOTSTRAP)

```
project/
├── .editorconfig         # Editor consistency (tabs, newlines, encoding)
├── .env.example          # Environment variable template
├── .eslintrc.json        # ESLint configuration
├── .gitignore            # Git ignore rules
├── .dockerignore         # Docker build ignore rules
├── .nvmrc                # Node.js version pinning
├── .prettierrc           # Prettier configuration
├── tsconfig.json         # TypeScript configuration
├── jest.config.ts        # Jest test configuration (with coverage thresholds)
├── Dockerfile            # Container build
├── docker-compose.yml    # Local development stack
└── .github/
    └── workflows/
        └── ci.yml        # CI/CD pipeline
```

### .editorconfig

```ini
# .editorconfig
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

### .nvmrc

```
20
```

### .prettierrc

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,
    "paths": {
      "@domain/*": ["./src/domain/*"],
      "@application/*": ["./src/application/*"],
      "@infrastructure/*": ["./src/infrastructure/*"],
      "@config/*": ["./src/config/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### ESLint Configuration

```json
// .eslintrc.json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-floating-promises": "error",
    "no-console": ["warn", { "allow": ["error"] }]
  }
}
```

### .gitignore

```
# Dependencies
node_modules/

# Build
dist/
build/

# Environment
.env
.env.local
.env.*.local

# Database
*.db
*.sqlite

# IDE
.vscode/
.idea/
*.swp
*.swo

# Test
coverage/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```
