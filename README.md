# English Center — Class Size Economic Model

An interactive, single-page planning model for a language center. It turns a set of operating
levers (price, marketing, retention, staffing, room schedule, outcome guarantee) into a coherent
monthly P&L, and — crucially — keeps the headline numbers **internally consistent**: the
break-even it reports always agrees with the sign of the profit it reports.

Three files, no build step, no dependencies:

| File | Role |
|------|------|
| [`index.html`](index.html) | Markup — all sliders, toggles, and result panels |
| [`styles.css`](styles.css) | Dark-neon glass theme |
| [`app.js`](app.js) | The entire model — one `compute()` function re-run on every input |

> **Units.** All money is in **VND millions (M)** unless a label says otherwise (CPL and the
> part-time hourly rate are in **thousands, k**). Everything is **per month** unless stated.
> State is auto-saved to your browser (`localStorage`), with **Save** / **Reset** buttons.

---

## 1. The two ideas that make it coherent

**(a) Two stocks, not one.** Active students are split into **paying bodies** (generate revenue)
and **retake bodies** (free re-study under the outcome guarantee — zero revenue, but they still
occupy seats and consume materials). Revenue is computed from paying bodies; class count, teacher
cost, and materials are computed from **all** bodies.

**(b) Two break-evens, not one.** The model shows both and leads with the honest one:

- **Contribution break-even** — how many students cover *only* this class's part-time teacher. A
  narrow, marginal question (≈ 1–2 students). Useful for "should I run one more class?"
- **Fully-loaded break-even** — how many students cover this class's *share of every monthly
  cost* (FT salary + overhead + marketing, plus its own teacher + room). The real floor.

The fully-loaded break-even is constructed so that **fill ≥ fully-loaded break-even ⟺ profit ≥ 0**.
A runtime assertion (`console.warn`) fires if that invariant is ever violated.

---

## 2. How the variables depend on each other

```
                 price elasticity
 fee ─────────────────┐
                      ▼
 mkt, cpl, conv ─► leads ─► effConv ─► inflowDemand ──┐ (paying / month)
 wait, intake, mode ─► abandon ─────────┘             │
                                                      ▼
 courses, uppct, upcourses ─► avgCourses ─► avgLifetime ─► desiredStock ──┐
 failrate, retakecourses ─► retakeMult ──────────────────────────────────┤
                                                                          ▼
 rooms, evesl/evedays, wkndsl/wknddays, sess ─► window supply ─► maxClasses ─► maxStock
 cap, avgcls, mainpct/wkndpct, offpeakfill ─► effFill ───────────────────┘     │
                                                                          ┌─────┘
                              view (now/steady) ─► viewStock ─► servedStock (capped by maxStock)
                                                                  │
                              ┌───────────────────────────────────┼───────────────────────────┐
                              ▼                                    ▼                           ▼
                        payingStock                          classesRunning              retakeStock
                              │                                    │                           │
                              ▼                          ┌─────────┼──────────┐                │
                          revenue                   ptCost    roomCost   per-window util   guarantee cost
                              │                          │         │                           │
                              └──────────────► PROFIT ◄──┴─────────┴───── fix, ftsal, mkt ◄────┘
```

Read it top to bottom: the **demand funnel** sets the paying inflow; **retention + the retake
multiplier** turn that inflow into a stock; the **room schedule** sets the capacity ceiling; the
chosen **view** picks which stock drives the headline; and everything below splits into
**revenue (paying only)** and **costs (all bodies + fixed)**, which net to **profit**.

---

## 3. Inputs (sliders & toggles)

### Unit economics
| Input | Symbol | Meaning |
|---|---|---|
| Tuition / course | `fee` | Price of one course (per head) |
| Variable cost / student / course | `vc` | Materials, books, per-head admin |
| Room out-of-pocket / class / mo | `ro` | Utilities for a running class (rent is in overhead) |
| Course length (months) | `cm` | Months one course runs |

### Lifetime value (retention)
| Input | Symbol | Meaning |
|---|---|---|
| Courses per student (level journey) | `courses` | Avg courses a student progresses through — **this is retention** |
| Active students upsold | `uppct` | Share cross-sold *extra* courses |
| Upsell courses / upsold student | `upCourses` | Extra courses on top of progression |

### Outcome guarantee (free retakes)
| Input | Symbol | Meaning |
|---|---|---|
| Student fail rate | `failRate` | Share who fail and re-study free |
| Courses allowed to retake | `retakeCourses` | How many courses a failed student re-studies free |

