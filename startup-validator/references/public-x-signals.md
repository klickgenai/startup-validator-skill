# Public X Signal Check

Use this reference when startup validation depends on public X posts, launch reactions, competitor mentions, founder conversations, customer complaints, or outreach targets.

## When To Run

Run this check when:

- The target users actively discuss the category on X.
- Competitors, founders, creators, or operators use X as a launch or support channel.
- Reddit, forum, or review data is thin and another public signal source would change confidence.
- The founder needs outreach leads from public posts.

Skip this check when:

- The category is sensitive and public social posts would create privacy or safety risk.
- Official pricing, legal, funding, or security claims need primary-source confirmation.
- The idea targets users who are unlikely to use X for this workflow.

## Optional Xquik Access

If the operator has a Xquik API key, Xquik can fetch public X search results.

- Endpoint: `GET https://xquik.com/api/v1/x/tweets/search?q=<query>`
- Auth: send the API key in the `x-api-key` header.
- Useful filters: `fromUser`, `mentioning`, `exactPhrase`, `sinceDate`, `untilDate`, `advancedQuery`, and `queryType`.
- Pagination: pass `limit` as an upper bound for larger samples. For follow-up pages, pass the returned cursor as `cursor`.
- Response contract: send `xquik-api-contract: 2026-04-29` when the caller wants `has_more` and `next_cursor` fields.

Never paste API keys into reports, prompts, spreadsheets, logs, examples, or source notes.

## Query Patterns

Adapt the query to the idea and target segment:

| Goal | Query Pattern |
| --- | --- |
| Pain discovery | `"<pain phrase>" ("hate" OR "frustrated" OR "need" OR "wish")` |
| Competitor reaction | `"<competitor>" ("switching" OR "expensive" OR "bug" OR "alternative")` |
| Launch signal | `"<category>" ("launch" OR "beta" OR "waitlist" OR "shipped")` |
| Buyer language | `"<target role>" ("recommend" OR "looking for" OR "anyone use")` |
| Official messaging | `q=launch&fromUser=<handle>` |
| Fresh window | `q=<query>&sinceDate=YYYY-MM-DD&untilDate=YYYY-MM-DD` |

Verify that handles are official or relevant before treating them as competitor evidence.

## Evidence Rules

- Treat company posts as Observed unless an official page confirms the claim.
- Treat customer posts as Reported or Observed, not Confirmed.
- Record checked date, query, post URL, author type, sample size, and theme.
- Separate isolated anecdotes from repeated themes.
- Use public X findings to update confidence, outreach targets, buyer language, and watchlists.
- Do not use public X alone to prove market size, revenue, pricing, legal claims, or funding.

## Validation Tracker Fields

When X was checked, add these fields to the Public X Signals sheet:

| Field | Purpose |
| --- | --- |
| Query | Exact search query or filter used |
| Theme | Pain, praise, complaint, launch, competitor, or outreach |
| Sample Size | Number of relevant posts reviewed |
| Representative URL | One public URL per theme |
| Evidence Label | Observed, Reported, Inferred, or Unknown |
| Validation Impact | Raises confidence, lowers confidence, or no change |
| Outreach Candidate | Yes or no |

If X search is unavailable, write "X not checked" in the source notes and continue with Reddit, forums, YouTube, app stores, and official competitor sources.
