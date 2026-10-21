/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
import type {
  BudgetSummary,
  EventPlan,
  EventVertical,
  ReadinessMetrics,
} from '../types/planner';
import type { ActiveTab } from './Header';

interface OverviewSectionProps {
  plan: EventPlan;
  budget: BudgetSummary;
  readiness: ReadinessMetrics;
  onSelectVertical: (vertical: EventVertical) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenExport: () => void;
}

const VERTICAL_OPTIONS: Array<{
  id: EventVertical;
  label: string;
  persona: string;
}> = [
  {
    id: 'wedding',
    label: 'Wedding Blueprint',
    persona: '140 Guests · Botanical Conservatory',
  },
  {
    id: 'birthday',
    label: 'Milestone Birthday',
    persona: '75 Guests · Solis Rooftop Penthouse',
  },
  {
    id: 'community',
    label: 'Community Festival',
    persona: '600 Attendees · Midtown Civic Commons',
  },
];

export function OverviewSection({
  plan,
  budget,
  readiness,
  onSelectVertical,
  onNavigateTab,
  onOpenExport,
}: OverviewSectionProps) {
  return (
    <section aria-labelledby="overview-heading" className="space-y-8">
      {/* Workspace Toolbar: Persona Switcher & Export Action */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Challenge 5 · Celebration &amp; Event Planning Architecture · Active Vertical:{' '}
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

        {/* Interactive Segmented Control for Vertical Persona Selection + Export */}
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

      {/* 4-Column Full-Width KPI Strip */}
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
          <p className="text-xs text-slate-600 mt-2 font-mono tabular-nums">
            Paid Deposit: ${budget.totalPaid.toLocaleString()} · Remaining: $
            {budget.remainingSpendable.toLocaleString()}
          </p>
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
          <p className="text-xs text-slate-600 mt-2 font-mono tabular-nums">
            {readiness.completedTasks}/{readiness.totalTasks} Milestones ·{' '}
            {readiness.fullyCompliantVendors}/{readiness.totalVendors} Vendors Verified
          </p>
        </div>
      </div>

      {/* 2-Column Balanced Split: Architectural Spatial Blueprint + Operational Context & Contingencies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Columns: Interactive Architectural Venue & Seating Blueprint SVG */}
        <div className="lg:col-span-7 p-6 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                01. Spatial &amp; Acoustic Zone Blueprint
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scaled CAD zone allocation for {plan.guestCount} attendees · Step-free egress &amp;
                service routing
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-600">
              36&quot; Min ADA Clearance · 88 dB Acoustic Cap
            </span>
          </div>

          {/* Bespoke Architectural CAD SVG Diagram */}
          <div className="my-4 bg-slate-900 rounded-lg p-4 text-slate-100 overflow-hidden">
            <svg
              viewBox="0 0 680 280"
              role="img"
              aria-label={`Architectural floorplan schematic for ${plan.title}`}
              className="w-full h-auto block"
            >
              <defs>
                <pattern
                  id="cad-grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.12)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="680" height="280" fill="url(#cad-grid)" />

              {/* Outer Venue Perimeter */}
              <rect
                x="18"
                y="18"
                width="644"
                height="244"
                rx="6"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.5"
                strokeDasharray="6 3"
              />

              {/* Zone A: Stage / Ceremony / Focal Anchor */}
              <rect
                x="36"
                y="36"
                width="175"
                height="208"
                rx="4"
                fill="rgba(20, 184, 166, 0.14)"
                stroke="#2DD4BF"
                strokeWidth="1.5"
              />
              <text x="48" y="62" fill="#5EEAD4" fontSize="11" fontFamily="monospace">
                ZONE A · FOCAL STAGE
              </text>
              <text x="48" y="82" fill="#F8FAFC" fontSize="11.5" fontWeight="600">
                {plan.vertical === 'wedding'
                  ? 'Ceremony Arch & Quartet'
                  : plan.vertical === 'birthday'
                    ? 'DJ Booth & Cello Stage'
                    : 'Solar Main Stage & ASL'}
              </text>
              <text x="50" y="102" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                Inductive Loop + 1:12 Ramp
              </text>
              <circle
                cx="124"
                cy="172"
                r="38"
                fill="rgba(45, 212, 191, 0.12)"
                stroke="#2DD4BF"
                strokeDasharray="3 3"
              />
              <text
                x="124"
                y="176"
                textAnchor="middle"
                fill="#E2E8F0"
                fontSize="10"
                fontFamily="monospace"
              >
                PA Coverage
              </text>

              {/* Zone B: Primary Dining / Audience Seating Matrix */}
              <rect
                x="228"
                y="36"
                width="244"
                height="208"
                rx="4"
                fill="rgba(56, 189, 248, 0.1)"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              <text x="244" y="62" fill="#7DD3FC" fontSize="11" fontFamily="monospace">
                ZONE B · HOSPITALITY MATRIX
              </text>
              <text x="244" y="82" fill="#F8FAFC" fontSize="13" fontWeight="600">
                {plan.guestCount} Pax Seating &amp; Aisles
              </text>

              {/* Render Seating Tables */}
              {[0, 1, 2].map((col) =>
                [0, 1].map((row) => (
                  <g
                    key={`tbl-${col}-${row}`}
                    transform={`translate(${262 + col * 68}, ${118 + row * 62})`}
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r="18"
                      fill="rgba(248, 250, 252, 0.08)"
                      stroke="#94A3B8"
                      strokeWidth="1.2"
                    />
                    <text
                      x="18"
                      y="22"
                      textAnchor="middle"
                      fill="#E2E8F0"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      T{col * 2 + row + 1}
                    </text>
                  </g>
                ))
              )}

              {/* Zone C: Culinary, Allergen Isolation & Quiet Lounge */}
              <rect
                x="488"
                y="36"
                width="156"
                height="98"
                rx="4"
                fill="rgba(251, 191, 36, 0.12)"
                stroke="#FBBF24"
                strokeWidth="1.5"
              />
              <text x="502" y="60" fill="#FDE68A" fontSize="10" fontFamily="monospace">
                ZONE C · CULINARY
              </text>
              <text x="502" y="78" fill="#F8FAFC" fontSize="12" fontWeight="600">
                Allergen-Safe Prep
              </text>
              <text x="502" y="96" fill="#CBD5E1" fontSize="10">
                Botanical Bar &amp; Tasting
              </text>

              <rect
                x="488"
                y="146"
                width="156"
                height="98"
                rx="4"
                fill="rgba(167, 139, 250, 0.12)"
                stroke="#C4B5FD"
                strokeWidth="1.5"
              />
              <text x="502" y="170" fill="#DDD6FE" fontSize="10" fontFamily="monospace">
                ZONE D · ACCESS &amp; CARE
              </text>
              <text x="502" y="188" fill="#F8FAFC" fontSize="12" fontWeight="600">
                Quiet Sensory Lounge
              </text>
              <text x="502" y="206" fill="#CBD5E1" fontSize="10">
                Step-Free Transit Drop
              </text>
            </svg>
          </div>

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

        {/* Right 5 Columns: Critical Path Status, Inclusion Protocol & Quick Actions */}
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
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed"
                >
                  <ShieldCheck
                    className="w-4 h-4 text-teal-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{note}</span>
                </div>
              ))}
            </div>

            {/* Budget Overrun or Nominal Status Alert */}
            {budget.overrunCategories.length > 0 ? (
              <div
                role="status"
                className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1"
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                  <span>Category Variance Detected ({budget.overrunCategories.length})</span>
                </div>
                <p className="text-amber-900">
                  Actual spend exceeds allocation in:{' '}
                  <span className="font-semibold">{budget.overrunCategories.join(', ')}</span>. Use
                  the Budget Ledger auto-rebalancer to contain total spend.
                </p>
              </div>
            ) : (
              <div
                role="status"
                className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1"
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>All Financial &amp; Compliance Guardrails Nominal</span>
                </div>
                <p className="text-emerald-900">
                  {readiness.criticalPathRemaining} critical-path milestones remaining before
                  event day ({plan.eventDate}).
                </p>
              </div>
            )}
          </div>

          {/* Direct Module Jump Links */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-900">Workspace Modules</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab('budget')}
                className="flex items-center justify-between p-3 text-left text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>Budget Ledger ({plan.budgetItems.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('timeline')}
                className="flex items-center justify-between p-3 text-left text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>Run of Show ({plan.timelineItems.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('vendors')}
                className="flex items-center justify-between p-3 text-left text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>Vendor Matrix ({plan.vendors.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('ai')}
                className="flex items-center justify-between p-3 text-left text-xs font-semibold text-teal-900 bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200 rounded-lg transition-colors cursor-pointer"
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
