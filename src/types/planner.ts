/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EventVertical = 'wedding' | 'birthday' | 'community';

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

export type VendorStatus = 'contracted' | 'shortlisted' | 'negotiating' | 'evaluating';

export interface BudgetItem {
  id: string;
  category: BudgetCategory;
  title: string;
  allocated: number;
  actual: number;
  paid: number;
  isLocked: boolean;
  notes: string;
}

export interface TimelineItem {
  id: string;
  phase: TaskPhase;
  timeOffsetOrSlot: string;
  title: string;
  owner: string;
  status: TaskStatus;
  isCriticalPath: boolean;
  dependencyNote?: string;
}

export interface VendorComplianceChecklist {
  contractSigned: boolean;
  depositPaid: boolean;
  insuranceVerified: boolean;
  accessibilityConfirmed: boolean;
}

export interface VendorItem {
  id: string;
  name: string;
  category: BudgetCategory;
  status: VendorStatus;
  quotedAmount: number;
  rating: number;
  contactPerson: string;
  contactEmail: string;
  leadTimeWeeks: number;
  sustainabilityNote: string;
  compliance: VendorComplianceChecklist;
}

export interface PersonalizedIdea {
  id: string;
  category: 'Guest Experience' | 'Culinary & Menu' | 'Atmosphere & Decor' | 'Sustainability & Inclusion';
  title: string;
  description: string;
  estimatedCost: number;
  impactLevel: 'High Impact' | 'Signature Detail' | 'Cost Optimizer';
  isSaved: boolean;
  rationale: string;
}

export interface EventPlan {
  id: string;
  title: string;
  subtitle: string;
  vertical: EventVertical;
  eventDate: string;
  location: string;
  setting: VenueSetting;
  guestCount: number;
  totalBudget: number;
  dietaryAndAccessibilityNotes: string[];
  weatherContingencyPlan: string;
  budgetItems: BudgetItem[];
  timelineItems: TimelineItem[];
  vendors: VendorItem[];
  ideas: PersonalizedIdea[];
}

export interface CategoryBreakdown {
  category: BudgetCategory;
  allocated: number;
  actual: number;
  paid: number;
  variance: number;
  sharePercentage: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalAllocated: number;
  totalActual: number;
  totalPaid: number;
  unallocatedBalance: number;
  remainingSpendable: number;
  varianceAmount: number;
  utilizationRatio: number;
  plannedPerGuest: number;
  actualPerGuest: number;
  overrunCategories: BudgetCategory[];
  healthStatus: 'Nominal' | 'Watch' | 'Overrun';
  categoryBreakdowns: CategoryBreakdown[];
}

export interface ReadinessMetrics {
  completedTasks: number;
  totalTasks: number;
  taskCompletionRate: number;
  criticalPathRemaining: number;
  atRiskTasks: number;
  contractedVendors: number;
  totalVendors: number;
  fullyCompliantVendors: number;
  overallReadinessScore: number;
  readinessStatus: 'Production Ready' | 'On Track' | 'Action Required';
}

export interface BlueprintGeneratorInput {
  title: string;
  vertical: EventVertical;
  totalBudget: number;
  guestCount: number;
  eventDate: string;
  location: string;
  setting: VenueSetting;
  priorities: string;
}

export interface AIRecommendedBudgetAdjustment {
  category: BudgetCategory;
  title: string;
  suggestedAmount: number;
  reason: string;
}

export interface AIRecommendedMilestone {
  phase: TaskPhase;
  timeOffsetOrSlot: string;
  title: string;
  owner: string;
  isCriticalPath: boolean;
}

export interface AIAdviceResponse {
  executiveSummary: string;
  contextualAnalysis: string;
  riskMitigation: string;
  budgetAdjustments: AIRecommendedBudgetAdjustment[];
  newMilestones: AIRecommendedMilestone[];
  personalizedIdeas: Array<{
    category: PersonalizedIdea['category'];
    title: string;
    description: string;
    estimatedCost: number;
    impactLevel: PersonalizedIdea['impactLevel'];
    rationale: string;
  }>;
  engineSource: 'gemini-3.8-flash' | 'deterministic-fallback';
}
