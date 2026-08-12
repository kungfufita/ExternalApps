# Venture Registry

The live index of every avenue of business on the platform. One row per venture;
keep it current — this table is the platform's map.

| Venture | Stage | Owner | Structure | One-line description |
|---|---|---|---|---|
| [Digital Products Studio](digital-products/README.md) | 1 — Validate | Troy | Internal | Templates and toolkits for one specific niche — the platform's cash-flow opener |
| [Productized AI Service](ai-service/README.md) | 1 — Validate | Troy | Internal | Fixed-scope subscription deliverables on an AI-first pipeline with human review |
| [Niche Micro-SaaS](micro-saas/README.md) | 1 — Validate | Troy | Internal | One painful workflow, one industry, concierge-first — the long-game compounder |

**Stage** comes from [Pillar 2 — Development](../docs/02-development.md)
(0 Idea · 1 Validate · 2 Build · 3 Operate · 4 Scale/Sustain).
**Structure** comes from [Pillar 1 — Business Structure](../docs/01-business-structure.md)
(internal · entity · JV).

## Starting a new venture

```
cp -r ventures/_template ventures/<venture-name>
```

Then fill in the three files inside, add the row above, and the venture exists.

## Retired ventures

Wound-down ventures move to a `retired/` subdirectory with a short post-mortem added
to their README — what worked, what didn't, what the platform should reuse. Nothing
is deleted; retained learning is the point.
