/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AIAdviceResponse,
  BlueprintGeneratorInput,
  BudgetCategory,
  BudgetItem,
  BudgetSummary,
  CategoryBreakdown,
  EventPlan,
  EventVertical,
  PersonalizedIdea,
  ReadinessMetrics,
  TimelineItem,
  VendorItem,
} from '../types/planner';
import { escapeCsvCell, sanitizeText } from './security.ts';

export const ALL_BUDGET_CATEGORIES: readonly BudgetCategory[] = [
  'Venue & Permits',
  'Catering & Beverage',
  'Production & AV',
  'Decor & Floral',
  'Entertainment & Talent',
  'Photography & Media',
  'Logistics & Accessibility',
  'Contingency Reserve',
] as const;

const VERTICAL_WEIGHTS: Record<EventVertical, Record<BudgetCategory, number>> = {
  wedding: {
    'Venue & Permits': 0.24,
    'Catering & Beverage': 0.30,
    'Production & AV': 0.07,
    'Decor & Floral': 0.12,
    'Entertainment & Talent': 0.08,
    'Photography & Media': 0.10,
    'Logistics & Accessibility': 0.04,
    'Contingency Reserve': 0.05,
  },
  birthday: {
    'Venue & Permits': 0.22,
    'Catering & Beverage': 0.34,
    'Production & AV': 0.08,
    'Decor & Floral': 0.10,
    'Entertainment & Talent': 0.12,
    'Photography & Media': 0.06,
    'Logistics & Accessibility': 0.03,
    'Contingency Reserve': 0.05,
  },
  community: {
    'Venue & Permits': 0.16,
    'Catering & Beverage': 0.20,
    'Production & AV': 0.22,
    'Decor & Floral': 0.06,
    'Entertainment & Talent': 0.14,
    'Photography & Media': 0.05,
    'Logistics & Accessibility': 0.10,
    'Contingency Reserve': 0.07,
  },
};

/**
 * Computes deterministic financial metrics, category breakdowns, per-guest costs,
 * and overrun alerts in O(N) time.
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
    const entry = categoryMap.get(category)!;
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
 * Proportionally rebalances unlocked budget line items so that total allocated
 * matches the target budget, while preserving locked/contracted items.
 */
