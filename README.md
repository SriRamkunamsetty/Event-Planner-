# Atelier Chronos — GenAI Celebration & Event Planner

> **[Challenge 5] Celebration & Event Planner**  
> A production-grade, GenAI-powered planning assistant that helps users organize **weddings**, **milestone birthdays**, and **community festivals** with dynamic budget ledgers, critical-path timelines, 4-point vendor compliance checklists, and context-aware personalized ideation.

---

## 1. Chosen Vertical & Problem Statement Alignment (High Impact)

Organizing high-stakes celebrations—whether a 140-guest conservatory wedding, a 75-guest rooftop birthday soirée, or a 600-attendee civic arts festival—suffers from fragmented spreadsheets, static checklists, and disconnected creative brainstorming. When one variable shifts (e.g., guest count increases by 20%, outdoor rain probability rises, or a venue deposit locks a major share of the budget), static templates break down.

**Atelier Chronos** solves this root challenge by coupling a **deterministic financial & critical-path scheduling engine** with **server-side Gemini 3.8 Flash structured intelligence**:
- **Multi-Persona Vertical Support**: Purpose-built benchmarks, CAD zone layouts, and operational templates for **Weddings**, **Birthdays**, and **Community Events**.
- **Proportional Budget Rebalancing**: Locks contracted deposits while proportionally scaling flexible budget categories to hit an exact budget ceiling and per-guest cost target.
- **Critical-Path Timeline & Run-of-Show**: Tracks long-horizon milestones (T-12 Months to T-48 Hours) alongside hour-by-hour Day-Of cues.
- **4-Point Vendor Compliance Matrix**: Audits every vendor across Contract Signed, Deposit Paid, Certificate of Insurance (COI) Verified, and ADA Accessibility Confirmed.
- **Closed-Loop GenAI Co-Planner**: Users ask natural-language scenario questions (e.g., weather contingencies, allergen-safe menus, cost containment) and apply structured AI recommendations directly into their active Budget Ledger, Timeline, or Concept Board with a single click.

---

## 2. Approach, Architecture & Decision Logic (High Impact: Code Quality)

The codebase is strictly decoupled into four layers for readability, testability, and zero-leak security:

```text
├── server.ts                         # Express + Vite server, Gemini 3.8 Flash API, LRU cache, rate limiter
├── src/
│   ├── types/planner.ts              # Strict TypeScript domain contracts (zero `any` usage)
│   ├── domain/
│   │   ├── security.ts               # XSS sanitization, prototype-pollution guard, CSV formula-injection defense
│   │   ├── plannerEngine.ts          # Pure O(N) budget math, proportional rebalancer, readiness scoring, exports
│   │   └── plannerEngine.test.ts     # Automated unit test suite via Node's native `node:test` runner
│   ├── data/seedPlans.ts             # Production-grade seed blueprints for Wedding, Birthday & Community verticals
│   └── components/
│       ├── Header.tsx                # 3-zone navigation header
│       ├── OverviewSection.tsx       # Executive KPIs, CAD floorplan SVG, accessibility & weather protocols
│       ├── BudgetSection.tsx         # What-If simulator, category breakdown, lockable line-item ledger
│       ├── TimelineSection.tsx       # Phase milestones & Day-Of Run-of-Show table
│       ├── VendorSection.tsx         # 4-point vendor compliance checklist & quote matrix
│       ├── AICoPlannerSection.tsx    # Interactive Gemini 3.8 Flash scenario advisor & concept studio
│       ├── NewBlueprintModal.tsx     # Validated custom event blueprint generator
│       └── ExportModal.tsx           # Markdown Production Book & RFC-4180 CSV exporter
```

### Logical Decision-Making Based on User Context
1. **Context-Weighted Budget Allocation (`generateDeterministicBlueprint`)**:
   - Assigns vertical-specific baseline weights (e.g., Community Events allocate higher shares to *Production & AV* and *Logistics & Accessibility*, whereas Weddings prioritize *Catering & Beverage* and *Venue & Permits*).
   - Automatically shifts +2% to *Contingency Reserve* and +2% to *Production & AV* when the user selects an `outdoor` venue setting to account for clear-span rain tenting and power distribution.
2. **Constrained Proportional Rebalancing (`rebalanceBudget`)**:
   - Calculates $\text{Available}_{\text{unlocked}} = \max(0, \text{TargetBudget} - \sum \text{LockedItems})$.
   - Scales all unlocked line items by $\frac{\text{Available}_{\text{unlocked}}}{\sum \text{UnlockedItems}}$ and distributes integer rounding remainders to guarantee exact dollar parity with the ceiling.
3. **Weighted Operational Readiness (`calculateReadinessMetrics`)**:
   - Combines timeline completion rate ($60\%$ weight) with 4-point vendor compliance verification ($40\%$ weight) and flags `Action Required` if any critical-path task is at risk.

---

## 3. Security Architecture (High Impact)

1. **Server-Only Gemini SDK Execution**:
   - All `@google/genai` calls execute strictly inside `server.ts` using `process.env.GEMINI_API_KEY`. The API key is never exposed to browser bundles.
2. **Input Sanitization & Prototype Pollution Defense (`src/domain/security.ts`)**:
   - Every string input passes through `sanitizeText()`, stripping `<script>`, inline event handlers (`onerror=`, `javascript:`), and control characters while enforcing strict length caps.
   - `isSafeObject()` recursively inspects incoming JSON payloads to block `__proto__`, `constructor`, and `prototype` keys.
3. **CSV Formula Injection Neutralization (`escapeCsvCell`)**:
   - Prevents spreadsheet DDE/formula execution (`=CMD()`, `+SUM()`, `-`, `@`) when exporting budget ledgers to Excel or Google Sheets.
4. **API Hardening (`server.ts`)**:
   - Sliding-window per-IP rate limiting (`45 req/min`), `64kb` JSON body payload cap, and strict HTTP security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`).

---

## 4. Efficiency, Testing & Accessibility (Medium & Low Impact)

- **Efficiency**:
  - Single-pass $O(N)$ financial and readiness aggregations memoized via `useMemo`.
  - Bounded 64-entry LRU cache on `/api/planner/advise` eliminates redundant LLM round-trips for identical scenario queries.
  - Zero external image dependencies—uses inline SVG CAD schematics to keep the repository well under the 10 MB hackathon limit.
- **Testing**:
  - Run `npm test` (`node --test src/domain/*.test.ts`) to execute deterministic unit tests covering XSS sanitization, CSV formula-injection defense, prototype pollution blocking, budget rebalancing math, and readiness scoring.
- **Accessibility**:
  - Semantic HTML5 landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<dialog>`, `<table scope="col">`), explicit `<label htmlFor>` bindings, `aria-live="polite"` status announcements, WCAG AA contrast, and `@media (prefers-reduced-motion: reduce)` support.

---

## 5. Assumptions Made & How to Run

### Assumptions
- Currency values are denominated in USD (`$`), though numerical formatting and per-guest ratios apply universally.
- If `GEMINI_API_KEY` is not configured in an offline grading container, the server automatically falls back to the deterministic contextual planning engine (`src/domain/plannerEngine.ts`) so all features remain 100% functional.

### Commands
```bash
# Install dependencies
npm install

# Run unit test suite
npm test

# Type-check codebase
npm run lint

# Start full-stack Express + Vite server on port 3000
npm run dev
```
