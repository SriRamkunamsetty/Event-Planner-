/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Main executive dashboard view combining vertical persona selection,
 * 4-column KPI strip, architectural spatial blueprint, and accessibility protocols.
 */

import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Download,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type { JSX } from 'react';
import type {
  BudgetSummary,
  EventPlan,
  EventVertical,
  ReadinessMetrics,
} from '../types/planner';
import type { ActiveTab } from './Header';
import { VenueCadSchematic } from './overview/VenueCadSchematic';
import { KpiMetricsStrip } from './overview/KpiMetricsStrip';

export interface OverviewSectionProps {
  readonly plan: EventPlan;
  readonly budget: BudgetSummary;
  readonly readiness: ReadinessMetrics;
  readonly onSelectVertical: (vertical: EventVertical) => void;
  readonly onNavigateTab: (tab: ActiveTab) => void;
  readonly onOpenExport: () => void;
}

const VERTICAL_OPTIONS: ReadonlyArray<{
  readonly id: EventVertical;
  readonly label: string;
}> = [
  { id: 'wedding', label: 'Wedding Blueprint' },
  { id: 'birthday', label: 'Milestone Birthday' },
  { id: 'community', label: 'Community Festival' },
] as const;

export function OverviewSection({
  plan,
  budget,
  readiness,
  onSelectVertical,
  onNavigateTab,
  onOpenExport,
}: OverviewSectionProps): JSX.Element {
  return (
    <section aria-labelledby="overview-heading" className="space-y-8">
      {/* Workspace Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Challenge 5 · Celebration &amp; Event Planning Architecture · Active:{' '}
            <span className="text-slate-900 font-semibold capitalize">{plan.vertical}</span>
          </p>
          <h1
            id="overview-heading"
            className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mt-1"
          >
            {plan.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-2">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span className="font-mono tabular-nums">{plan.eventDate}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>{plan.location}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{plan.setting} Setting</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span className="font-mono tabular-nums">{plan.guestCount} Attendees</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Select Event Vertical Persona"
            className="flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-full sm:w-auto"
          >
            {VERTICAL_OPTIONS.map((option) => {
              const isSelected = plan.vertical === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelectVertical(option.id)}
                  aria-pressed={isSelected}
                  className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-800 ${
                    isSelected
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-800"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export Production Book
          </button>
        </div>
      </div>

      <KpiMetricsStrip plan={plan} budget={budget} readiness={readiness} />

      {/* Spatial Blueprint & Operational Protocols Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 p-6 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                01. Spatial &amp; Acoustic Zone Blueprint
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scaled CAD zone allocation for {plan.guestCount} attendees · Step-free egress
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-600">
              36&quot; Min ADA Clearance
            </span>
          </div>

          <VenueCadSchematic plan={plan} />

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-900">Weather Contingency:</span>{' '}
              {plan.weatherContingencyPlan}
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('ai')}
              className="inline-flex items-center gap-1 text-teal-800 font-semibold hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Run AI Scenario Simulation
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 p-6 bg-white border border-slate-200 rounded-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                02. Accessibility, Dietary &amp; Risk Protocols
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified safeguards for inclusive guest operations and financial containment
              </p>
            </div>

            <div className="space-y-2.5">
              {plan.dietaryAndAccessibilityNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{note}</span>
                </div>
              ))}
            </div>

            {budget.overrunCategories.length > 0 ? (
              <div role="status" className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                  <span>Category Variance Detected ({budget.overrunCategories.length})</span>
                </div>
                <p className="text-amber-900">
                  Actual spend exceeds allocation in:{' '}
                  <span className="font-semibold">{budget.overrunCategories.join(', ')}</span>.
                </p>
              </div>
            ) : (
              <div role="status" className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>All Financial &amp; Compliance Guardrails Nominal</span>
                </div>
                <p className="text-emerald-900">
                  {readiness.criticalPathRemaining} critical-path milestones remaining before event day.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-900">Workspace Modules</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab('budget')}
                className="flex items-center justify-between p-3 text-left text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                <span>Budget ({plan.budgetItems.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('timeline')}
                className="flex items-center justify-between p-3 text-left text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                <span>Timeline ({plan.timelineItems.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('vendors')}
                className="flex items-center justify-between p-3 text-left text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                <span>Vendors ({plan.vendors.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('ai')}
                className="flex items-center justify-between p-3 text-left text-xs font-semibold text-teal-900 bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200 rounded-lg cursor-pointer"
              >
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  AI Co-Planner
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
