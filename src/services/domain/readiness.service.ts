/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Domain service for evaluating operational readiness across timeline
 * milestones, critical-path dependencies, and 4-point vendor compliance checklists.
 */

import type { EventPlan, ReadinessMetrics } from '../../types/planner';

/**
 * Evaluates operational readiness metrics across timeline tasks and vendor compliance.
 */
export function calculateReadinessMetrics(plan: EventPlan): ReadinessMetrics {
  const totalTasks = plan.timelineItems.length;
  let completedTasks = 0;
  let criticalPathRemaining = 0;
  let atRiskTasks = 0;

  for (const task of plan.timelineItems) {
    if (task.status === 'completed') {
      completedTasks++;
      continue;
    }
    if (task.isCriticalPath) {
      criticalPathRemaining++;
    }
    if (task.status === 'at_risk') {
      atRiskTasks++;
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
