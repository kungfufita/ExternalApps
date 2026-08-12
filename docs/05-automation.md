# Pillar 5 — Automation

The machine side of the platform: what gets automated, with what, and how automation and
the workforce (Pillar 4) complement each other.

## What to automate

Work is a candidate for automation when it is **repeated, rule-based, and boring** —
done the same way more than twice, describable as steps, and adding no judgment.

Priority order:

1. **Safety and accuracy risks** — anything where a human slip is costly (billing,
   compliance filings, backups).
2. **High-frequency drudgery** — the daily/weekly tasks that quietly eat hours
   (reporting, data entry, status chasing, file shuffling).
3. **Scaling bottlenecks** — steps that would force a hire if volume doubled.

What **not** to automate: anything still changing weekly (stabilize it first),
relationship moments customers value a human for, and judgment calls where the rule
can't be written down yet.

## The automation ladder

Every process climbs the same ladder; skipping rungs is how automations become
mysteries nobody trusts.

```
1. Documented   — written playbook a human follows
2. Assisted     — templates, checklists, and tools speed the human up
3. Supervised   — the machine does it, a human reviews before it takes effect
4. Autonomous   — the machine does it, humans monitor exceptions and metrics
```

## Standards

- **Every automation has an owner** — a named person who understands it and is
  accountable when it misbehaves. Unowned automation is a liability, not an asset.
- **Every automation is inventoried** in the venture's `operations.md`: what it does,
  what tools it runs on, its ladder rung, its owner, and what to do when it breaks.
- **Fail loud.** An automation that fails silently is worse than no automation.
  Every one needs a way to signal failure that a human will actually see.
- **Prefer boring tools.** Shared, well-understood tooling across ventures beats a
  different clever stack per venture. New tools enter the approved list at the
  platform level.
- **AI-driven automation** follows the same ladder — it starts supervised, and it
  graduates to autonomous only per-process, with evidence, never by default. Human
  accountability for the outcome never transfers to the tool.

## Workforce fit

Automation exists to raise the value of human hours, not just to cut them. Each
quarterly review, ventures answer: *What did we automate this quarter, and what more
valuable thing did the freed-up time go to?* If there's no answer to the second half,
the automation isn't finished.
