# Scoring Rubric & Final Report Structure

Read this file during Scoring Mode when the founder returns with interview data.

---

## Step 1: Ingest Interview Data

Ask the user:
- "Have you filled in the Interviews sheet in the tracker?" -> Read the xlsx
- "Or tell me your results and I'll enter them?" -> Collect via conversation

---

## Step 2: Calculate Rubric Scores

### A. Pain Validation

| Metric | Formula | Target |
|--------|---------|--------|
| [Core pain] in top-3 | COUNTIF(T, "Yes") | >= 10/15 |
| Avg hours/week on [task] | AVERAGE(F) | >= [threshold] |
| [Pain consequence] reported | Count mentions | >= 8/15 |
| Online + interview alignment | Compare to Phase 1 | Consistent |

### B. Solution Validation

| Metric | Formula | Target |
|--------|---------|--------|
| Avg demo score | AVERAGE(I) | >= 3.5/5 |
| Would use this | COUNTIF demo >= 3 | >= 8/15 |
| Open to [solution type] | COUNTIF(U, "Yes") | >= 8/15 |
| Preferred model majority | MODE(L) | Aligns with plan |

### C. Willingness to Pay

| Metric | Formula | Target |
|--------|---------|--------|
| Avg WTP score | AVERAGE(J) | >= 3.0/5 |
| Would pay $[target]+/mo | COUNTIF(S, "Yes") | >= 5/15 |
| Van Westendorp "Great Deal" | MEDIAN(O) | >= $[target] |
| Van Westendorp "Too Cheap" | MEDIAN(N) | < $[target] |

### D. Commitment Quality

| Metric | Formula | Target |
|--------|---------|--------|
| Commit Level 4+ | COUNTIF(R >= 4) | >= 3/15 |
| Commit Level 3+ | COUNTIF(R >= 3) | >= 8/15 |
| Referrals offered | Count | >= 5 |

---

## Step 3: Kill/Pivot/Go Logic

### KILL (any trigger):
- Core pain in top-3: < 3/15
- Would try solution: < 4/15
- Would pay target price: < 1/15

### PIVOT (any borderline):
- Avg pain 2.5-3.4: pain exists but not severe enough for current positioning
- Avg WTP 2.0-2.9: they want it but won't pay enough
- Preferred model contradicts plan: delivery model needs rethinking
- Online said X but interviews said Y: real-world differs from online signal

### GO (all must pass):
- Pain avg >= 3.5
- Demo avg >= 3.5
- WTP avg >= 3.0
- Would use >= 8 AND would pay >= 5
- Commit Level 4+ >= 3
- Van Westendorp supports pricing
- No kill criteria triggered

---

## Step 4: Pattern Analysis

**Top Quotes:** Pull best "money quotes" from column V. Group by theme: pain, excitement, concern, price reaction.

**Feature Request Clustering:** What features did multiple interviewees request that weren't planned? What planned features did nobody care about?

**Objection Mapping:** Top 3 reasons people said no. Which are solvable (features, messaging) vs fundamental (wrong market)?

**Segment Discovery:** Did a sub-segment score much higher? (e.g., "5+ year drivers scored 4.2 avg pain vs 2.8 for newer"). Is a "best customer" profile emerging?

**Online vs Interview Alignment:** Did online pain rankings match interview rankings? Any surprises the internet didn't surface?

---

## Step 5: Final Validation Report (.docx)

Generate with docx skill. 12 sections:

### 1. Executive Summary (1 page)
- Idea in one sentence
- Verdict: GO / PIVOT / KILL + confidence level
- 3 key findings
- Recommended immediate next action

### 2. Pain Validation (2-3 pages)
- Online signal evidence summary
- Interview evidence summary
- Pain score distribution
- Top pain quotes
- Online-vs-interview alignment
- Pain confidence: X/10

### 3. Solution Validation (2-3 pages)
- Demo reaction analysis
- Feature-by-feature interest
- Top feature requests
- Top objections + how to address
- Solution-market fit score

### 4. Pricing Validation (2 pages)
- Van Westendorp analysis
- Acceptable range: $[too cheap] - $[too expensive]
- Optimal point: $[great deal median]
- Comparison to proposed and competitor pricing
- Revenue projections at validated price

### 5. Competitive Landscape (2 pages)
- Updated competitor matrix
- Where we win vs lose
- Moat assessment
- Interviewees' competitor awareness

### 6. Customer Profile (1-2 pages)
- "Best customer" persona from highest-scoring interviewees
- Demographics, psychographics, behaviors
- What they currently pay/do
- Difference from low-scoring interviewees
- Estimated segment size

### 7. Rubric Scorecard (1 page)
- Full scorecard: every metric, target, actual, PASS/FAIL
- Traffic light summary
- Total PASS count
- Grade: A (strong go) / B (go with cautions) / C (borderline pivot) / D (pivot needed) / F (kill)

### 8. Strategic Recommendations (2-3 pages)
- Updated pricing (from Van Westendorp, not just competitors)
- Updated positioning (from what resonated)
- Updated GTM (from where interviewees hang out)
- Feature prioritization (from what they wanted)
- Trust-building plan (from actual objections)

### 9. If GO: 90-Day Build Plan (2 pages)
- Week 1-2: MVP scope (top 3 validated features)
- Week 3-6: Build + waitlist setup
- Week 7-8: Closed beta with Level 4-5 interviewees
- Week 9-10: Iterate on feedback
- Week 11-12: Public launch
- Milestones, metrics, budget estimate

### 10. If PIVOT: Pivot Options (2 pages)
- What to pivot on (segment, pricing, features, delivery)
- Specific hypotheses to test
- How many more interviews needed
- Revised timeline

### 11. If KILL: Lessons Learned (1 page)
- Why it didn't work (specific evidence)
- What's salvageable (tech, relationships, knowledge)
- Adjacent opportunities
- How to wind down

### 12. Appendix
- All source URLs
- Interview summary table (anonymized if requested)
- Raw rubric data
- Van Westendorp data

---

## Step 6: Update Tracker

Update xlsx with:
- Dashboard: all criteria scored with traffic lights
- Formulas calculating correctly
- Decision sheet: final PASS/FAIL + verdict
- New "Final Scores" sheet with full scorecard

---

## Step 7: Present Verdict

Share files and present concisely:
1. Verdict + confidence %
2. Pain reality: X/10
3. Solution fit: Demo avg + what worked/didn't
4. Pricing: Van Westendorp range vs target
5. Best customer: highest-scoring sub-segment
6. Biggest risk: one thing most likely to derail
7. Next step: what to do THIS WEEK
