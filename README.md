# Claude Skills Collection

**Three powerful Claude skills for founders, builders, and professionals making high-stakes decisions.**

Built for [Claude Desktop (Cowork Mode)](https://claude.ai) and [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

---

## Architecture: Lean Core + On-Demand References

Each skill uses a **thin core, fat references** architecture to keep context consumption low while maintaining depth:

```
skill-folder/
├── SKILL.md              # Lean core (~200-280 lines) — loaded into context
└── references/           # Detailed guides — loaded on demand when needed
    ├── checklists.md
    ├── build-guardrails.md
    └── ...
```

**Why this matters:** The SKILL.md gets loaded into Claude's context window on every interaction. A 700-line file consumes ~15K tokens permanently. By keeping the core lean and moving detailed patterns into reference files that are read only when needed, we reduce context consumption by 50-60% while maintaining all the depth.

| Layer | What it contains | When it's loaded |
|-------|-----------------|-----------------|
| **SKILL.md** | Behavior, phases, decision gates, non-negotiable rules | Always (injected into context) |
| **references/** | Detailed checklists, code patterns, templates, examples | On demand (agent reads when entering that phase) |

---

## Skills

| Skill | What It Does | Who It's For |
|-------|-------------|-------------- |
| **[Startup Idea Validator](./startup-validator/)** | Takes any startup idea from rough concept to research-backed GO / PIVOT / KILL decision | Founders, indie hackers, product teams |
| **[Negotiation War Room](./negotiation-war-room/)** | Turns any negotiation into a strategic operation with complete intelligence package | Everyone — salary, contracts, deals, real estate, freelance rates |
| **[Vibe Coder Guardian](./vibe-coder-guardian/)** | Senior staff engineer that proactively catches bugs, security holes, and feature clashes | Builders, vibe coders, AI-first developers |

---

## Skill 1: Startup Idea Validator

**Take any startup idea from a rough concept to a research-backed GO / PIVOT / KILL decision with evidence, not opinions.**

| Mode | What Happens |
|------|-------------|
| **Interview Mode** | Builds the problem/solution brief through guided questions (4 rounds) |
| **Research Mode** | Runs 6 parallel agents (Reddit, forums, YouTube, competitors) + generates human validation toolkit |
| **Scoring Mode** | Scores real interview data against rubrics, produces final GO/PIVOT/KILL verdict |

### File Structure
```
startup-validator/
├── SKILL.md                          # Core: modes, interview flow, scoring criteria
└── references/
    ├── agent-prompts.md              # Exact prompts for 6 research agents
    ├── interview-toolkit.md          # Deliverable specs (tracker, script, kit)
    └── scoring-rubric.md             # Scoring formulas, report structure
```

### Deliverables
- **Validation Tracker** (.xlsx) — Dashboard, online signals, competitor intel, strategy solutions
- **Customer Interview Script** (.docx) — 6-section printable guide with inline scoring rubrics
- **Interview Kit** (.xlsx) — 22-column interview log with live GO/PIVOT/KILL dashboard
- **Final Validation Report** (.docx) — 12-section comprehensive report combining online + human research

### Kill / Pivot / Go Logic

**KILL** (any one triggers): Core pain < 3/15, Would try < 4/15, Would pay < 1/15

**PIVOT** (investigate): Pain avg 2.5-3.4, WTP 2.0-2.9, model mismatch, data misalignment

**GO** (all must pass): Pain avg >= 3.5, Demo avg >= 3.5, WTP avg >= 3.0, Use+Pay >= 8+5/15, Commit 4+ >= 3

---

## Skill 2: Negotiation War Room

**Turn any negotiation into a strategic operation. Get a $5K consulting-level intelligence package in minutes.**

| Mode | What Happens |
|------|-------------|
| **Intel Briefing** | 4-round interview, 6 parallel research agents, Intelligence Dossier |
| **Strategy War Room** | Complete package: ZOPA map, concession ladder, objection playbook, battle card |
| **Debrief** | Post-negotiation scoring, pattern analysis, lessons learned |

### File Structure
```
negotiation-war-room/
├── SKILL.md                          # Core: modes, interview flow, principles
└── references/
    ├── agent-prompts.md              # Exact prompts for 6 research agents
    ├── deliverable-templates.md      # Formats for all 6 strategy deliverables
    └── debrief-framework.md          # Scoring and analysis structure
```

### Works for ANY negotiation type
Salary, freelance rates, business deals, real estate, funding, service agreements, disputes, car purchases, medical bills, rent, insurance claims.

### Deliverables
- **Intelligence Dossier** — Synthesized research from all 6 agents
- **ZOPA & Anchor Map** — Ranges, overlap zone, justified anchor point
- **Concession Ladder** — Round-by-round positions with conditions
- **Objection Handling Playbook** — Top 10 objections with exact response scripts
- **Scenario Decision Trees** — 5 branching if-then paths
- **Written Negotiation Templates** — 5 ready-to-send emails
- **One-Page Battle Card** — THE cheat sheet for the room

---

## Skill 3: Vibe Coder Guardian

**A senior staff engineer that proactively catches bugs, security holes, feature clashes, and scaling issues — without being asked.**

### File Structure
```
vibe-coder-guardian/
├── SKILL.md                          # Core: 5 phases, decision gates, 10 non-negotiable rules
└── references/
    ├── checklists.md                 # All quick-reference checklists
    ├── build-guardrails.md           # Detailed code patterns and examples
    └── pitfalls.md                   # 10 common pitfalls with fixes
```

### Always-On Behavior
No trigger needed. Runs automatically on every code interaction through 5 phases:

| Phase | What Happens |
|-------|-------------|
| **UNDERSTAND** | Read code, map blast radius, check patterns |
| **PLAN** | Feature clash detection, architecture check, scale sanity |
| **BUILD** | Write code with 10 non-negotiable guardrails |
| **VERIFY** | Run tests, regression check, security scan |
| **EXPLAIN** | Summary, protections, manual test suggestions, risk flags |

### Transparency Features
- **Status updates** after every phase (user always knows what's happening)
- **Decision gates** between phases (stop and ask when uncertain)
- **Issue tracking** with severity levels (never claim "done" with open issues)

### 10 Non-Negotiable Rules
1. Parameterized queries only
2. Never hardcode secrets
3. Auth on every endpoint
4. Validate all external input
5. Error handling on every external call
6. Consistent API responses
7. Database integrity enforced
8. No secrets in logs or errors
9. Handle race conditions
10. Third-party timeouts and retries

---

## How to Use

### Option 1: Claude Desktop (Cowork Mode)

1. Copy the skill folder to your project's `.claude/skills/` directory:
   ```bash
   mkdir -p .claude/skills
   cp -r startup-validator .claude/skills/
   cp -r negotiation-war-room .claude/skills/
   cp -r vibe-coder-guardian .claude/skills/
   ```
2. Open Claude Desktop in Cowork mode
3. Describe your situation — the skill triggers automatically

### Option 2: Claude Code (CLI)

1. Copy the skill folder to your project's `.claude/skills/` directory:
   ```bash
   mkdir -p .claude/skills
   cp -r startup-validator .claude/skills/
   cp -r negotiation-war-room .claude/skills/
   cp -r vibe-coder-guardian .claude/skills/
   ```
2. Start a Claude Code session
3. Describe your situation — the skill triggers automatically

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
- "The negotiation is done, let me debrief"

**Vibe Coder Guardian:**
- No trigger needed — always active
- Just describe what you want to build

---

## Documentation

### Startup Validator
- **[Startup_Validator_Skill.pdf](./Startup_Validator_Skill.pdf)** — Visual overview with diagrams
- **[SKILL.md](./startup-validator/SKILL.md)** — Core skill definition
- **[references/](./startup-validator/references/)** — Agent prompts, toolkit specs, scoring rubric

### Negotiation War Room
- **[SKILL.md](./negotiation-war-room/SKILL.md)** — Core skill definition
- **[references/](./negotiation-war-room/references/)** — Agent prompts, deliverable templates, debrief framework

### Vibe Coder Guardian
- **[SKILL.md](./vibe-coder-guardian/SKILL.md)** — Core skill definition
- **[references/](./vibe-coder-guardian/references/)** — Checklists, build guardrails, pitfalls

---

## License

MIT License — use it, modify it, share it.

---

Built by [Vimal](https://github.com/klickgenai) — powered by Claude
