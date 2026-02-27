# Claude Skills Collection

**Three powerful Claude skills for founders, vibe coders, and professionals making high-stakes decisions.**

Built for [Claude Desktop (Cowork Mode)](https://claude.ai) and [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

---

## Skills

| Skill | What It Does | Who It's For |
|-------|-------------|-------------- |
| **[Startup Idea Validator](./startup-validator/)** | Takes any startup idea from rough concept to research-backed GO / PIVOT / KILL decision | Founders, indie hackers, product teams |
| **[Negotiation War Room](./negotiation-war-room/)** | Turns any negotiation into a strategic operation with complete intelligence package | Everyone — salary, contracts, deals, real estate, freelance rates |
| **[Vibe Coder Guardian](./vibe-coder-guardian/)** | Turns Claude into a senior staff engineer that proactively catches bugs, security holes, feature clashes, and scaling issues — so vibe coders ship production-grade code without the panic | Vibe coders, AI-first builders, non-engineers building software |

---

## Skill 1: Startup Idea Validator

**Take any startup idea from a rough concept to a research-backed GO / PIVOT / KILL decision with evidence, not opinions.**

| Mode | What Happens |
|------|-------------|
| **Interview Mode** | Builds the problem/solution brief through guided questions (4 rounds) |
| **Research Mode** | Runs multi-agent online analysis (Reddit, forums, YouTube, app stores, competitors) + generates human validation toolkit |
| **Scoring Mode** | Scores real interview data against rubrics, produces final GO/PIVOT/KILL verdict |

### Research Mode runs 6 parallel AI agents:
1. **Reddit & Forum Mining** — Searches 8+ queries across Reddit, industry forums, YouTube, app stores
2. **Competitor Mapping** — Maps every competitor with pricing, features, funding, threat level
3. **Pricing Strategy** — Exact tier names/prices, revenue projections, LTV/CAC estimates
4. **Differentiation Strategy** — Wedge feature, positioning statement, moat strategy
5. **Trust & Adoption** — 90-day trust-building timeline, messaging guide, community strategy
6. **Go-to-Market** — Channel rankings with CAC, specific communities/podcasts/conferences

### Deliverables:
- **Validation Tracker** (.xlsx) — Dashboard, online signals, competitor intel, strategy solutions
- **Customer Interview Script** (.docx) — 6-section printable guide with inline scoring rubrics
- **Interview Kit** (.xlsx) — 22-column interview log with live GO/PIVOT/KILL dashboard
- **Final Validation Report** (.docx) — 12-section comprehensive report combining online + human research

### Kill / Pivot / Go Logic

**KILL** (any one triggers): Core pain < 3/15, Would try < 4/15, Would pay < 1/15

**PIVOT** (investigate): Pain avg 2.5–3.4, WTP 2.0–2.9, model mismatch, data misalignment

**GO** (all must pass): Pain avg >= 3.5, Demo avg >= 3.5, WTP avg >= 3.0, Use+Pay >= 8+5/15, Commit 4+ >= 3

---

## Skill 2: Negotiation War Room

**Turn any negotiation into a strategic operation. Get a $5K consulting-level negotiation intelligence package in minutes.**

Most people leave $10K–$1M+ on the table in major negotiations because they wing it. This skill gives you the same strategic edge that negotiation consultants charge $500+/hr for.

| Mode | What Happens |
|------|-------------|
| **Intel Briefing** | 4-round contextual interview → 6 parallel research agents → Intelligence Dossier |
| **Strategy War Room** | Complete negotiation package: ZOPA map, concession ladder, objection playbook, battle card |
| **Debrief** | Post-negotiation scoring, pattern analysis, lessons learned |

### Works for ANY negotiation type:

| Type | Examples |
|------|----------|
| **Salary & Compensation** | Job offers, raises, promotions, equity packages |
| **Freelance & Consulting** | Rate setting, scope negotiation, retainer terms |
| **Business Deals** | Partnerships, M&A, licensing, vendor contracts |
| **Real Estate** | Buying, selling, leasing — commercial and residential |
| **Funding & Investment** | Term sheets, valuations, SAFE notes, deal terms |
| **Service Agreements** | SaaS contracts, outsourcing, agency engagements |
| **Dispute Resolution** | Settlements, refunds, contract disputes |
| **Everyday High-Stakes** | Car purchases, medical bills, rent, insurance claims |

### Intel Briefing runs 6 parallel research agents:
1. **Market Benchmark Agent** — Industry rates, comparable deals, market data with specific numbers
2. **Counterparty Intelligence Agent** — Organization profile, financial signals, pain points, pressure points
3. **BATNA & Alternatives Agent** — Ranked alternatives for both sides, power balance scoring
4. **Negotiation Framework Agent** — Optimal strategy selection (Harvard Principled, Chris Voss, Integrative, etc.)
5. **Communication & Persuasion Agent** — Opening scripts, anchor delivery, power questions, email templates
6. **Risk & Contingency Agent** — Top 10 risks, dirty tactics defense, emotional tripwires, post-deal protection

### Deliverables:
- **Intelligence Dossier** — Synthesized research from all 6 agents
- **ZOPA & Anchor Map** — Your range, their range, overlap zone, specific anchor point with justification
- **Concession Ladder** — What to give up, in what order, with what conditions, what to get in return
- **Objection Handling Playbook** — Top 10 objections with exact response scripts
- **Scenario Decision Trees** — 5 branching if-then paths with specific actions
- **Written Negotiation Templates** — 5 ready-to-send email/message templates
- **One-Page Battle Card** — THE cheat sheet you take into the room
- **Post-Negotiation Scorecard** — Value captured, dimension scores, verdict, lessons learned

---

## Skill 3: Vibe Coder Guardian

**Stop shipping code that breaks at 2 AM. This skill turns Claude into a senior staff engineer that proactively catches every issue vibe coders don't know to check for.**

The #1 problem with vibe coding: you describe a feature, AI builds it, it works... until it doesn't. A new feature silently breaks an old one. A user enters unexpected input and the app crashes. The database has no constraints and data gets corrupted. There are no tests, so nobody knows something is broken until users complain.

**This skill fixes all of that — automatically.**

### How It Works

Unlike the other skills, this one doesn't have "modes" you trigger. It's a **behavioral framework** — it changes how Claude writes and reviews code in every interaction. Think of it as installing a senior engineer's instincts into your AI pair programmer.

```
Every coding interaction follows 5 automatic phases:

UNDERSTAND → Read existing code, map blast radius, identify risks
PLAN       → Check for feature clashes, make architecture decisions, consider scale
BUILD      → Write code with every guardrail active (validation, errors, security, edge cases)
VERIFY     → Run tests, regression check, security scan, feature clash verification
EXPLAIN    → Tell you what was built, what to test, flag any risks in plain English
```

### What It Catches (That You'd Never Think to Check)

| Problem | What Happens Without Guardian | What Guardian Does |
|---------|-------------------------------|---------------------|
| **Feature clash** | New feature silently breaks 2 existing features | Runs Feature Clash Checklist before writing any new feature code |
| **No input validation** | User pastes 50K characters or emoji, app crashes | Validates ALL inputs: type, length, format, range, sanitization |
| **Missing error handling** | White screen of death, infinite spinner, "undefined" shown to users | Error handling on every external call, loading/error/empty states on every UI component |
| **Auth bypass** | Hidden admin button... but the API endpoint has no auth check | Checks authentication AND authorization on every endpoint, catches ownership bugs |
| **SQL injection** | Attacker drops your database via a search field | Parameterized queries enforced, never string concatenation |
| **No tests** | Change one file, break three others, nobody knows | Runs existing tests, writes new tests for new code, flags untested critical paths |
| **Race conditions** | Two users edit same thing, one's changes disappear | Identifies concurrent access patterns, applies transactions/locking/idempotency |
| **Scaling bombs** | Works for 10 users, database melts at 1,000 | Pagination on every list, indexes on queried columns, no N+1 queries, no unbounded SELECTs |
| **Hardcoded secrets** | API keys committed to git, leaked to the world | Flags any secret in code immediately, enforces environment variables |
| **"Works on localhost"** | App works in dev, breaks in production | Checks for environment-specific code, missing env vars, CORS, path issues |

### Guardian Checklists (Run Automatically)

The skill includes specific checklists for every type of change:

- **New Endpoint Checklist** — Input validation, auth, authorization, error handling, rate limiting, parameterized queries, tests
- **New Database Table Checklist** — Primary keys, foreign keys, constraints, indexes, timestamps, reversible migrations
- **New UI Component Checklist** — Loading/error/empty states, mobile responsive, double-click protection, accessibility
- **New Feature Checklist** — Blast radius mapping, feature clash detection, pattern compliance, edge cases, regression check
- **Security Quick-Scan** — Secrets, auth, authorization, input sanitization, CORS, error message leaks
- **Pre-Deploy Checklist** — Tests pass, no secrets, env vars documented, migrations tested, error tracking configured

### 10 Common Vibe Coder Pitfalls It Catches

1. **"It Works on Localhost"** — Hardcoded URLs, different DB engines, missing env vars
2. **"I'll Add Tests Later"** — Silent regressions, changes breaking unrelated features
3. **"Just Store It in State"** — Data lost on refresh, out of sync across tabs
4. **"The API Returns Whatever"** — Inconsistent response shapes, no pagination, 200 for errors
5. **"Nobody Would Do That"** — Emoji in names, huge pastes, .exe uploads, deep link navigation
6. **"I'll Handle Errors Later"** — White screens, infinite spinners, "undefined" and "NaN" in the UI
7. **"Let Me Just Add This Quick Feature"** — New feature works, two existing features now broken
8. **"The Database Handles That"** — No constraints, ORM bypasses, dropped migrations
9. **"We Can Scale Later"** — No pagination, no indexes, N+1 queries, unbounded SELECTs
10. **"The Frontend Handles Auth"** — API endpoints with no auth checks, anyone with the URL can access

---

## How to Use

### Option 1: Claude Desktop (Cowork Mode)

1. Copy the skill folder(s) to your project's `.claude/skills/` directory:
   ```bash
   mkdir -p .claude/skills
   cp -r startup-validator .claude/skills/    # For Startup Validator
   cp -r negotiation-war-room .claude/skills/ # For Negotiation War Room
   cp -r vibe-coder-guardian .claude/skills/   # For Vibe Coder Guardian
   ```
2. Open Claude Desktop in Cowork mode
3. Start working — skills activate automatically based on context

### Option 2: Claude Code (CLI)

1. Copy the skill folder(s) to your project's `.claude/skills/` directory:
   ```bash
   mkdir -p .claude/skills
   cp -r startup-validator .claude/skills/    # For Startup Validator
   cp -r negotiation-war-room .claude/skills/ # For Negotiation War Room
   cp -r vibe-coder-guardian .claude/skills/   # For Vibe Coder Guardian
   ```
2. Start a Claude Code session
3. Start working — skills activate automatically based on context

### Trigger Phrases

**Startup Validator:**
- "I have an idea for..."
- "Validate my startup idea"
- "Is there demand for..."
- "I did my interviews, score my rubric"

**Negotiation War Room:**
- "I need to negotiate..."
- "Help me prepare for a negotiation"
- "I got a job offer and want to negotiate"
- "How do I negotiate my rate/salary/rent/deal?"
- "The negotiation is done, let me debrief"

**Vibe Coder Guardian:**
- No trigger needed — always active when writing code
- Just describe what you want to build and the guardrails activate automatically
- "Build me a user registration page"
- "Add a shopping cart feature"
- "Fix this bug" / "Add this feature"

---

## Documentation

### Startup Validator
- **[Startup_Validator_Skill.pdf](./Startup_Validator_Skill.pdf)** — Visual overview with diagrams
- **[SKILL.md](./startup-validator/SKILL.md)** — Full skill definition
- **[references/api_reference.md](./startup-validator/references/api_reference.md)** — Agent prompt reference

### Negotiation War Room
- **[SKILL.md](./negotiation-war-room/SKILL.md)** — Full skill definition (the core engine)
- **[references/api_reference.md](./negotiation-war-room/references/api_reference.md)** — Agent architecture reference

### Vibe Coder Guardian
- **[SKILL.md](./vibe-coder-guardian/SKILL.md)** — Full skill definition (the behavioral framework)
- **[references/checklists.md](./vibe-coder-guardian/references/checklists.md)** — Quick-reference checklists

---

## License

MIT License — use it, modify it, share it.

---

Built by [Vimal](https://github.com/klickgenai) — powered by Claude
