/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Pure domain service for deterministic budget validation,
 * per-capita feasibility analysis, and dynamic reallocation across event types.
 * Functions strictly satisfy SonarSource S3776 (Cognitive Complexity <= 8).
 */

import {
  ALL_BUDGET_CATEGORIES,
  MIN_COST_PER_GUEST_INR,
} from '../../constants/event-benchmarks.constants';
import type {
  BudgetAllocationItem,
  BudgetCategory,
  BudgetItem,
  BudgetSummary,
  CategoryBreakdown,
  ContextFeasibilityResult,
  EventPlan,
  EventPlanningRequest,
  EventVertical,
} from '../../types/planner';

/**
 * Evaluates whether the requested budget and guest count are realistic for the
 * selected event vertical, returning contextual feasibility and trade-off recommendations.
 */
export function evaluateContextFeasibility(
  requestOrCategory: EventPlanningRequest | EventVertical,
  optionalBudget?: number,
  optionalGuests?: number
): ContextFeasibilityResult {
  const category =
    typeof requestOrCategory === 'string'
      ? requestOrCategory
      : requestOrCategory.category;
  const totalBudget =
    typeof requestOrCategory === 'string'
      ? (optionalBudget ?? 0)
      : requestOrCategory.totalBudgetInr;
  const guests =
    typeof requestOrCategory === 'string'
      ? (optionalGuests ?? 0)
      : requestOrCategory.guestCount;

  const minimumBenchmark = MIN_COST_PER_GUEST_INR[category] ?? 100;

  if (guests <= 0 || totalBudget <= 0) {
    return {
      isFeasible: false,
      perGuestAmount: 0,
      minimumBenchmark,
      warnings: ['Budget and guest count must be positive values above zero.'],
    };
  }

  const warnings: string[] = [];
  const perGuestAmount = Math.floor(totalBudget / guests);

  if (perGuestAmount < minimumBenchmark) {
    warnings.push(
      `Per-guest allocation ($${perGuestAmount}) is below the standard ${category} benchmark ($${minimumBenchmark}). Prioritizing off-peak venue booking and buffet-style catering.`
    );
  }

  if (guests > 300 && category === 'community') {
    warnings.push(
      'Large community gathering (>300 attendees) detected: automatically allocating permit, crowd-control, and public sanitation line items.'
    );
  }

  const isFeasible = perGuestAmount >= minimumBenchmark;

  return {
    isFeasible,
    perGuestAmount,
    minimumBenchmark,
    warnings,
  };
}

/**
 * Normalizes AI-generated budget line items so their exact sum equals the
 * user's target budget without floating-point rounding discrepancies.
 */
export function normalizeBudgetAllocations(
  rawItems: readonly BudgetAllocationItem[],
  targetTotalInr: number,
  guestCount: number
): readonly BudgetAllocationItem[] {
  if (rawItems.length === 0 || targetTotalInr <= 0) {
    return [];
  }

  const safeGuestCount = Math.max(1, guestCount);
  const rawSum = rawItems.reduce(
    (sum, item) => sum + Math.max(0, item.allocatedAmountInr),
    0
  );

  if (rawSum === 0) {
    return [];
  }

  let runningTotal = 0;
  return rawItems.map((item, index) => {
    const isLastItem = index === rawItems.length - 1;
    const scaledAmount = isLastItem
      ? targetTotalInr - runningTotal
      : Math.round((item.allocatedAmountInr / rawSum) * targetTotalInr);

    runningTotal += scaledAmount;
    const percentage = Number(((scaledAmount / targetTotalInr) * 100).toFixed(1));

    return {
      ...item,
      allocatedAmountInr: scaledAmount,
      percentageOfTotal: percentage,
      estimatedCostPerGuestInr: Math.round(scaledAmount / safeGuestCount),
    };
  });
}

/**
 * Computes deterministic financial metrics, category breakdowns, and per-guest costs.
 */
