/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Main facade and re-export point for domain planner services.
 * Keeps file size < 80 lines and encapsulates modular domain operations.
 */

export { ALL_BUDGET_CATEGORIES } from '../constants/event-benchmarks.constants';
export {
  calculateBudgetSummary,
  evaluateContextFeasibility,
  normalizeBudgetAllocations,
  rebalanceBudget,
} from '../services/domain/budget-optimizer.service';
export { calculateReadinessMetrics } from '../services/domain/readiness.service';
export { generateDeterministicBlueprint } from '../services/domain/blueprint-generator.service';
export {
  exportBudgetToCSV,
  exportPlanToMarkdown,
} from '../services/domain/export.service';
export {
  generateContextualAIAdvice,
  generateContextualAiAdvice,
} from '../services/ai/contextual-advice.service';
