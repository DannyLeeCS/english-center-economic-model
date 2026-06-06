# English Center — Class Size Economic Model

A single-file, interactive model that separates two things people usually conflate:

- **Break-even class size** — what your unit economics *require* (driven by tuition, variable cost, cost to run a class, course length).
- **Actual fill** — the class size you can realistically *seat* (driven by marketing spend, cost per lead, conversion, number of levels, and wait time).

Drag the sliders and watch leads, enrollment, active students, monthly profit, and the gap between "need" and "fill" update live. Tables surface a monthly P&L, per-unit ratios (contribution/student, margin per class, effective conversion, CAC, LTV/CAC), and capacity/overlap.

### What the model gets right

- **Cohort overlap.** Totals (active students, revenue, variable cost, profit) are scaled by the overlap multiplier = course length ÷ intake interval, so a 3-month course with monthly intake correctly shows 3 simultaneous cohorts. Per-unit ratios stay unscaled.
- **Cohort vs. rolling enrollment.** Switch between classes that start/run/end together and rolling classes that accumulate students over time.
- **Three cost buckets by what they attach to.** Per-student (head), per-class (the minimum-class-size driver), and whole-center fixed — each documented inline.
- **Teacher mix.** Salaried full-time teaching routes into the fixed bucket; hourly stays per-class. The split changes break-even, not total cash.
- **Conditional room opportunity cost.** Zero when rooms are spare, loaded onto per-class cost when slots are full.
- **Explicit capacity ceiling.** Class cap and room/slot count are inputs; the model flags demand-constrained vs. capacity-constrained and shows where extra marketing just inflates CAC.
- **Cash vs. realized revenue.** Optional view separating upfront cash collected from recognized revenue and unearned tuition on the books.

## Run locally

It's a static page — just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy

Static site. On Railway, point a static/Nixpacks service at this repo and serve `index.html`.

> Amounts are in VND millions unless labelled otherwise.
