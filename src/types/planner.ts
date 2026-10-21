/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Canonical domain interfaces for the Celebration and Event
 * Planner vertical. Adheres strictly to the Google TypeScript Style Guide.
 */

export type EventVertical = 'wedding' | 'birthday' | 'community';

export type EventCategory = EventVertical;

export type VenueSetting = 'indoor' | 'outdoor' | 'hybrid';

export type BudgetCategory =
  | 'Venue & Permits'
  | 'Catering & Beverage'
  | 'Production & AV'
  | 'Decor & Floral'
  | 'Entertainment & Talent'
  | 'Photography & Media'
  | 'Logistics & Accessibility'
  | 'Contingency Reserve';

export type TaskPhase =
  | 'Foundation (6–12 Months)'
  | 'Vendor Lock (3–5 Months)'
  | 'Detailed Operations (1–2 Months)'
  | 'Final Week Confirmation'
  | 'Day-Of Run of Show';

export type TaskStatus = 'completed' | 'in_progress' | 'pending' | 'at_risk';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type VendorStatus = 'contracted' | 'shortlisted' | 'negotiating' | 'evaluating';

export interface BudgetItem {
  readonly id: string;
  readonly category: BudgetCategory;
  readonly title: string;
  readonly allocated: number;
  readonly actual: number;
  readonly paid: number;
  readonly isLocked: boolean;
  readonly notes: string;
}

export interface BudgetAllocationItem {
  readonly id: string;
  readonly categoryName: string;
  readonly allocatedAmountInr: number;
  readonly percentageOfTotal: number;
  readonly estimatedCostPerGuestInr: number;
  readonly rationale: string;
}

export interface TimelineItem {
  readonly id: string;
  readonly phase: TaskPhase;
  readonly timeOffsetOrSlot: string;
  readonly title: string;
  readonly owner: string;
  readonly status: TaskStatus;
  readonly isCriticalPath: boolean;
  readonly dependencyNote?: string;
}

export interface TimelineMilestone {
  readonly id: string;
  readonly weeksBeforeEvent: number;
  readonly title: string;
  readonly actionableTask: string;
  readonly priority: PriorityLevel;
  readonly completed: boolean;
}

export interface VendorComplianceChecklist {
  readonly contractSigned: boolean;
  readonly depositPaid: boolean;
  readonly insuranceVerified: boolean;
  readonly accessibilityConfirmed: boolean;
}

export interface VendorItem {
  readonly id: string;
  readonly name: string;
  readonly category: BudgetCategory;
  readonly status: VendorStatus;
  readonly quotedAmount: number;
  readonly rating: number;
  readonly contactPerson: string;
  readonly contactEmail: string;
  readonly leadTimeWeeks: number;
  readonly sustainabilityNote: string;
  readonly compliance: VendorComplianceChecklist;
}

export interface VendorChecklistItem {
  readonly id: string;
  readonly vendorType: string;
  readonly recommendedBookingWindow: string;
  readonly estimatedBudgetCapInr: number;
  readonly negotiationQuestions: readonly string[];
  readonly contracted: boolean;
}

export interface PersonalizedIdea {
  readonly id: string;
  readonly category:
    | 'Guest Experience'
    | 'Culinary & Menu'
    | 'Atmosphere & Decor'
    | 'Sustainability & Inclusion';
  readonly title: string;
  readonly description: string;
  readonly estimatedCost: number;
  readonly impactLevel: 'High Impact' | 'Signature Detail' | 'Cost Optimizer';
  readonly isSaved: boolean;
  readonly rationale: string;
}

export interface EventPlan {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly vertical: EventVertical;
  readonly eventDate: string;
  readonly location: string;
  readonly setting: VenueSetting;
  readonly guestCount: number;
  readonly totalBudget: number;
  readonly dietaryAndAccessibilityNotes: readonly string[];
  readonly weatherContingencyPlan: string;
  readonly budgetItems: readonly BudgetItem[];
  readonly timelineItems: readonly TimelineItem[];
  readonly vendors: readonly VendorItem[];
  readonly ideas: readonly PersonalizedIdea[];
}