### Teachers
| Input | Symbol | Meaning |
|---|---|---|
| Full-time salary / mo (total) | `ftsal` | Fixed; doesn't move break-even |
| % of classes taught part-time | `ptpct` | Single source of truth for the FT/PT split |
| Part-time hourly rate (k) | `pthr` | VND thousands per teaching hour |
| Teaching hours / class / week | `pthrs` | Drives PT cost (× 4.3 → monthly) |
| Salary per FT teacher / mo | `ftper` | Sanity-check only |
| Classes one FT teacher covers | `ftcov` | Sanity-check only |

### Rooms & capacity (two-window, session-aware)
| Input | Symbol | Meaning |
|---|---|---|
| Physical class cap | `cap` | Hard max students per section |
| Average fill in a normal class (prime) | `avgcls` | Typical prime-window fill (≤ cap) |
| Number of rooms | `rooms` | Physical rooms |
| Sessions per class / week | `sess` | How many times a class meets — converts classes → slot-instances |
| Evening slots / room / night | `evesl` | Weekday-evening start-times per room |
| Weekday evenings / week | `evedays` | Nights the evening window runs |
| Weekend slots / room / morning | `wkndsl` | Weekend-morning start-times per room |
| Weekend mornings / week | `wknddays` | Mornings the weekend window runs |
| % of classes in weekday evenings | `mainpct` | Load into the mainstream window |
| % of classes in weekend mornings | `wkndpct` | Load into the weekend window |
| Off-peak fill rate (% of normal) | `opf` | How well classes outside both windows fill |
| Opportunity cost / class when scarce | `opp` | Loaded only when a window saturates |

### Demand & distribution
| Input | Symbol | Meaning |
|---|---|---|
| Marketing spend / month | `mkt` | Ad budget (a real P&L cost) |
| Cost per lead (k) | `cpl` | VND thousands per lead |
| Lead → enroll rate | `conv` | Funnel conversion |
| Number of levels | `lvl` | Floors the class count (≥ 1 class per level) |
| Max wait tolerance (weeks) | `wait` | Patience before a prospect walks (cohort mode) |
| Current active students | `initAct` | Today's headcount — the projection's start, and the **Now** view's stock |

### Overhead, toggles, modes
| Input | Symbol | Meaning |
|---|---|---|
| Overhead & rent / month | `fix` | All non-teacher fixed cost incl. classroom rent |
| Price elasticity | `useElastic` | Tuition's only indirect path to fill |
| Force rooms scarce | `forceScarce` | Manually load opportunity cost |
| Enrollment mode | `mode` | `cohort` (pool then launch) vs `rolling` |
| Intake interval | `intakeMonths` | 1 / 2 / 3 months (cohort mode) |
| Economics view | `view` | `now` (current stock) vs `steady` (funnel's long-run level) |

---

## 4. The formulas (in computation order)

### 4.1 Per-unit economics (unscaled — per single unit)
```
feePerMonth        = fee / cm
vcPerMonth         = vc  / cm
contribPerStudent  = feePerMonth − vcPerMonth          // contribution / student / month
avgCourses         = courses + uppct × upCourses        // expected courses over a lifetime
avgLifetime        = max(0.5, cm × avgCourses)          // months a paying student stays
g                  = 1 / avgLifetime                    // monthly graduation/decay rate
```

### 4.2 Demand funnel (paying heads / month)
```
leads        = mkt × 1000 / cpl                         // M→k so it divides the k-VND CPL
feeElastic   = useElastic ? (13 / fee)^0.45 : 1         // price elasticity, anchored at 13M tuition
effConv      = min(0.60, (conv/100) × feeElastic)       // capped at 60%
abandon      = cohort mode only:
               avgWaitWeeks = intakeMonths × 4 / 2
               clamp((avgWaitWeeks − wait) / max(wait,1) × 0.5, 0, 0.6)
inflowDemand = leads × effConv × (1 − abandon)          // new PAYING students / month
```
*Note the elasticity anchor is the constant `13`. If your real tuition isn't ~13M, the model treats
your price as cheap/expensive relative to 13 — or just turn the toggle off.*

### 4.3 Two-window, session-aware capacity
A class consumes `sess` **slot-instances** per week (it meets several times). Capacity is the number
of slot-instances each time window offers, divided by `sess`.
```
effAvg        = clamp(avgcls, 0.5, cap)                 // normal prime-window fill
primeShare    = min(1, mainpct + wkndpct)
offpeakPct    = max(0, 1 − mainpct − wkndpct)
blendFactor   = primeShare + offpeakPct × opf           // ≤ 1 — off-peak underfill drags it down
effFill       = max(0.25, effAvg × blendFactor)         // overall avg students/class (the headline fill)

mainSupply    = rooms × evesl × evedays                 // weekday-evening slot-instances / week
wkndSupply    = rooms × wkndsl × wknddays               // weekend-morning slot-instances / week
mainCapClasses= mainSupply / sess                       // each window's ceiling, in classes
wkndCapClasses= wkndSupply / sess

maxByMain     = mainpct>0 ? mainCapClasses / mainpct : ∞ // total classes before evenings saturate
maxByWknd     = wkndpct>0 ? wkndCapClasses / wkndpct : ∞
maxClasses    = min(maxByMain, maxByWknd)               // schedule ceiling, in classes
maxStock      = maxClasses × effFill                    // capacity ceiling, in bodies
```

### 4.4 The stock (paying + retake bodies)
```
retakeMult    = failRate × retakeCourses               // retake bodies per paying body
totalInflow   = inflowDemand × (1 + retakeMult)        // paying + retake bodies entering / month
desiredStock  = totalInflow × avgLifetime              // total bodies the funnel + retention want
steadyStock   = min(desiredStock, maxStock)            // capped by capacity
currentStock  = initAct                                 // today's total bodies

viewStock     = (view = now) ? currentStock : steadyStock
servedStock   = min(viewStock, maxStock)               // total bodies actually seated
payingStock   = servedStock / (1 + retakeMult)         // revenue-generating
retakeStock   = servedStock − payingStock              // zero-revenue
```
This is **Little's Law**: stock = inflow × time-in-system. `initAct` only seeds the **Now** view and
the projection's starting point; it does **not** change the steady state (a funnel attractor is
independent of where you start).

