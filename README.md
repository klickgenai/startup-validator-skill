# Claude Skills Collection

**Two powerful Claude skills for founders, professionals, and anyone making high-stakes decisions.**

Built for [Claude Desktop (Cowork Mode)](https://claude.ai) and [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

---

## Skills

| Skill | What It Does | Who It's For |
|-------|-------------|-------------- |
| **[Startup Idea Validator](./startup-validator/)** | Takes any startup idea from rough concept to research-backed GO / PIVOT / KILL decision | Founders, indie hackers, product teams |
| **[Negotiation War Room](./negotiation-war-room/)** | Turns any negotiation into a strategic operation with complete intelligence package | Everyone — salary, contracts, deals, real estate, freelance rates |

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
- **One-Page Battle Card** — THE cheat sheet you take into the room (target, anchor, walk-away, scripts, leverage points, objection responses, power questions, red lines)
- **Post-Negotiation Scorecard** — Value captured, dimension scores, verdict, lessons learned

### Key Principles:
- **Specificity over generality** — Exact scripts, specific numbers, concrete actions
- **Data anchors everything** — Every target justified by market research
- **Scripts over suggestions** — Ready-to-use words, not vague advice
- **Psychological awareness** — Cognitive bias exploitation and defense
- **Ethical boundaries** — Strategic framing yes, deception never
- **Honest assessment** — If your position is weak, you'll know before you walk in

---

## How to Use

### Option 1: Claude Desktop (Cowork Mode)

1. Copy the skill folder to your project's `.claude/skills/` directory:
   ```bash
   mkdir -p .claude/skills
   cp -r startup-validator .claude/skills/    # For Startup Validator
   cp -r negotiation-war-room .claude/skills/ # For Negotiation War Room
   ```
2. Open Claude Desktop in Cowork mode
3. Describe your situation — the skill triggers automatically

### Option 2: Claude Code (CLI)

1. Copy the skill folder to your project's `.claude/skills/` directory:
   ```bash
   mkdir -p .claude/skills
   cp -r startup-validator .claude/skills/    # For Startup Validator
   cp -r negotiation-war-room .claude/skills/ # For Negotiation War Room
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
- "How do I negotiate my rate/salary/rent/deal?"
- "The negotiation is done, let me debrief"

---

## Documentation

### Startup Validator
- **[Startup_Validator_Skill.pdf](./Startup_Validator_Skill.pdf)** — Visual overview with diagrams
- **[SKILL.md](./startup-validator/SKILL.md)** — Full skill definition
- **[references/api_reference.md](./startup-validator/references/api_reference.md)** — Agent prompt reference

### Negotiation War Room
- **[SKILL.md](./negotiation-war-room/SKILL.md)** — Full skill definition (the core engine)
- **[references/api_reference.md](./negotiation-war-room/references/api_reference.md)** — Agent architecture reference

---

## License

MIT License — use it, modify it, share it.

---

Built by [Vimal](https://github.com/klickgenai) — powered by Claude
