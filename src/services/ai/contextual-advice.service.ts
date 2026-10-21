/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Domain AI service for synthesizing contextual advice deterministically
 * based on user query, event vertical, and budget ledger state.
 */

import type { AiAdviceResponse, EventPlan } from '../../types/planner';
import { calculateBudgetSummary } from '../domain/budget-optimizer.service';
import { sanitizeText } from '../../domain/security';

/**
 * Generates structured, context-aware recommendations based on user prompt and event state.
 */
export function generateContextualAiAdvice(
  prompt: string,
  plan: EventPlan
): AiAdviceResponse {
  const summary = calculateBudgetSummary(plan);
  const lower = prompt.toLowerCase();
  const isWeather = /rain|weather|outdoor|tent|wind|heat|cold/.test(lower);
  const isBudget = /budget|cost|save|cheaper|reduce|overrun|expensive/.test(lower);
  const isMenu = /food|menu|vegan|diet|catering|drink|allergen/.test(lower);

  const executiveSummary = isWeather
    ? `Activated Weather Resilience Protocol for "${plan.title}" (${plan.guestCount} guests at ${plan.location}). Reallocated contingency reserves to lock a clear-span canopy and slip-resistant walkways.`
    : isBudget
      ? `Cost-Optimization Audit for "${plan.title}": Identified savings by consolidating AV/lighting packages and shifting peak-season floral stems to architectural greenery.`
      : `Contextual Plan Synthesis for "${plan.title}" (${plan.vertical.toUpperCase()} · ${plan.guestCount} attendees): Aligned budget allocations, run-of-show milestones, and guest experience touchpoints.`;

  const contextualAnalysis = `Current utilization stands at ${summary.utilizationRatio}% ($${summary.totalActual.toLocaleString()} actual vs. $${plan.totalBudget.toLocaleString()} budget, or $${summary.actualPerGuest}/guest). ${
    summary.overrunCategories.length > 0
      ? `Watch categories requiring containment: ${summary.overrunCategories.join(', ')}.`
      : 'All budget categories are operating within nominal tolerances.'
  }`;

  const riskMitigation = isWeather
    ? 'Enforce a T-48hr Go/No-Go weather call with the venue director and AV team; pre-stage acoustic wind-screens.'
    : 'Maintain a minimum 5% unencumbered contingency reserve until T-72 hours and verify Certificate of Insurance endorsements.';

  return {
    executiveSummary,
    contextualAnalysis,
    riskMitigation,
    budgetAdjustments: [
      {
        category: isMenu ? 'Catering & Beverage' : 'Decor & Floral',
        title: isMenu
          ? 'Interactive Chef Station & Zero-Proof Botanical Bar Optimization'
          : 'Modular Architectural Lighting & Repurposed Ceremony-to-Reception Florals',
        suggestedAmount: Math.round(plan.totalBudget * (isMenu ? 0.26 : 0.09)),
        reason: isMenu
          ? 'Reduces plated staffing overhead by 18% while increasing dietary flexibility.'
          : 'Dual-purposing ceremony installations for reception tables saves 28% on floral fabrication.',
      },
      {
        category: 'Contingency Reserve',
        title: isWeather
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
        title: `Execute contextual adjustment: "${sanitizeText(prompt, 60)}"`,
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
          'Curated small-plate flight featuring regional producers, with clear dietary icons.',
        estimatedCost: Math.max(250, Math.round(plan.totalBudget * 0.025)),
        impactLevel: 'High Impact',
        rationale: `Directly addresses "${sanitizeText(prompt, 50)}" while keeping per-guest spend predictable.`,
      },
      {
        category: 'Atmosphere & Decor',
        title: 'Acoustic Quiet Lounge & Sensory-Friendly Recharge Nook',
        description:
          'A dedicated low-decibel seating alcove with warm indirect lighting and step-free access.',
        estimatedCost: Math.max(180, Math.round(plan.totalBudget * 0.015)),
        impactLevel: 'Signature Detail',
        rationale: 'Elevates accessibility and multi-generational comfort with minimal footprint.',
      },
    ],
    engineSource: 'deterministic-fallback',
  };
}

// Backward-compatibility alias
export const generateContextualAIAdvice = generateContextualAiAdvice;
