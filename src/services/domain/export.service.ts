/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Domain export service for Markdown production books and
 * RFC-4180 CSV budget ledgers with formula-injection neutralization.
 */

import type { BudgetSummary, EventPlan, ReadinessMetrics } from '../../types/planner';
import { escapeCsvCell } from '../../domain/security';
import { calculateBudgetSummary } from './budget-optimizer.service';
import { calculateReadinessMetrics } from './readiness.service';

/**
 * Exports the complete event production book to clean Markdown.
 */
export function exportPlanToMarkdown(
  plan: EventPlan,
  budget?: BudgetSummary,
  readiness?: ReadinessMetrics
): string {
  const effectiveBudget = budget ?? calculateBudgetSummary(plan);
  const effectiveReadiness = readiness ?? calculateReadinessMetrics(plan);

  const lines: string[] = [
    `# ${plan.title} — Master Event Production Book`,
    '',
    `- **Vertical**: ${plan.vertical.toUpperCase()}`,
    `- **Date**: ${plan.eventDate}`,
    `- **Location**: ${plan.location} (${plan.setting})`,
    `- **Attendance**: ${plan.guestCount} Guests`,
    `- **Total Budget**: $${plan.totalBudget.toLocaleString()} (Actual: $${effectiveBudget.totalActual.toLocaleString()} · $${effectiveBudget.actualPerGuest}/guest)`,
    `- **Readiness Score**: ${effectiveReadiness.overallReadinessScore}% (${effectiveReadiness.readinessStatus})`,
    '',
    '## 1. Budget Ledger',
    '| Category | Line Item | Allocated | Actual | Paid | Status |',
    '| :--- | :--- | ---: | ---: | ---: | :--- |',
    ...plan.budgetItems.map(
      (item) =>
        `| ${item.category} | ${item.title} | $${item.allocated.toLocaleString()} | $${item.actual.toLocaleString()} | $${item.paid.toLocaleString()} | ${
          item.actual > item.allocated ? 'Overrun' : item.isLocked ? 'Locked' : 'Flexible'
        } |`
    ),
    '',
    '## 2. Critical-Path Timeline & Run of Show',
    ...plan.timelineItems.map(
      (t) =>
        `- **[${t.status.toUpperCase()}]** \`${t.timeOffsetOrSlot}\` (${t.phase}) — **${t.title}** *(Owner: ${t.owner}${
          t.isCriticalPath ? ', Critical Path' : ''
        })*`
    ),
    '',
    '## 3. Vendor Compliance Matrix',
    ...plan.vendors.map(
      (v) =>
        `- **${v.name}** (${v.category}) — Status: ${v.status.toUpperCase()} · Quote: $${v.quotedAmount.toLocaleString()} · Contact: ${v.contactPerson} (${v.contactEmail})`
    ),
    '',
    '## 4. Accessibility & Contingency Protocols',
    `- **Weather Contingency**: ${plan.weatherContingencyPlan}`,
    ...plan.dietaryAndAccessibilityNotes.map((note) => `- ${note}`),
  ];

  return lines.join('\n');
}

/**
 * Exports the budget ledger to RFC-4180 compliant CSV with formula injection protection.
 */
export function exportBudgetToCSV(plan: EventPlan): string {
  const headers = [
    'ID',
    'Category',
    'Line Item',
    'Allocated (USD)',
    'Actual (USD)',
    'Paid (USD)',
    'Variance (USD)',
    'Locked',
    'Notes',
  ];

  const rows = plan.budgetItems.map((item) => [
    escapeCsvCell(item.id),
    escapeCsvCell(item.category),
    escapeCsvCell(item.title),
    escapeCsvCell(item.allocated),
    escapeCsvCell(item.actual),
    escapeCsvCell(item.paid),
    escapeCsvCell(item.allocated - item.actual),
    escapeCsvCell(item.isLocked ? 'Yes' : 'No'),
    escapeCsvCell(item.notes),
  ]);

  return [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\n');
}
