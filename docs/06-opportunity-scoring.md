# Pillar 2a — Opportunity Scoring

How the platform decides which avenues of business to pursue next. Every candidate
opportunity is scored on the same eight factors, so choices are comparisons, not
gut calls. The live scoreboard is in the [platform console](../console/index.html);
the researched candidate list is in [`research/opportunities.md`](../research/opportunities.md).

## The eight factors

Each factor is scored **1–5**. Higher is always better — factors where "less is
better" in the real world (complexity, capital, competition) are inverted at
scoring time so the arithmetic stays uniform.

| # | Factor | Weight | 5 means | 1 means |
|---|--------|-------:|---------|---------|
| 1 | **Simplicity** (inverse of complexity) | 15% | Few moving parts, well-understood playbook, little regulation | Many interlocking parts, licenses, custom builds |
| 2 | **Profitability** | 20% | Gross margins ≥ 70% at modest scale | Thin margins that need volume to matter |
| 3 | **Automation potential** | 20% | Can run mostly hands-off at rungs 3–4 of the [automation ladder](05-automation.md) | Inherently hands-on; every unit needs human hours |
| 4 | **Capital efficiency** | 10% | Starts for under ~$5k | Needs six figures before the first dollar |
| 5 | **Speed to first revenue** | 10% | First paying customer inside a month | A year or more before revenue |
| 6 | **Recurring revenue** | 10% | Subscription or naturally repeating purchases | One-off sales, every month starts at zero |
| 7 | **Market demand** | 10% | Large, durable, growing demand | Small, shrinking, or fad-driven |
| 8 | **Competitive breathing room** | 5% | Defensible niche, few direct rivals | Commodity race to the bottom |

**Weighted score** = Σ(score × weight) ÷ 5, giving a number out of 100.

The two heaviest weights — profitability and automation potential — reflect the
platform's bias: ventures should make real money and run without consuming all
available human hours. Simplicity is third because complexity is where ventures
quietly die. Weights are defaults, not law: the console lets you re-weight and
watch the ranking re-sort, which is itself a useful sensitivity test — an
opportunity that only ranks well under one narrow weighting is fragile.

## Score bands

| Band | Score | Reading |
|---|---|---|
| **Strong candidate** | ≥ 70 | Worth chartering a stage-0 venture to validate |
| **Situational** | 55–69 | Attractive only if we have an unfair advantage (skills, audience, assets) |
| **Pass for now** | < 55 | Re-score if circumstances change |

## Rules

1. **Scores are hypotheses.** Desk research produces the first score; stage 1
   (Validate) exists to test it. A score is never a substitute for a paying customer.
2. **Score before you fall in love.** New ideas enter the scoreboard before anyone
   builds anything.
3. **Unfair advantage is a tiebreaker, not a factor.** It's real, but it's specific
   to us — keep it out of the comparable arithmetic and apply it when choosing
   between similar scores.
4. **Re-score quarterly** for anything still on the board — markets move.
5. **Record the rationale.** A number without the one-line reasoning behind each
   factor score can't be challenged, and unchallenged scores rot.