### 4.5 Class count & per-window utilization
```
classesNeeded   = max(lvl, ceil(viewStock / effFill))  // off-peak underfill pushes this UP
classesRunning  = min(classesNeeded, maxClasses)
classSize       = servedStock / classesRunning         // the "Actual size you fill" (blended)

mainClasses     = classesRunning × mainpct
wkndClasses     = classesRunning × wkndpct
mainUtil        = mainClasses × sess / mainSupply       // per-window — NOT blended
wkndUtil        = wkndClasses × sess / wkndSupply
bindingUtil     = max(mainUtil, wkndUtil)
capacityConstrained = classesNeeded > maxClasses
roomsScarce     = forceScarce OR bindingUtil ≥ 0.95     // opportunity cost auto-engages here
```

### 4.6 Teacher split & cost
```
ptClasses        = classesRunning × ptpct
ftClasses        = classesRunning × (1 − ptpct)
hoursPerClassMo  = pthrs × 4.3
ptCostPerClass   = hoursPerClassMo × pthr / 1000        // k→M
ptCostTotal      = ptClasses × ptCostPerClass           // part-timers scale with class count
// FT salary is a flat slider (does not scale with classes)
```

### 4.7 Break-even (the two views)
```
marginalClassCost = ptCostPerClass + ro + (roomsScarce ? opp : 0)
breakEven         = marginalClassCost / contribPerStudent          // CONTRIBUTION break-even

carriedMonthly        = ptCostTotal + roomCostTotal + ftsal + fix + mkt   // every non-variable cost
fullyLoadedCostPerClass = carriedMonthly / classesRunning
fullyLoadedBE         = fullyLoadedCostPerClass / contribPerStudent // FULLY-LOADED break-even (the floor)
```
**Invariant:** `classSize ≥ fullyLoadedBE  ⟺  profit ≥ 0`.

### 4.8 The monthly P&L
```
revenue        = payingStock × feePerMonth             // retakes contribute ZERO
varCostTotal   = servedStock × vcPerMonth              // ALL bodies need materials
roomCostTotal  = ro × classesRunning
perClassBucket = ptCostTotal + roomCostTotal
fixedTotal     = fix + ftsal
profit         = revenue − varCostTotal − perClassBucket − fixedTotal − mkt
```
Marketing is subtracted as a real cost. Six visible cost lines (variable, PT teachers, room, FT
salary, marketing, overhead) sum exactly to profit.