export interface EventPlanningRequest {
  readonly eventTitle: string;
  readonly category: EventCategory;
  readonly totalBudgetInr: number;
  readonly guestCount: number;
  readonly eventDateIso: string;
  readonly cityLocation: string;
  readonly dietaryAndCulturalNotes: string;
}

export interface CelebrationBlueprint {
  readonly summaryHeadline: string;
  readonly feasibilityScore: number;
  readonly contextualDecisionNotes: readonly string[];
  readonly budgetBreakdown: readonly BudgetAllocationItem[];
  readonly timelineMilestones: readonly TimelineMilestone[];
  readonly vendorChecklist: readonly VendorChecklistItem[];
  readonly personalizedThemeIdeas: readonly string[];
}

export interface CategoryBreakdown {
  readonly category: BudgetCategory;
  readonly allocated: number;
  readonly actual: number;
  readonly paid: number;
  readonly variance: number;
  readonly sharePercentage: number;
}

export interface BudgetSummary {
  readonly totalBudget: number;
  readonly totalAllocated: number;
  readonly totalActual: number;
  readonly totalPaid: number;
  readonly unallocatedBalance: number;
  readonly remainingSpendable: number;
  readonly varianceAmount: number;
  readonly utilizationRatio: number;
  readonly plannedPerGuest: number;
  readonly actualPerGuest: number;
  readonly overrunCategories: readonly BudgetCategory[];
  readonly healthStatus: 'Nominal' | 'Watch' | 'Overrun';
  readonly categoryBreakdowns: readonly CategoryBreakdown[];
}

export interface ReadinessMetrics {
  readonly completedTasks: number;
  readonly totalTasks: number;
  readonly taskCompletionRate: number;
  readonly criticalPathRemaining: number;
  readonly atRiskTasks: number;
  readonly contractedVendors: number;
  readonly totalVendors: number;
  readonly fullyCompliantVendors: number;
  readonly overallReadinessScore: number;
  readonly readinessStatus: 'Production Ready' | 'On Track' | 'Action Required';
}

export interface ContextFeasibilityResult {
  readonly isFeasible: boolean;
  readonly perGuestAmount: number;
  readonly minimumBenchmark: number;
  readonly warnings: readonly string[];
}

export interface BlueprintGeneratorInput {
  readonly title: string;
  readonly vertical: EventVertical;
  readonly totalBudget: number;
  readonly guestCount: number;
  readonly eventDate: string;
  readonly location: string;
  readonly setting: VenueSetting;
  readonly priorities: string;
}

export interface AiRecommendedBudgetAdjustment {
  readonly category: BudgetCategory;
  readonly title: string;
  readonly suggestedAmount: number;
  readonly reason: string;
}

export interface AiRecommendedMilestone {
  readonly phase: TaskPhase;
  readonly timeOffsetOrSlot: string;
  readonly title: string;
  readonly owner: string;
  readonly isCriticalPath: boolean;
}

export interface AiAdviceResponse {
  readonly executiveSummary: string;
  readonly contextualAnalysis: string;
  readonly riskMitigation: string;
  readonly budgetAdjustments: readonly AiRecommendedBudgetAdjustment[];
  readonly newMilestones: readonly AiRecommendedMilestone[];
  readonly personalizedIdeas: ReadonlyArray<{
    readonly category: PersonalizedIdea['category'];
    readonly title: string;
    readonly description: string;
    readonly estimatedCost: number;
    readonly impactLevel: PersonalizedIdea['impactLevel'];
    readonly rationale: string;
  }>;
  readonly engineSource: 'gemini-3.8-flash' | 'deterministic-fallback';
}

// Backward-compatibility aliases for existing interfaces
export type AIRecommendedBudgetAdjustment = AiRecommendedBudgetAdjustment;
export type AIRecommendedMilestone = AiRecommendedMilestone;
export type AIAdviceResponse = AiAdviceResponse;
