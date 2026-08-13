# Rental Property Deal Analyzer

**Product #1 of Digital Products Studio.** A single .xlsx that works in both Excel and
Google Sheets (File → Import → Upload).

## What it does

Fill in the blue cells, get an instant verdict on any rental deal:

- **Monthly & annual cash flow** — with honest maintenance and CapEx reserves built in,
  not best-case numbers
- **Cap rate, cash-on-cash return, DSCR, 1% rule, GRM** — each with a plain-English
  verdict (e.g. DSCR "Lender-friendly" at ≥1.25)
- **Deal Comparison tab** — up to 5 properties side by side
- **Full amortization schedule** — up to 40-year terms, driven by the same inputs

Ships with a worked example ($250k single-family, 20% down at 7.0%) so the expected
format is obvious. Verified: all formulas evaluate without error, metrics match
hand-calculated values, and the loan balance amortizes to exactly zero at term.

## Listing copy (draft)

> **Rental Property Deal Analyzer — Excel & Google Sheets**
>
> Know your numbers before you buy. Enter a property's price, financing, rent, and
> expenses — get cash flow, cap rate, cash-on-cash return, and DSCR instantly, each
> with a plain-English verdict. Compare up to 5 deals side by side. Built for
> self-managing landlords: reserves for maintenance and CapEx are in the math by
> default, so the cash flow you see is the cash flow you keep. Includes a full
> amortization schedule and a worked example. Instant digital download; not
> investment, tax, or legal advice.

**Suggested price:** $29 launch → $49 list (market range for rental calculators is
$50–$199; price up as reviews accumulate).

## File

- `Rental-Property-Deal-Analyzer.xlsx` — the product (4 tabs: Start Here, Deal
  Analyzer, Deal Comparison, Amortization)

## Technical notes

- Formulas are Excel-2007-era only (PMT, IF, SUM) — no compatibility issues in Excel,
  Google Sheets, LibreOffice, or Numbers.
- Formula results are recalculated automatically when the file is opened; verified
  with a full evaluation pass (zero error cells) and hand-checked metrics.