### 4.9 Lifetime value & upsell
```
upsellShare = (uppct × upCourses × cm) / avgLifetime    // upsell's share of lifetime
upsellRev   = payingStock × upsellShare × feePerMonth
cac         = mkt / seatedInflow                        // per PAYING seated student
ltv         = avgCourses × (fee − vc)                   // lifetime contribution per acquired student
ratio       = ltv / cac
marginPerClass = classSize × contribPerStudent − marginalClassCost
```
`seatedInflow = (steadyStock / (1+retakeMult)) / avgLifetime` — the sustainable paying acquisitions
per month (retakes are not acquired through marketing).

### 4.10 Outcome-guarantee (retake) cost — state-dependent
The whole point: a retake's cost depends on whether its seat could have been **sold**.
```
payingNoRetake  = min(inflowDemand × avgLifetime, maxStock)               // paying you'd serve without the guarantee
payingServed    = min(inflowDemand × avgLifetime × (1+retakeMult), maxStock) / (1+retakeMult)
displacedPaying = max(0, payingNoRetake − payingServed)                    // paying crowded out by retakes
displacedFrac   = displacedPaying / retakeStock
extraBodyFrac   = 1 − displacedFrac

// (a) extra-body cost — dominates when DEMAND-CONSTRAINED (spare seats)
retakeVarCost      = retakeStock × vcPerMonth × extraBodyFrac
retakeCapacityCost = perClassBucket × (retakeStock / servedStock) × extraBodyFrac
// (b) seat opportunity cost — ZERO with spare seats, full tuition at capacity
retakeSeatOpp      = displacedPaying × feePerMonth
guaranteeCost      = retakeVarCost + retakeCapacityCost + retakeSeatOpp
```
- **Demand-constrained** (the usual state): `displacedPaying = 0`, so the seat cost is **exactly
  zero** — retakes just fill otherwise-idle capacity and cost only materials + their share of
  classes. This is the dominant cost.
- **At capacity**: each retake displaces a paying student, so the cost flips to **full lost
  tuition** (materials are spent on whoever sits there). The extra-body terms fade to zero so nothing
  is double-counted.
- Verified: `guaranteeCost` equals the true profit delta (profit-without-guarantee − profit-with)
  **exactly in both regimes**.

> **Second-order tension the model surfaces:** filling classes / growing demand toward capacity makes
> the guarantee *more* expensive, because empty seats disappear and retakes start displacing payers.

### 4.11 Deferred revenue (optional view)
```
courseStarts = payingStock / cm
cashIn       = courseStarts × fee                       // collected upfront at each course start
recognized   = revenue                                  // earned this month (≈ cashIn at steady state)
unearned     = payingStock × feePerMonth × (cm − 1) / 2 // cash held but owed as future teaching
```

### 4.12 Stock projection (the chart)
24-month forward simulation from today's headcount:
```
series[0] = initAct
series[t] = min(maxStock, series[t−1] × (1 − g) + totalInflow)
```
The dashed line marks `steadyStock`; the curve rises, flattens, or declines toward it depending on
whether `totalInflow` exceeds current outflow.

---

## 5. Key behaviours & invariants

- **Break-even sign = profit sign.** `classSize ≥ fullyLoadedBE ⟺ profit ≥ 0`, always (asserted).
- **Class size is a cost lever, not a growth lever.** When demand-constrained, revenue is fixed by
  the stock; raising `cap`/`avgcls` only cuts class count (cost), it doesn't add students.
- **Per-window, not blended.** A 30% blended utilization can hide a 100%-full evening window. The two
  windows are reported separately; warnings name the binding one.
- **Capacity is window-hours, not rooms.** More rooms barely helps once a *time window* saturates —
  the levers are: shift load to the emptier window, add slots within a window, or run fewer
  sessions/week.
- **Teacher money lives in exactly two places** — `ptCostTotal` (per-class) and `ftsal` (fixed).
  Nothing hidden in `ro` or `fix`.
- **Retakes inflate the stock at zero revenue**, raising class/teacher/materials cost while diluting
  revenue-per-active-student.

---

## 6. Run locally

It's a static page — open `index.html`, or serve the folder:
```bash
npx serve .
```

## 7. Deploy

Static site. On Railway, point a static / Nixpacks service at this repo and serve `index.html`.

> A planning model — directional, not accounting. Allocating fixed costs per class (the fully-loaded
> view) is a planning convenience, not marginal-decision costing; both break-even views are shown so
> neither misleads.
