# Startup Idea Validator — Claude Skill

**Take any startup idea from a rough concept to a research-backed GO / PIVOT / KILL decision with evidence, not opinions.**

This is an AI-powered skill for [Claude Desktop (Cowork Mode)](https://claude.ai) and [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that handles online research, generates customer interview scripts with scoring rubrics, and produces a final validation report.

---

## What It Does

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
- **Validation Tracker** (.xlsx) — Dashboard, online signals, competitor intel, app reviews, YouTube research, strategy solutions
- **Customer Interview Script** (.docx) — 6-section printable guide with inline scoring rubrics
- **Interview Kit** (.xlsx) — 22-column interview log with dropdowns, live dashboard with auto-calculated GO/PIVOT/KILL verdict, scoring rubrics, outreach tracker
- **Final Validation Report** (.docx) — 12-section comprehensive report combining online + human research

---

## How to Use

### Option 1: Claude Desktop (Cowork Mode)

1. Copy the `startup-validator/` folder to your project's `.claude/skills/` directory
2. Open Claude Desktop in Cowork mode
3. Describe your startup idea — the skill triggers automatically

### Option 2: Claude Code (CLI)

1. Copy the `startup-validator/` folder to your project's `.claude/skills/` directory:
   ```bash
   mkdir -p .claude/skills
   cp -r startup-validator .claude/skills/
   ```
2. Start a Claude Code session
3. Describe your startup idea — the skill triggers automatically

### Trigger Phrases

The skill activates when you say things like:
- "I have an idea for..."
- "Validate my startup idea"
- "Is there demand for..."
- "Help me with market research"
- "Check if this idea works"
- "I did my interviews, score my rubric"

---

## Scoring Rubrics

### Kill / Pivot / Go Logic

**KILL** (any one triggers):
- Core pain in top-3 for target users: < 3 of 15 interviews
- Would try the solution: < 4 of 15
- Would pay target price/mo: < 1 of 15

**PIVOT** (investigate further):
- Average pain score 2.5–3.4
- Average WTP 2.0–2.9
- Preferred model contradicts plan
- Online vs. interview data misalignment

**GO** (all must pass):
- Pain score avg >= 3.5/5
- Demo score avg >= 3.5/5
- WTP score avg >= 3.0/5
- Would use + would pay: >= 8 use & >= 5 pay of 15
- Commit Level 4+ >= 3 people
- Van Westendorp supports pricing
- No kill criteria triggered

---

## Documentation

- **[Startup_Validator_Skill.pdf](./Startup_Validator_Skill.pdf)** — Visual overview of the skill with diagrams and tables
- **[SKILL.md](./startup-validator/SKILL.md)** — Full skill definition (the file Claude reads)
- **[references/api_reference.md](./startup-validator/references/api_reference.md)** — Agent prompt reference

---

## Key Principles

- **Evidence over opinions** — Every claim must cite a source
- **Parallel execution** — Research agents run simultaneously for speed
- **Specific numbers** — Never "consider freemium." Always "$29/month base, targeting 1,000 users at $1.35M ARR"
- **Honest kill signals** — A fast "don't build this" is more valuable than a slow failure
- **The rubric is law** — Don't override kill/pivot/go criteria with vibes
- **Interviews beat internet** — 15 real conversations > 1,000 Reddit posts
- **Adapt to the industry** — Queries, communities, and pricing methods are customized per industry

---

## License

MIT License — use it, modify it, share it.

---

Built by [Vimal](https://github.com/klickgenai) — powered by Claude