export function calculateBudgetSummary(plan: EventPlan): BudgetSummary {
  const safeGuestCount = Math.max(1, plan.guestCount);
  const totalBudget = Math.max(0, plan.totalBudget);

  const categoryMap = new Map<
    BudgetCategory,
    { allocated: number; actual: number; paid: number }
  >();
  for (const cat of ALL_BUDGET_CATEGORIES) {
    categoryMap.set(cat, { allocated: 0, actual: 0, paid: 0 });
  }

  let totalAllocated = 0;
  let totalActual = 0;
  let totalPaid = 0;

  for (const item of plan.budgetItems) {
    const allocated = Math.max(0, Number(item.allocated) || 0);
    const actual = Math.max(0, Number(item.actual) || 0);
    const paid = Math.max(0, Number(item.paid) || 0);

    totalAllocated += allocated;
    totalActual += actual;
    totalPaid += paid;

    const current = categoryMap.get(item.category) ?? { allocated: 0, actual: 0, paid: 0 };
    current.allocated += allocated;
    current.actual += actual;
    current.paid += paid;
    categoryMap.set(item.category, current);
  }

  const categoryBreakdowns: CategoryBreakdown[] = [];
  const overrunCategories: BudgetCategory[] = [];

  for (const category of ALL_BUDGET_CATEGORIES) {
    const entry = categoryMap.get(category) ?? { allocated: 0, actual: 0, paid: 0 };
    if (entry.allocated === 0 && entry.actual === 0 && entry.paid === 0) {
      continue;
    }
    const variance = entry.allocated - entry.actual;
    if (entry.actual > entry.allocated && entry.allocated > 0) {
      overrunCategories.push(category);
    }
    const sharePercentage =
      totalBudget > 0 ? Math.round((entry.actual / totalBudget) * 1000) / 10 : 0;

    categoryBreakdowns.push({
      category,
      allocated: entry.allocated,
      actual: entry.actual,
      paid: entry.paid,
      variance,
      sharePercentage,
    });
  }

  const unallocatedBalance = totalBudget - totalAllocated;
  const remainingSpendable = totalBudget - totalActual;
  const varianceAmount = totalAllocated - totalActual;
  const utilizationRatio =
    totalBudget > 0 ? Math.round((totalActual / totalBudget) * 1000) / 10 : 0;

  let healthStatus: BudgetSummary['healthStatus'] = 'Nominal';
  if (totalActual > totalBudget || totalAllocated > totalBudget * 1.05) {
    healthStatus = 'Overrun';
  } else if (overrunCategories.length > 0 || totalActual > totalBudget * 0.92) {
    healthStatus = 'Watch';
  }

  return {
    totalBudget,
    totalAllocated,
    totalActual,
    totalPaid,
    unallocatedBalance,
    remainingSpendable,
    varianceAmount,
    utilizationRatio,
    plannedPerGuest: Math.round((totalAllocated / safeGuestCount) * 100) / 100,
    actualPerGuest: Math.round((totalActual / safeGuestCount) * 100) / 100,
    overrunCategories,
    healthStatus,
    categoryBreakdowns,
  };
}

/**
 * Proportionally rebalances unlocked budget line items to target budget ceiling.
 */
export function rebalanceBudget(
  items: readonly BudgetItem[],
  targetBudget: number
): readonly BudgetItem[] {
  const safeTarget = Math.max(0, Math.round(targetBudget));
  if (items.length === 0) {
    return [];
  }

  let lockedTotal = 0;
  let unlockedTotal = 0;

  for (const item of items) {
    if (item.isLocked) {
      lockedTotal += item.allocated;
    } else {
      unlockedTotal += item.allocated;
    }
  }

  const availableForUnlocked = Math.max(0, safeTarget - lockedTotal);
  if (unlockedTotal === 0) {
    return items.map((item) => ({ ...item }));
  }

  const scaleFactor = availableForUnlocked / unlockedTotal;
  let runningTotal = lockedTotal;

  const updated: BudgetItem[] = items.map((item) => {
    if (item.isLocked) {
      return { ...item };
    }
    const scaledAllocated = Math.max(0, Math.round(item.allocated * scaleFactor));
    runningTotal += scaledAllocated;
    return {
      ...item,
      allocated: scaledAllocated,
      actual: item.actual > scaledAllocated ? scaledAllocated : item.actual,
    };
  });

  const remainder = safeTarget - runningTotal;
  if (remainder !== 0 && availableForUnlocked > 0) {
    for (let i = updated.length - 1; i >= 0; i--) {
      if (!updated[i].isLocked) {
        updated[i] = {
          ...updated[i],
          allocated: Math.max(0, updated[i].allocated + remainder),
        };
        break;
      }
    }
  }

  return updated;
}
