# Negotiation War Room — Agent Reference

This file documents the 6 parallel research agents deployed during the Intel Briefing phase. All agents launch simultaneously using the Task tool.

---

## Agent Architecture

```
User Input (4-round interview)
        │
        ▼
   Situation Brief
        │
        ├──► Agent 1: Market Benchmark Agent
        ├──► Agent 2: Counterparty Intelligence Agent
        ├──► Agent 3: BATNA & Alternatives Agent
        ├──► Agent 4: Negotiation Framework Agent
        ├──► Agent 5: Communication & Persuasion Agent
        └──► Agent 6: Risk & Contingency Agent
                │
                ▼
       Intelligence Dossier
                │
                ▼
     Strategy War Room (6 Deliverables)
                │
                ▼
        ONE-PAGE BATTLE CARD
```

---

## Agent Specifications

### Agent 1: Market Benchmark Agent
- **Purpose:** Find hard market data — rates, comparables, industry standards
- **Sources:** Glassdoor, Levels.fyi, Payscale, LinkedIn Salary, H1B data, industry reports, public filings, real estate listings, comparable deal databases
- **Output:** Market Benchmark Report with specific numbers, ranges, and source citations
- **Adaptation:** Changes research targets based on negotiation type (salary vs. real estate vs. business deal)

### Agent 2: Counterparty Intelligence Agent
- **Purpose:** Research the other party's organization, financial health, and negotiation patterns
- **Sources:** Company websites, Crunchbase, Glassdoor reviews, news articles, press releases, job postings, SEC filings, LinkedIn
- **Output:** Counterparty Intelligence Report with strategic priorities, pain points, and pressure points
- **Adaptation:** For individuals (e.g., landlords), focuses on market position and alternatives. For companies, focuses on financial health and culture.

### Agent 3: BATNA & Alternatives Agent
- **Purpose:** Map complete alternative landscape for both sides
- **Sources:** Job boards, marketplace listings, competitor offerings, industry supply/demand data
- **Output:** BATNA & Alternatives Map with ranked alternatives, feasibility scores, and power balance assessment
- **Adaptation:** Identifies hidden alternatives neither side has considered

### Agent 4: Negotiation Framework Agent
- **Purpose:** Select optimal negotiation strategy and psychological approach
- **Sources:** Situational analysis of power dynamics, relationship type, information asymmetry, cultural factors
- **Output:** Framework Selection Report with primary/secondary frameworks, psychological principles, and tactical approach
- **Frameworks available:** Harvard Principled, Chris Voss Tactical Empathy, Positional Bargaining, Integrative Logrolling, Anchoring Strategy, Collaborative Problem-Solving, Competitive Value-Claiming

### Agent 5: Communication & Persuasion Agent
- **Purpose:** Craft exact language, scripts, and messaging for key moments
- **Sources:** Negotiation context, counterparty intelligence, framework selection
- **Output:** Communication Playbook with opening scripts, anchor delivery, power questions, reframing toolkit, and email templates
- **Adaptation:** Adjusts tone and language for written vs. verbal, formal vs. informal, one-time vs. ongoing relationship

### Agent 6: Risk & Contingency Agent
- **Purpose:** Identify failure modes and build contingency plans
- **Sources:** Common negotiation pitfalls, counterparty analysis, deal structure analysis
- **Output:** Risk & Contingency Report with ranked risks, dirty tactics defense, emotional tripwires, and post-deal protections
- **Adaptation:** Focuses on industry-specific risks (e.g., clawback clauses in employment, inspection contingencies in real estate)

---

## Execution Rules

1. **All 6 agents MUST launch in parallel** — use a single message with 6 Task tool calls
2. **Every agent must cite sources** — no unsourced claims
3. **Agents adapt to negotiation type** — salary ≠ real estate ≠ M&A
4. **Agents are independent** — each produces its own complete report without depending on other agents' output
5. **Compilation happens AFTER all agents return** — the Intelligence Dossier synthesizes all 6 reports into a unified strategic picture