export function rebalanceBudget(items: BudgetItem[], targetBudget: number): BudgetItem[] {
  const safeTarget = Math.max(0, Math.round(targetBudget));
  if (items.length === 0) return [];

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

  const updated = items.map((item) => {
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

  // Distribute rounding remainder to the last unlocked item for exact total parity
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

/**
 * Evaluates operational readiness across timeline tasks, critical path dependencies,
 * and 4-point vendor compliance checklists.
 */
export function calculateReadinessMetrics(plan: EventPlan): ReadinessMetrics {
  const totalTasks = plan.timelineItems.length;
  let completedTasks = 0;
  let criticalPathRemaining = 0;
  let atRiskTasks = 0;

  for (const task of plan.timelineItems) {
    if (task.status === 'completed') {
      completedTasks++;
    } else {
      if (task.isCriticalPath) {
        criticalPathRemaining++;
      }
      if (task.status === 'at_risk') {
        atRiskTasks++;
      }
    }
  }

  const taskCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  const totalVendors = plan.vendors.length;
  let contractedVendors = 0;
  let fullyCompliantVendors = 0;

  for (const vendor of plan.vendors) {
    if (vendor.status === 'contracted') {
      contractedVendors++;
    }
    const c = vendor.compliance;
    if (
      c.contractSigned &&
      c.depositPaid &&
      c.insuranceVerified &&
      c.accessibilityConfirmed
    ) {
      fullyCompliantVendors++;
    }
  }

  const vendorComplianceRate =
    totalVendors > 0 ? (fullyCompliantVendors / totalVendors) * 100 : 100;

  const overallReadinessScore = Math.round(
    taskCompletionRate * 0.6 + vendorComplianceRate * 0.4
  );

  let readinessStatus: ReadinessMetrics['readinessStatus'] = 'On Track';
  if (atRiskTasks > 0 || overallReadinessScore < 45) {
    readinessStatus = 'Action Required';
  } else if (overallReadinessScore >= 80 && criticalPathRemaining === 0) {
    readinessStatus = 'Production Ready';
  }

  return {
    completedTasks,
    totalTasks,
    taskCompletionRate,
    criticalPathRemaining,
    atRiskTasks,
    contractedVendors,
    totalVendors,
    fullyCompliantVendors,
    overallReadinessScore,
    readinessStatus,
  };
}

/**
 * Generates a complete, context-aware EventPlan deterministically from user parameters.
 * Adjusts weights for outdoor weather contingencies, guest scale, and vertical persona.
 */
export function generateDeterministicBlueprint(input: BlueprintGeneratorInput): EventPlan {
  const weights = { ...VERTICAL_WEIGHTS[input.vertical] };

  // Context-aware weight shift: outdoor events increase Contingency & Production (tenting/power)
  if (input.setting === 'outdoor') {
    weights['Contingency Reserve'] += 0.02;
    weights['Production & AV'] += 0.02;
    weights['Venue & Permits'] = Math.max(0.10, weights['Venue & Permits'] - 0.02);
    weights['Entertainment & Talent'] = Math.max(0.06, weights['Entertainment & Talent'] - 0.02);
  }

  const budgetItems: BudgetItem[] = (
    Object.entries(weights) as Array<[BudgetCategory, number]>
  ).map(([category, weight], idx) => {
    const allocated = Math.round(input.totalBudget * weight);
    const isInitialLock = idx < 2;
    const actual = isInitialLock ? allocated : Math.round(allocated * 0.85);
    const paid = isInitialLock ? Math.round(allocated * 0.5) : 0;

    const categoryTitles: Record<BudgetCategory, Record<EventVertical, string>> = {
      'Venue & Permits': {
        wedding: 'Ceremony & Reception Estate Rental',
        birthday: 'Private Terrace & Lounge Buyout',
        community: 'Civic Plaza Permit & Street Closure Fee',
      },
      'Catering & Beverage': {
        wedding: `Seasonal Plated Dinner & Bar (${input.guestCount} Guests)`,
        birthday: `Artisanal Tasting Stations & Signature Mocktail/Cocktail Bar (${input.guestCount} Guests)`,
        community: `Local Food Truck Stipends & Hydration Stations (${input.guestCount} Attendees)`,
      },
      'Production & AV': {
        wedding: 'Architectural Uplighting & Wireless Ceremony Sound',
        birthday: 'Acoustic Sound System & Ambient Projection Mapping',
        community: 'Main Stage PA Array, Generators & ADA Ramp Staging',
      },
      'Decor & Floral': {
        wedding: 'Sustainable Botanical Installations & Linen Tablescapes',
        birthday: 'Custom Entry Archway, Candlelight & Table Styling',
        community: 'Wayfinding Signage, Welcome Banners & Shade Canopies',
      },
      'Entertainment & Talent': {
        wedding: 'Live String Quartet & Reception DJ Set',
        birthday: 'Live Vinyl DJ & Interactive Photo Booth',
        community: 'Regional Acoustic Ensemble & Community Workshop Hosts',
      },
      'Photography & Media': {
        wedding: 'Full-Day Documentary Photo & Cinema Team',
        birthday: 'Candid Editorial Photographer & Instant Print Station',
        community: 'Event Documentation & Livestream Production Crew',
      },
      'Logistics & Accessibility': {
        wedding: 'Guest Shuttle Service, Coat Check & Step-Free Access',
        birthday: 'Valet Coordination & Restroom Attendants',
        community: 'ADA Accessible Restrooms, First-Aid Tent & Waste Sorting',
      },
      'Contingency Reserve': {
        wedding: 'Weather Marquee & Overtime Buffer',
        birthday: 'Last-Minute Guest Count & Service Buffer',
        community: 'Inclement Weather & Crowd Safety Reserve',
      },
    };

    return {
      id: `b-${input.vertical}-${idx + 1}`,
      category,
      title: categoryTitles[category][input.vertical],
      allocated,
      actual,
      paid,
      isLocked: isInitialLock,
      notes:
        input.setting === 'outdoor' && category === 'Contingency Reserve'
          ? 'Includes clear-span rain canopy hold fee.'
          : 'Allocated via context-weighted vertical benchmark.',
    };
  });

  const timelineItems: TimelineItem[] = [
    {
      id: `t-${input.vertical}-1`,
      phase: 'Foundation (6–12 Months)',
      timeOffsetOrSlot: 'T-24 Weeks',
      title: `Lock ${input.location} contract, capacity layout (${input.guestCount} pax), and insurance certificate`,
      owner: 'Lead Producer',
      status: 'completed',
      isCriticalPath: true,
      dependencyNote: 'Unlocks catering and production power distribution layout.',
    },
    {
      id: `t-${input.vertical}-2`,
      phase: 'Vendor Lock (3–5 Months)',
      timeOffsetOrSlot: 'T-14 Weeks',
      title: 'Finalize culinary menu, allergen matrix, and beverage service quantities',
      owner: 'Culinary Director',
      status: 'completed',
      isCriticalPath: true,
      dependencyNote: 'Requires dietary survey responses.',
    },
    {
      id: `t-${input.vertical}-3`,
      phase: 'Detailed Operations (1–2 Months)',
      timeOffsetOrSlot: 'T-6 Weeks',
      title:
        input.setting === 'outdoor'
          ? 'Confirm 48-hour weather trigger protocol and clear-span tent reservation'
          : 'Confirm acoustic load-in elevator schedule and HVAC zoning',
      owner: 'Operations Lead',
      status: 'in_progress',
      isCriticalPath: true,
    },
    {
      id: `t-${input.vertical}-4`,
      phase: 'Final Week Confirmation',
      timeOffsetOrSlot: 'T-5 Days',
      title: `Distribute final seating/zone map, dietary badges, and contact sheet for ${input.guestCount} attendees`,
      owner: 'Guest Experience Lead',
      status: 'pending',
      isCriticalPath: true,
    },
    {
      id: `t-${input.vertical}-5`,
      phase: 'Day-Of Run of Show',
      timeOffsetOrSlot: '14:00',
      title: 'Production, AV, and accessibility route walkthrough with venue safety officer',
      owner: 'Stage Manager',
      status: 'pending',
      isCriticalPath: true,
    },
    {
      id: `t-${input.vertical}-6`,
      phase: 'Day-Of Run of Show',
      timeOffsetOrSlot: '17:00',
      title: 'Doors open: Welcome reception, acoustic prelude, and step-free check-in',
      owner: 'Hospitality Team',
      status: 'pending',
      isCriticalPath: false,
    },
    {
      id: `t-${input.vertical}-7`,
      phase: 'Day-Of Run of Show',
      timeOffsetOrSlot: '18:30',
      title: 'Main program, keynote/toasts, and primary culinary service',
      owner: 'Lead Producer',
      status: 'pending',
      isCriticalPath: true,
    },
  ];

  const vendors: VendorItem[] = [
    {
      id: `v-${input.vertical}-1`,
      name: `${input.location} Hospitality Group`,
      category: 'Venue & Permits',
      status: 'contracted',
      quotedAmount: budgetItems[0].actual,
      rating: 4.9,
      contactPerson: 'Elena Rostova',
      contactEmail: 'elena@venue-ops.example.com',
      leadTimeWeeks: 16,
      sustainabilityNote: 'LEED Gold certified facility with solar backup.',
      compliance: {
        contractSigned: true,
        depositPaid: true,
        insuranceVerified: true,
        accessibilityConfirmed: true,
      },
    },
    {
      id: `v-${input.vertical}-2`,
      name: 'Verdant Table Culinary Collective',
      category: 'Catering & Beverage',
      status: 'contracted',
      quotedAmount: budgetItems[1].actual,
      rating: 4.8,
      contactPerson: 'Chef Marcus Vance',
      contactEmail: 'marcus@verdanttable.example.com',
      leadTimeWeeks: 8,
      sustainabilityNote: 'Zero single-use plastics; 100% compostable serviceware.',
      compliance: {
        contractSigned: true,
        depositPaid: true,
        insuranceVerified: true,
        accessibilityConfirmed: true,
      },
    },
    {
      id: `v-${input.vertical}-3`,
      name: 'Lumen & Resonance Production',
      category: 'Production & AV',
      status: 'negotiating',
      quotedAmount: budgetItems[2].actual,
      rating: 4.7,
      contactPerson: 'Devon Brooks',
      contactEmail: 'devon@lumenav.example.com',
      leadTimeWeeks: 4,
      sustainabilityNote: 'Low-draw LED fixtures and inductive hearing-loop support.',
      compliance: {
        contractSigned: true,
        depositPaid: false,
        insuranceVerified: true,
        accessibilityConfirmed: true,
      },
    },
  ];

  const ideas: PersonalizedIdea[] = [
    {
      id: `idea-${input.vertical}-1`,
      category: 'Guest Experience',
      title: 'Interactive QR Audio Keepsake & Schedule Companion',
      description:
        'Guests scan a linen-printed card at their table to leave voice notes for the hosts and view real-time dietary/allergen tags for each course.',
      estimatedCost: Math.min(450, Math.round(input.totalBudget * 0.015)),
      impactLevel: 'Signature Detail',
      isSaved: true,
      rationale: `Tailored for ${input.guestCount} guests at ${input.location}.`,
    },
    {
      id: `idea-${input.vertical}-2`,
      category: 'Sustainability & Inclusion',
      title: 'Potted Living Centerpieces with Post-Event Community Donation',
      description:
        'Replace cut foam florals with potted herbs and native perennials that guests take home or donate to local community gardens.',
      estimatedCost: Math.min(1200, Math.round(input.totalBudget * 0.04)),
      impactLevel: 'Cost Optimizer',
      isSaved: true,
      rationale: 'Reduces floral waste by 75% while doubling as guest favors.',
    },
  ];

  const customNote = sanitizeText(input.priorities, 200);

  return {
    id: `plan-${Date.now()}`,
    title: input.title,
    subtitle: `${input.vertical.charAt(0).toUpperCase() + input.vertical.slice(1)} Blueprint · ${input.location}`,
    vertical: input.vertical,
    eventDate: input.eventDate,
    location: input.location,
    setting: input.setting,
    guestCount: input.guestCount,
    totalBudget: input.totalBudget,
    dietaryAndAccessibilityNotes: [
      'Step-free ADA seating and 36-inch minimum aisle clearance verified',
      'Dedicated allergen-isolated prep station (Gluten-Free, Nut-Free, Vegan)',
      ...(customNote ? [`Custom Priority: ${customNote}`] : []),
    ],
    weatherContingencyPlan:
      input.setting === 'indoor'
        ? 'Climate-controlled interior with redundant backup generator and covered drop-off portico.'
        : '48-hour meteorological decision gate: Clear-span marquee tent on standby with weighted ballast and heated air blowers.',
    budgetItems,
    timelineItems,
    vendors,
    ideas,
  };
}

/**
 * Generates structured, context-aware recommendations based on the user's prompt
 * and current EventPlan state. Used as a deterministic fallback or hybrid validator.
 */
export function generateContextualAIAdvice(
  prompt: string,
  plan: EventPlan
): AIAdviceResponse {
  const summary = calculateBudgetSummary(plan);
  const lower = prompt.toLowerCase();
  const isWeatherQuery = /rain|weather|outdoor|tent|wind|heat|cold/.test(lower);
  const isBudgetQuery = /budget|cost|save|cheaper|reduce|overrun|expensive/.test(lower);
  const isMenuQuery = /food|menu|vegan|diet|catering|drink|allergen/.test(lower);

  const perGuestTarget = Math.round(plan.totalBudget / Math.max(1, plan.guestCount));

  return {
    executiveSummary: isWeatherQuery
      ? `Activated Weather Resilience Protocol for "${plan.title}" (${plan.guestCount} guests at ${plan.location}). Reallocated contingency reserves to lock a clear-span canopy and slip-resistant walkways without exceeding the $${plan.totalBudget.toLocaleString()} ceiling.`
      : isBudgetQuery
        ? `Cost-Optimization Audit for "${plan.title}": Identified ${Math.round(plan.totalBudget * 0.08).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} in high-leverage savings by consolidating AV/lighting packages and shifting peak-season floral stems to architectural greenery.`
        : `Contextual Plan Synthesis for "${plan.title}" (${plan.vertical.toUpperCase()} · ${plan.guestCount} attendees · $${perGuestTarget}/guest target): Aligned budget allocations, critical-path run-of-show milestones, and inclusive guest experience touchpoints to your request.`,
    contextualAnalysis: `Current utilization stands at ${summary.utilizationRatio}% ($${summary.totalActual.toLocaleString()} actual vs. $${plan.totalBudget.toLocaleString()} budget, or $${summary.actualPerGuest}/guest). ${
      summary.overrunCategories.length > 0
        ? `Watch categories requiring containment: ${summary.overrunCategories.join(', ')}.`
        : 'All budget categories are operating within nominal tolerances.'
    }`,
    riskMitigation: isWeatherQuery
      ? 'Enforce a T-48hr Go/No-Go weather call with the venue director and AV team; pre-stage acoustic wind-screens and covered power distribution boxes.'
      : 'Maintain a minimum 5% unencumbered contingency reserve until T-72 hours and verify Certificate of Insurance (COI) endorsements for all load-in vendors.',
    budgetAdjustments: [
      {
        category: isMenuQuery ? 'Catering & Beverage' : 'Decor & Floral',
        title: isMenuQuery
          ? 'Interactive Chef Station & Zero-Proof Botanical Bar Optimization'
          : 'Modular Architectural Lighting & Repurposed Ceremony-to-Reception Florals',
        suggestedAmount: Math.round(plan.totalBudget * (isMenuQuery ? 0.26 : 0.09)),
        reason: isMenuQuery
          ? 'Reduces plated staffing overhead by 18% while increasing dietary flexibility (Vegan/GF/Halal/Kosher).'
          : 'Dual-purposing ceremony installations for reception tables saves 28% on floral fabrication.',
      },
      {
        category: 'Contingency Reserve',
        title: isWeatherQuery
          ? 'All-Weather Clear-Span Canopy & Heated Flooring Hold'
          : 'Protected Operational Buffer (5.5% Target)',
        suggestedAmount: Math.round(plan.totalBudget * 0.055),
        reason: 'Protects against day-of vendor overtime and last-minute guest count variance.',
      },
    ],
    newMilestones: [
      {
        phase: 'Detailed Operations (1–2 Months)',
        timeOffsetOrSlot: 'T-4 Weeks',
        title: `Execute contextual adjustment from AI Co-Planner: "${sanitizeText(prompt, 70)}"`,
        owner: 'Lead Producer',
        isCriticalPath: true,
      },
      {
        phase: 'Final Week Confirmation',
        timeOffsetOrSlot: 'T-72 Hours',
        title: 'Confirm dietary allergen labels, step-free routing, and emergency egress signage',
        owner: 'Hospitality & Safety Lead',
        isCriticalPath: true,
      },
    ],
    personalizedIdeas: [
      {
        category: 'Culinary & Menu',
        title: 'Hyper-Local Seasonal Tasting Flight with Allergen-Safe Pairing Cards',
        description:
          'Curated small-plate flight featuring regional producers, with clear dietary icons (Vegan, Gluten-Free, Nut-Free) printed at each station.',
        estimatedCost: Math.max(250, Math.round(plan.totalBudget * 0.025)),
        impactLevel: 'High Impact',
        rationale: `Directly addresses "${sanitizeText(prompt, 60)}" while keeping per-guest spend predictable.`,
      },
      {
        category: 'Atmosphere & Decor',
        title: 'Acoustic Quiet Lounge & Sensory-Friendly Recharge Nook',
        description:
          'A dedicated low-decibel seating alcove with warm indirect lighting, water service, and step-free access for elders, parents, and neurodivergent guests.',
        estimatedCost: Math.max(180, Math.round(plan.totalBudget * 0.015)),
        impactLevel: 'Signature Detail',
        rationale: 'Elevates accessibility and multi-generational comfort with minimal footprint.',
      },
    ],
    engineSource: 'deterministic-fallback',
  };
}

/**
 * Exports the complete event production book to clean Markdown.
 */
export function exportPlanToMarkdown(
  plan: EventPlan,
  budget: BudgetSummary,
  readiness: ReadinessMetrics
): string {
  const lines: string[] = [
    `# ${plan.title} — Master Event Production Book`,
    ``,
    `- **Vertical**: ${plan.vertical.toUpperCase()}`,
    `- **Date**: ${plan.eventDate}`,
    `- **Location**: ${plan.location} (${plan.setting})`,
    `- **Attendance**: ${plan.guestCount} Guests`,
    `- **Total Budget**: $${plan.totalBudget.toLocaleString()} (Actual: $${budget.totalActual.toLocaleString()} · $${budget.actualPerGuest}/guest)`,
    `- **Readiness Score**: ${readiness.overallReadinessScore}% (${readiness.readinessStatus})`,
    ``,
    `## 1. Budget Ledger`,
    `| Category | Line Item | Allocated | Actual | Paid | Status |`,
    `| :--- | :--- | ---: | ---: | ---: | :--- |`,
    ...plan.budgetItems.map(
      (item) =>
        `| ${item.category} | ${item.title} | $${item.allocated.toLocaleString()} | $${item.actual.toLocaleString()} | $${item.paid.toLocaleString()} | ${
          item.actual > item.allocated ? 'Overrun' : item.isLocked ? 'Locked' : 'Flexible'
        } |`
    ),
    ``,
    `## 2. Critical-Path Timeline & Run of Show`,
    ...plan.timelineItems.map(
      (t) =>
        `- **[${t.status.toUpperCase()}]** \`${t.timeOffsetOrSlot}\` (${t.phase}) — **${t.title}** *(Owner: ${t.owner}${
          t.isCriticalPath ? ', Critical Path' : ''
        })*`
    ),
    ``,
    `## 3. Vendor Compliance Matrix`,
    ...plan.vendors.map(
      (v) =>
        `- **${v.name}** (${v.category}) — Status: ${v.status.toUpperCase()} · Quote: $${v.quotedAmount.toLocaleString()} · Contact: ${v.contactPerson} (${v.contactEmail})`
    ),
    ``,
    `## 4. Accessibility & Contingency Protocols`,
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
