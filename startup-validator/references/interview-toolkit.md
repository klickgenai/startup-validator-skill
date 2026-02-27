# Interview Toolkit — Deliverable Specifications

Read this file when generating deliverables after research agents complete. Contains exact specs for the Validation Tracker, Interview Script, and Interview Kit.

---

## Deliverable 1: Validation Tracker (.xlsx)

Create with the xlsx skill. Sheets:

- **Dashboard**: Kill/Pivot/Go criteria with current status (online research pre-filled, interview fields ready)
- **Online Signals**: 20 rows of research findings with sources
- **Competitor Intel**: Full competitor matrix + market size + pricing landscape
- **App Reviews**: Competing product review analysis
- **YouTube Research**: Creator/influencer list with contact info
- **Strategy Solutions**: Pricing tiers, feature matrix, trust timeline, GTM channels
- **Sources**: All URLs and publications cited

Plus the validation checklist (see below).

---

## Deliverable 2: Customer Interview Script (.docx)

Create with the docx skill. Professional, printable guide with:

**Section 1: Opening & Rapport (2-3 min)**
- "Tell me about your day-to-day as a [role]"
- "What takes up most of your time?"
- Rapport-building that leads naturally to the pain area

**Section 2: Pain Discovery (10-15 min)**
- "Walk me through how you handle [task/pain area] today"
- "What's the most frustrating part of [workflow]?"
- "Tell me about the last time [pain situation] happened"
- "How much time/money does [problem] cost you per week?"
- "What have you tried to solve this? Why didn't it work?"
- Follow-up probes from online research findings

**Section 3: Solution Reaction (5-8 min)**
- Brief demo/description of proposed solution
- "What's your first reaction?"
- "Would this have helped in the situation you described?"
- "What's missing? What would make you nervous?"
- Score 1-5 with inline rubric:
  - 1 = Not interested
  - 2 = Mild interest, many concerns
  - 3 = Sees value, wouldn't switch yet
  - 4 = Excited, would try, some concerns
  - 5 = Take my money

**Section 4: Willingness to Pay — Van Westendorp (3-5 min)**
Four pricing questions in order:
- "At what price would this be so cheap you'd doubt its quality?" (Too Cheap)
- "At what price would this be a great deal?" (Great Deal)
- "At what price would this start to feel expensive but you'd still consider it?" (Getting Expensive)
- "At what price would this be too expensive?" (Too Expensive)
- "Would you pay $[recommended price]/month?"
- "What would you compare this cost to?"

**Section 5: Commitment & Close (3-5 min)**
- "If this existed today, would you sign up for a free trial?"
- "Would you pay for it? At what price?"
- "Do you know 3 people who would also want this?"
- "Can I follow up with you when we have a beta?"
- Commitment levels:
  - Level 1: "Sounds interesting" (polite, not a signal)
  - Level 2: "I'd try free version" (mild)
  - Level 3: "I'd pay for that" (strong)
  - Level 4: "How do I sign up?" (very strong)
  - Level 5: "I'll pay now / share with network" (unicorn)

**Section 6: AI/Tech Sentiment (for AI/tech products)**
- "How do you feel about AI tools in your work?"
- "What AI tools have you tried? What happened?"
- "What would make you trust an AI tool for [critical task]?"
- Score: Hostile / Skeptical / Curious / Enthusiastic

---

## Deliverable 3: Interview Kit (.xlsx)

Separate file from Validation Tracker. Ready to use immediately.

**Sheet 1: Interview Log**

22 columns, pre-formatted with dropdowns and conditional formatting:

