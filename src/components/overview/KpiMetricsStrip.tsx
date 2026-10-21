/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview 4-column executive KPI strip for financial allocations, committed spend,
 * per-attendee economics, and operational readiness scoring with ARIA progressbar roles.
 */

import type { JSX } from 'react';
import type { BudgetSummary, EventPlan, ReadinessMetrics } from '../../types/planner';

export interface KpiMetricsStripProps {
  readonly plan: EventPlan;
  readonly budget: BudgetSummary;
  readonly readiness: ReadinessMetrics;
}

export function KpiMetricsStrip({
  plan,
  budget,
  readiness,
}: KpiMetricsStripProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-5 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Total Budget Ceiling</span>
          <span>{budget.healthStatus}</span>
        </div>
        <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900 mt-2">
          ${budget.totalBudget.toLocaleString()}
        </p>
        <p className="text-xs text-slate-600 mt-2 font-mono tabular-nums">
          Allocated: ${budget.totalAllocated.toLocaleString()} · Unallocated: $
          {budget.unallocatedBalance.toLocaleString()}
        </p>
      </div>

      <div className="p-5 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Actual Committed Spend</span>
          <span className="font-mono tabular-nums">{budget.utilizationRatio}% Utilized</span>
        </div>
        <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900 mt-2">
          ${budget.totalActual.toLocaleString()}
        </p>
        <div
          role="progressbar"
          aria-label="Budget Utilization Ratio"
          aria-valuenow={Math.min(100, Math.round(budget.utilizationRatio))}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2"
        >
          <div
            className={`h-full ${
              budget.utilizationRatio > 100
                ? 'bg-red-600'
                : budget.utilizationRatio > 90
                  ? 'bg-amber-500'
                  : 'bg-teal-700'
            }`}
            style={{ width: `${Math.min(100, budget.utilizationRatio)}%` }}
          />
        </div>
      </div>

      <div className="p-5 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Per-Attendee Economics</span>
          <span className="font-mono tabular-nums">{plan.guestCount} Pax</span>
        </div>
        <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900 mt-2">
          ${budget.actualPerGuest.toFixed(2)}
          <span className="text-sm font-normal text-slate-500"> / guest</span>
        </p>
        <p className="text-xs text-slate-600 mt-2 font-mono tabular-nums">
          Planned Benchmark: ${budget.plannedPerGuest.toFixed(2)} / guest
        </p>
      </div>

      <div className="p-5 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Operational Readiness</span>
          <span>{readiness.readinessStatus}</span>
        </div>
        <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900 mt-2">
          {readiness.overallReadinessScore}%
        </p>
        <div
          role="progressbar"
          aria-label="Overall Operational Readiness"
          aria-valuenow={readiness.overallReadinessScore}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2"
        >
          <div
            className="h-full bg-teal-800"
            style={{ width: `${readiness.overallReadinessScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}
