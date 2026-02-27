# Research Agent Prompts

Read this file when launching agents in Intel Briefing mode. Copy the relevant prompt into the Task tool for each agent. Launch ALL 6 in parallel.

---

## Agent 1: Market Benchmark Agent

**Mission:** Find hard data on market rates, comparable deals, and industry standards for this exact negotiation type.

**Research targets:**
- Industry salary data (for comp): Glassdoor, Levels.fyi, Payscale, LinkedIn Salary Insights, H1B data
- Market rates for services (for freelance): industry surveys, freelancer platforms, agency rate cards
- Comparable deal terms (for business): public filings, press releases, industry reports, case studies
- Property comparables (for real estate): recent sales, listings, market trends, price-per-sqft
- Investment benchmarks (for funding): typical valuations at stage, standard terms, recent rounds

**Output format:**
```
MARKET BENCHMARK REPORT
1. PRIMARY BENCHMARK: [specific number/range with source]
2. COMPARABLE DATA POINTS: [3-5 specific data points]
3. TREND DIRECTION: [market moving up/down/stable + evidence]
4. GEOGRAPHIC ADJUSTMENT: [location-specific factors]
5. EXPERIENCE/QUALITY PREMIUM: [how user's specifics affect range]
6. RECOMMENDED ANCHOR RANGE: [specific range to anchor negotiations]
7. SOURCES: [every source cited]
```

---

## Agent 2: Counterparty Intelligence Agent

**Mission:** Research the other party — organization, financial health, recent moves, pain points, negotiation patterns.

**Research targets:**
- Company background (size, revenue, funding, growth stage)
- Recent news, press releases, job postings (priority signals)
- Glassdoor/employee reviews (culture, comp practices, pain points)
- Leadership profiles (decision-maker background, style)
- Financial health (public filings, funding, layoffs, expansion)
- Industry position (market share, competitive pressure, direction)

**Output format:**
```
COUNTERPARTY INTELLIGENCE REPORT
1. ORGANIZATION PROFILE: [size, stage, health]
2. FINANCIAL SIGNALS: [growth/contraction indicators]
3. STRATEGIC PRIORITIES: [what they care about most]
4. PAIN POINTS: [problems they're solving]
5. NEGOTIATION CULTURE: [how they typically negotiate]
6. DECISION-MAKING PROCESS: [who decides, how long]
7. PRESSURE POINTS: [where they're vulnerable]
8. WILDCARD FACTORS: [unexpected elements]
```

---

## Agent 3: BATNA & Alternatives Agent

**Mission:** Map alternatives for BOTH sides. Find options the user hasn't considered.

**Research targets:**
- User's alternatives beyond stated BATNA
- Counterparty's alternatives (other candidates, providers, options)
- Market liquidity (how easy for either side to find alternatives?)
- Time sensitivity (how do alternatives change over time?)
- Hidden alternatives (creative options neither side has considered)

**Output format:**
```
BATNA & ALTERNATIVES MAP

YOUR ALTERNATIVES (ranked):
1. [Alternative] — Feasibility: X/10, Value: $X
2. [Alternative] — Feasibility: X/10, Value: $X
3. [Alternative] — Feasibility: X/10, Value: $X

THEIR ALTERNATIVES (estimated):
1. [Alternative] — Likelihood: X/10, Cost to them: $X
2. [Alternative] — Likelihood: X/10, Cost to them: $X
3. [Alternative] — Likelihood: X/10, Cost to them: $X

BATNA POWER BALANCE: [score -5 to +5, who has stronger alternatives]
HIDDEN ALTERNATIVES: [creative options neither side considered]
TIME SENSITIVITY: [how BATNA changes over time for each side]
```

---

## Agent 4: Negotiation Framework Agent

**Mission:** Select optimal framework and psychological approach.

**Analysis:**
- Integrative vs Distributive (fixed pie or expandable?)
- Relationship weight (one-time vs ongoing?)
- Power dynamics (who holds more? how to shift?)
- Information asymmetry (who knows more? how to leverage/close gaps?)
- Cultural factors (norms, hierarchy, directness)
- Framework selection from: Harvard Principled, Voss Tactical Empathy, BATNA-driven positional, multi-issue integrative, anchoring/adjustment, collaborative problem-solving, competitive value-claiming

**Output format:**
```
FRAMEWORK SELECTION
PRIMARY: [name] — WHY: [reasons]
SECONDARY: [name] — FOR: [specific phases]

TYPE: [Integrative / Distributive / Mixed]
POWER BALANCE: [User advantage / Balanced / Counterparty advantage]
INFORMATION STRATEGY: [what to reveal, withhold, probe]
EMOTIONAL STRATEGY: [tone, energy, pace]

KEY PSYCHOLOGICAL PRINCIPLES:
1. [Principle] — Apply: [action]
2. [Principle] — Apply: [action]
3. [Principle] — Apply: [action]
```

---

## Agent 5: Communication & Persuasion Agent

**Mission:** Craft exact language for key negotiation moments.

**Deliverables:**
- Opening statement script (first 60 seconds)
- Anchor delivery script
- Value proposition framing
- Reframing techniques for counterarguments
- Silence deployment guide
- Question bank (20 powerful questions)
- Closing language
- Written templates (if negotiating via email/chat)

**Output format:**
```
COMMUNICATION PLAYBOOK
OPENING SCRIPT: "[exact words]"
ANCHOR SCRIPT: "[exact words]"
VALUE FRAME: "[exact words]"

TOP 10 POWER QUESTIONS:
1. "[question]" — Purpose: [what this reveals]
...

REFRAMING TOOLKIT:
If they say: "[objection]" → You say: "[reframe]"
...

EMAIL/MESSAGE TEMPLATES:
[Complete templates for written negotiations]
```

---

## Agent 6: Risk & Contingency Agent

**Mission:** Identify everything that could go wrong, build contingency plans.

**Analysis:**
- Top 10 risks and failure modes
- Emotional hijack scenarios (bad decision triggers)
- Dirty tactics and counters
- Deal structure risks (terms that look good but aren't)
- Post-agreement risks
- Escalation and de-escalation scenarios

**Output format:**
```
RISK & CONTINGENCY REPORT

TOP RISKS:
1. [Risk] — Probability: X/10 — Mitigation: [action]
...

DIRTY TACTICS DEFENSE:
If they: [tactic] → You: [counter]
...

EMOTIONAL TRIPWIRES:
Trigger: [scenario] → Protocol: [response]
...

NUCLEAR OPTIONS (last resort):
1. [Option] — Deploy when: [conditions]

POST-DEAL PROTECTION:
1. [Risk] → Safeguard: [include in agreement]
...
```