| Col | Header | Format |
|-----|--------|--------|
| A | # | Auto 1-20 |
| B | Name / ID | Text |
| C | Date | Date |
| D | Source | Dropdown: Reddit / Forum / Referral / Cold DM / Conference / Other |
| E | Years in Role | Number |
| F | Hours/Week on [Pain] | Number |
| G | Top #1 Pain | Text |
| H | Pain Score | 1-5 (red 1-2, yellow 3, green 4-5) |
| I | Demo Score | 1-5 (same colors) |
| J | WTP Score | 1-5 (same colors) |
| K | AI Sentiment | Dropdown: Hostile / Skeptical / Curious / Enthusiastic |
| L | Preference | Dropdown (customized per product) |
| M | Top Concern | Text |
| N | Too Cheap $ | Currency |
| O | Great Deal $ | Currency |
| P | Expensive $ | Currency |
| Q | Too Expensive $ | Currency |
| R | Commit Level | 1-5 (same colors) |
| S | Would Pay $[X]+? | Dropdown: Yes / No |
| T | [Core Pain] Top-3? | Dropdown: Yes / No |
| U | Open to [Solution]? | Dropdown: Yes / No |
| V | Money Quote | Text |

Row 22 (Summary): AVERAGE for scores, COUNTIF for Yes counts, MEDIAN for Van Westendorp, COUNT for total.

**Sheet 2: Live Dashboard**

Auto-updating from Interview Log:

Kill Criteria (red header):
- [Core pain] in top-3: target >= 10/15
- Would try [solution]: target >= 8/15
- Would pay $[X]+/mo: target >= 5/15

Go Criteria (green header):
- Avg Pain Score: target >= 3.5
- Avg Demo Score: target >= 3.5
- Avg WTP Score: target >= 3.0
- Commit Level 4+: target >= 3

Pricing Section: Van Westendorp medians, recommended range

Final Verdict Cell: IF any kill triggered -> KILL. Else if all go pass -> GO. Else -> PIVOT

Progress Bar: interviews done / 15

**Sheet 3: Scoring Rubrics**
Reference sheet with score definitions for Pain (1-5), Demo (1-5), WTP (1-5), Commit Level (1-5), AI Sentiment.

**Sheet 4: Outreach Tracker**
Columns: Name/Handle, Platform, Date Contacted, Message Template, Response, Interview Scheduled, Date, Notes.
Pre-populate with targets from online research.

---

## Outreach Templates

Include in the kit or interview script:

**Reddit/Forum DM:**
```
Hey [name] — saw your post about [specific pain].
I'm researching [problem area] and would love to hear more about your experience.
20-min chat? No sales pitch — just understanding the problem.
Happy to [buy coffee / share findings / Venmo $20].
```

**Cold Social DM (LinkedIn/Facebook/X):**
```
Hi [name] — I noticed you're a [role]. I'm researching [pain area].
Would you share your experience? 20 minutes, totally informal.
```

**Referral Ask (after good interview):**
```
Thanks so much — this was incredibly helpful.
Do you know 2-3 other [target users] who deal with [pain] I could talk to?
```

**YouTube Creator Outreach:**
```
Hey [creator] — love your content on [topic].
I'm building [product type] for [target users].
Would love your perspective on [pain area] — happy to share our research with your community.
```

---

## Validation Checklist (add to tracker)

Phase-by-phase checklist with Done? and Status columns:

**Phase 1: Online Signal Mining** (auto-checked by agents)
- Search 10+ Reddit threads, 3+ forums, 20+ app reviews
- Identify 5+ YouTube channels, map 5+ competitors with pricing
- Validate market size from 2+ sources, calculate TAM/SAM/SOM

**Phase 2: Outreach & Recruitment** (founder)
- Post in 3+ communities, send 20+ DMs, reach out to 3+ YouTubers
- Set up scheduling link, prepare incentive, target 15+ slots

**Phase 3: Discovery Interviews** (founder)
- Complete 1-5, review patterns. Complete 6-10, check dashboard. Complete 11-15.

**Phase 4: Demo Reactions** (founder)
- Create 2-min demo, show to all 15, record scores and feedback

**Phase 5: Pricing Validation** (founder)
- Run Van Westendorp on all 15, record 4 price points, calculate medians

**Phase 6: Landing Page Smoke Test** (founder)
- Build page, drive 200+ visitors, measure 5%+ conversion, A/B test one element

**Phase 7: Final Synthesis** (bring back to skill)
- All data entered, dashboard calculated, run Scoring Mode, final report generated
