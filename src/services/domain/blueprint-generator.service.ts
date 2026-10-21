/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Domain service for generating deterministic event plans
 * based on vertical persona, guest scale, venue setting, and weather contingency.
 */

import {
  CATEGORY_TITLES,
  VERTICAL_WEIGHTS,
} from '../../constants/event-benchmarks.constants';
import type {
  BlueprintGeneratorInput,
  BudgetCategory,
  BudgetItem,
  EventPlan,
  EventVertical,
  PersonalizedIdea,
  TimelineItem,
  VendorItem,
} from '../../types/planner';
import { sanitizeText } from '../../domain/security';

function buildBudgetItems(
  input: BlueprintGeneratorInput,
  weights: Record<BudgetCategory, number>
): BudgetItem[] {
  return (Object.entries(weights) as Array<[BudgetCategory, number]>).map(
    ([category, weight], idx) => {
      const allocated = Math.round(input.totalBudget * weight);
      const isInitialLock = idx < 2;
      const actual = isInitialLock ? allocated : Math.round(allocated * 0.85);
      const paid = isInitialLock ? Math.round(allocated * 0.5) : 0;
      const title = CATEGORY_TITLES[category][input.vertical];

      return {
        id: `b-${input.vertical}-${idx + 1}`,
        category,
        title,
        allocated,
        actual,
        paid,
        isLocked: isInitialLock,
        notes:
          input.setting === 'outdoor' && category === 'Contingency Reserve'
            ? 'Includes clear-span rain canopy hold fee.'
            : 'Allocated via context-weighted vertical benchmark.',
      };
    }
  );
}

function buildTimelineItems(input: BlueprintGeneratorInput): TimelineItem[] {
  return [
    {
      id: `t-${input.vertical}-1`,
      phase: 'Foundation (6–12 Months)',
      timeOffsetOrSlot: 'T-24 Weeks',
      title: `Lock ${input.location} contract and capacity layout (${input.guestCount} pax)`,
      owner: 'Lead Producer',
      status: 'completed',
      isCriticalPath: true,
      dependencyNote: 'Unlocks catering and production layout.',
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
      title: `Distribute final seating/zone map and contact sheet for ${input.guestCount} attendees`,
      owner: 'Guest Experience Lead',
      status: 'pending',
      isCriticalPath: true,
    },
    {
      id: `t-${input.vertical}-5`,
      phase: 'Day-Of Run of Show',
      timeOffsetOrSlot: '14:00',
      title: 'Production, AV, and accessibility route walkthrough with safety officer',
      owner: 'Stage Manager',
      status: 'pending',
      isCriticalPath: true,
    },
    {
      id: `t-${input.vertical}-6`,
      phase: 'Day-Of Run of Show',
      timeOffsetOrSlot: '17:00',
      title: 'Doors open: Welcome reception and step-free check-in',
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
}

function buildVendors(input: BlueprintGeneratorInput, firstBudgetItemSpend: number): VendorItem[] {
  return [
    {
      id: `v-${input.vertical}-1`,
      name: `${input.location} Venue Operations`,
      category: 'Venue & Permits',
      status: 'contracted',
      quotedAmount: firstBudgetItemSpend,
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
      name: 'Artisan Culinary & Botanical Bar Collective',
      category: 'Catering & Beverage',
      status: 'contracted',
      quotedAmount: Math.round(input.totalBudget * 0.32),
      rating: 4.8,
      contactPerson: 'Chef Marcus Sterling',
      contactEmail: 'marcus@artisancatering.example.com',
      leadTimeWeeks: 12,
      sustainabilityNote: '100% compostable serviceware and hyper-local farm sourcing.',
      compliance: {
        contractSigned: true,
        depositPaid: true,
        insuranceVerified: true,
        accessibilityConfirmed: true,
      },
    },
    {
      id: `v-${input.vertical}-3`,
      name: 'Acoustic Harmonics & Ambient Production',
      category: 'Production & AV',
      status: 'negotiating',
      quotedAmount: Math.round(input.totalBudget * 0.12),
      rating: 4.7,
      contactPerson: 'Julian Vance',
      contactEmail: 'julian@acousticharmonics.example.com',
      leadTimeWeeks: 8,
      sustainabilityNote: 'Energy-star certified low-draw solid-state lighting arrays.',
      compliance: {
        contractSigned: false,
        depositPaid: false,
        insuranceVerified: true,
        accessibilityConfirmed: false,
      },
    },
  ];
}

function buildIdeas(input: BlueprintGeneratorInput): PersonalizedIdea[] {
  return [
    {
      id: `idea-${input.vertical}-1`,
      category: 'Guest Experience',
      title: 'Interactive QR Keepsake & Schedule Companion',
      description:
        'Guests scan a linen-printed card to view real-time dietary tags and leaving voice notes.',
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
        'Replace cut foam florals with potted herbs and native perennials that guests take home.',
      estimatedCost: Math.min(1200, Math.round(input.totalBudget * 0.04)),
      impactLevel: 'Cost Optimizer',
      isSaved: true,
      rationale: 'Reduces floral waste by 75% while doubling as guest favors.',
    },
  ];
}

/**
 * Generates a complete, context-aware EventPlan deterministically.
 */
export function generateDeterministicBlueprint(input: BlueprintGeneratorInput): EventPlan {
  const weights: Record<BudgetCategory, number> = { ...VERTICAL_WEIGHTS[input.vertical] };

  if (input.setting === 'outdoor') {
    weights['Contingency Reserve'] += 0.02;
    weights['Production & AV'] += 0.02;
    weights['Venue & Permits'] = Math.max(0.1, weights['Venue & Permits'] - 0.02);
    weights['Entertainment & Talent'] = Math.max(0.06, weights['Entertainment & Talent'] - 0.02);
  }

  const budgetItems = buildBudgetItems(input, weights);
  const timelineItems = buildTimelineItems(input);
  const vendors = buildVendors(input, budgetItems[0]?.actual ?? 5000);
  const ideas = buildIdeas(input);
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
        : '48-hour meteorological decision gate: Clear-span marquee tent on standby with weighted ballast.',
    budgetItems,
    timelineItems,
    vendors,
    ideas,
  };
}
