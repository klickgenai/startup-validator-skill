# Research Agent Prompts

Read this file when launching agents in Research Mode. Copy the relevant prompt into the Task tool for each agent. Launch ALL 6 in parallel.

---

## Agent 1: Reddit & Forum Mining

```
Search for evidence of [the target user]'s pain points online.

Run these searches (adapt keywords to the specific industry):
1. "[pain point keyword]" site:reddit.com [industry]
2. "[current tool/product] frustrating OR sucks" site:reddit.com
3. "[competitor name] review" site:reddit.com
4. "[target user type] biggest challenge" site:reddit.com
5. "AI [industry]" site:reddit.com (if AI-related)
6. "[target user] hours per week [task]" site:reddit.com
7. "[industry] forum [pain point]"
8. "[product category] app review complaints"

Also search the top 2-3 industry-specific forums.
Also search YouTube for relevant creator channels (5-10).
Also search app store reviews for competing products (20-30 reviews).

For each finding, record:
- Source (subreddit/forum/YouTube/app store)
- Search query used
- Number of relevant posts found
- Key quote (<15 words, paraphrased)
- Engagement metric (upvotes, views, rating)
- Date
- URL
- Pain type category

Compile a summary with:
- Total posts/reviews found about the pain
- Top 3 pain points ranked by frequency
- AI/tech sentiment breakdown (positive/negative/unaware)
- Competitor awareness level
- Confidence score (1-10) that the pain exists
- 5 YouTube channels/creators identified as potential interview candidates
- 5 worst app store complaints about existing tools
```

---

## Agent 2: Competitor Mapping

```
Map every competitor in the [industry] space for [solution type].

For each competitor found, record:
- Company name
- Pricing (exact numbers from their website)
- Target market
- Key features (verified from their site, not assumed)
- Funding (from Crunchbase, TechCrunch, press releases)
- User sentiment (from reviews, forums)
- Threat level (HIGH/MEDIUM/LOW)

Also research and validate:
- Market size (TAM/SAM/SOM with sources)
- Industry growth rate (CAGR with source)
- Average cost of current solution for target user
- Target user income/budget data

Deliver a feature comparison matrix: our product vs. all competitors.
Deliver a pricing landscape table.
Deliver market size validation with 2+ independent sources.
```

---

## Agent 3: Pricing Strategy

```
Based on the competitive landscape [summarize competitor prices],
recommend a specific pricing strategy for [product].

Deliver:
- Exact tier names, prices, and what's included
- Free trial structure (duration, features, CC required?)
- Revenue projections at 300, 1,000, and 5,000 customers
- How to compete with [cheapest competitor] on price
- Anchoring strategy against [expensive current alternative]
- LTV and CAC estimates
```

---

## Agent 4: Differentiation Strategy

```
Based on the feature matrix [summarize what competitors offer],
identify how [product] should differentiate.

Deliver:
- The #1 "wedge feature" — the thing no competitor does
- Positioning statement (one sentence)
- 3 "only we can do this" claims backed by research
- What NOT to compete on (where competitors are stronger)
- Moat strategy (data network effects, switching costs, etc.)
```

---

## Agent 5: Trust & Adoption Strategy

```
Research how to overcome [target user] skepticism about [solution type].

Deliver:
- 90-day trust-building timeline (week by week)
- Messaging: words to avoid vs. words that work for this audience
- Community infiltration strategy (which communities, what to post)
- Referral program design for this user segment
- Demo strategy for skeptical users
```

---

## Agent 6: Go-to-Market Strategy

```
Research the best channels to reach [target user segment].

Deliver:
- Channel-by-channel list with: name, audience size, CAC estimate, timeline
- Specific community names + sizes (forums, Facebook groups, subreddits)
- Specific podcasts + listener counts
- Specific conferences + dates + costs + expected leads
- Ad budget scenarios ($500/mo, $2K/mo, $5K/mo)
- Organic content strategy (what to post, where, how often)
```
