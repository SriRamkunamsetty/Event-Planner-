/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Custom React hook isolating state management, local storage persistence,
 * optimistic updates, and notifications away from presentational JSX.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SEED_PLANS } from '../data/seedPlans';
import {
  calculateBudgetSummary,
  calculateReadinessMetrics,
  rebalanceBudget,
} from '../domain/plannerEngine';
import type {
  AiRecommendedBudgetAdjustment,
  AiRecommendedMilestone,
  BudgetItem,
  BudgetSummary,
  EventPlan,
  EventVertical,
  PersonalizedIdea,
  ReadinessMetrics,
  TaskStatus,
  TimelineItem,
  VendorComplianceChecklist,
  VendorItem,
} from '../types/planner';

const STORAGE_KEY = 'atelier_chronos_plans_v1';

export interface UseEventPlanReturn {
  readonly currentPlan: EventPlan;
  readonly activeVertical: EventVertical;
  readonly budgetSummary: BudgetSummary;
  readonly readinessMetrics: ReadinessMetrics;
  readonly toastMessage: string | null;
  readonly setActiveVertical: (v: EventVertical) => void;
  readonly showNotification: (msg: string) => void;
  readonly updateTotalBudget: (newBudget: number) => void;
  readonly updateGuestCount: (newGuests: number) => void;
  readonly handleRebalanceBudget: () => void;
  readonly addBudgetItem: (item: Omit<BudgetItem, 'id'>) => void;
  readonly updateBudgetItem: (id: string, patch: Partial<BudgetItem>) => void;
  readonly deleteBudgetItem: (id: string) => void;
  readonly toggleTaskStatus: (id: string) => void;
  readonly addMilestone: (milestone: Omit<TimelineItem, 'id'>) => void;
  readonly deleteMilestone: (id: string) => void;
  readonly toggleVendorCompliance: (
    vendorId: string,
    field: keyof VendorComplianceChecklist
  ) => void;
  readonly addVendor: (vendor: Omit<VendorItem, 'id'>) => void;
  readonly deleteVendor: (vendorId: string) => void;
  readonly applyAiBudgetAdjustment: (adj: AiRecommendedBudgetAdjustment) => void;
  readonly applyAiMilestone: (ms: AiRecommendedMilestone) => void;
  readonly saveAiIdea: (idea: Omit<PersonalizedIdea, 'id' | 'isSaved'>) => void;
  readonly toggleIdeaSaved: (ideaId: string) => void;
  readonly setCreatedBlueprint: (newPlan: EventPlan) => void;
  readonly resetDemoBlueprints: () => void;
}

export function useEventPlan(): UseEventPlanReturn {
  const [plansByVertical, setPlansByVertical] = useState<
    Record<EventVertical, EventPlan>
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.wedding && parsed.birthday && parsed.community) {
          return parsed;
        }
      }
    } catch (_e) {
      // Ignore parse failure and fall back to seed plans
    }
    return SEED_PLANS;
  });

  const [activeVertical, setActiveVertical] = useState<EventVertical>('wedding');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plansByVertical));
    } catch (_e) {
      // Ignore quota error in sandboxes
    }
  }, [plansByVertical]);

  const showNotification = useCallback((msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  const currentPlan = plansByVertical[activeVertical];
  const budgetSummary = useMemo(() => calculateBudgetSummary(currentPlan), [currentPlan]);
  const readinessMetrics = useMemo(() => calculateReadinessMetrics(currentPlan), [currentPlan]);

  const updateCurrentPlan = useCallback(
    (updater: (prev: EventPlan) => EventPlan): void => {
      setPlansByVertical((prev) => ({
        ...prev,
        [activeVertical]: updater(prev[activeVertical]),
      }));
    },
    [activeVertical]
  );

  const updateTotalBudget = useCallback(
    (newBudget: number): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        totalBudget: Math.round(newBudget),
      }));
    },
    [updateCurrentPlan]
  );

  const updateGuestCount = useCallback(
    (newGuests: number): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        guestCount: Math.max(2, Math.round(newGuests)),
      }));
    },
    [updateCurrentPlan]
  );

  const handleRebalanceBudget = useCallback((): void => {
    updateCurrentPlan((plan) => ({
      ...plan,
      budgetItems: rebalanceBudget(plan.budgetItems, plan.totalBudget),
    }));
    showNotification('Unlocked budget line items proportionally rebalanced to ceiling.');
  }, [updateCurrentPlan, showNotification]);

  const addBudgetItem = useCallback(
    (item: Omit<BudgetItem, 'id'>): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        budgetItems: [...plan.budgetItems, { ...item, id: `b-custom-${Date.now()}` }],
      }));
      showNotification(`Added "${item.title}" to Budget Ledger.`);
    },
    [updateCurrentPlan, showNotification]
  );

  const updateBudgetItem = useCallback(
    (id: string, patch: Partial<BudgetItem>): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        budgetItems: plan.budgetItems.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      }));
    },
    [updateCurrentPlan]
  );

  const deleteBudgetItem = useCallback(
    (id: string): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        budgetItems: plan.budgetItems.filter((item) => item.id !== id),
      }));
      showNotification('Removed line item from Budget Ledger.');
    },
    [updateCurrentPlan, showNotification]
  );

  const toggleTaskStatus = useCallback(
    (id: string): void => {
      const cycle: Record<TaskStatus, TaskStatus> = {
        pending: 'in_progress',
        in_progress: 'completed',
        completed: 'pending',
        at_risk: 'completed',
      };
      updateCurrentPlan((plan) => ({
        ...plan,
        timelineItems: plan.timelineItems.map((t) =>
          t.id === id ? { ...t, status: cycle[t.status] } : t
        ),
      }));
    },
    [updateCurrentPlan]
  );

  const addMilestone = useCallback(
    (milestone: Omit<TimelineItem, 'id'>): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        timelineItems: [
          ...plan.timelineItems,
          { ...milestone, id: `t-custom-${Date.now()}` },
        ],
      }));
      showNotification(`Added "${milestone.title}" to Timeline.`);
    },
    [updateCurrentPlan, showNotification]
  );

  const deleteMilestone = useCallback(
    (id: string): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        timelineItems: plan.timelineItems.filter((t) => t.id !== id),
      }));
    },
    [updateCurrentPlan]
  );

  const toggleVendorCompliance = useCallback(
    (vendorId: string, field: keyof VendorComplianceChecklist): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        vendors: plan.vendors.map((v) =>
          v.id === vendorId
            ? {
                ...v,
                compliance: {
                  ...v.compliance,
                  [field]: !v.compliance[field],
                },
              }
            : v
        ),
      }));
    },
    [updateCurrentPlan]
  );

  const addVendor = useCallback(
    (vendor: Omit<VendorItem, 'id'>): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        vendors: [...plan.vendors, { ...vendor, id: `v-custom-${Date.now()}` }],
      }));
      showNotification(`Added "${vendor.name}" to Vendor Matrix.`);
    },
    [updateCurrentPlan, showNotification]
  );

  const deleteVendor = useCallback(
    (vendorId: string): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        vendors: plan.vendors.filter((v) => v.id !== vendorId),
      }));
    },
    [updateCurrentPlan]
  );

  const applyAiBudgetAdjustment = useCallback(
    (adj: AiRecommendedBudgetAdjustment): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        budgetItems: [
          ...plan.budgetItems,
          {
            id: `b-ai-${Date.now()}`,
            category: adj.category,
            title: adj.title,
            allocated: adj.suggestedAmount,
            actual: adj.suggestedAmount,
            paid: 0,
            isLocked: false,
            notes: adj.reason,
          },
        ],
      }));
      showNotification(`Applied AI budget line "${adj.title}" to Ledger.`);
    },
    [updateCurrentPlan, showNotification]
  );

  const applyAiMilestone = useCallback(
    (ms: AiRecommendedMilestone): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        timelineItems: [
          ...plan.timelineItems,
          {
            id: `t-ai-${Date.now()}`,
            phase: ms.phase,
            timeOffsetOrSlot: ms.timeOffsetOrSlot,
            title: ms.title,
            owner: ms.owner,
            status: 'pending',
            isCriticalPath: ms.isCriticalPath,
          },
        ],
      }));
      showNotification(`Added AI milestone "${ms.title}" to Timeline.`);
    },
    [updateCurrentPlan, showNotification]
  );

  const saveAiIdea = useCallback(
    (idea: Omit<PersonalizedIdea, 'id' | 'isSaved'>): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        ideas: [{ ...idea, id: `i-ai-${Date.now()}`, isSaved: true }, ...plan.ideas],
      }));
      showNotification(`Saved "${idea.title}" to Concept Board.`);
    },
    [updateCurrentPlan, showNotification]
  );

  const toggleIdeaSaved = useCallback(
    (ideaId: string): void => {
      updateCurrentPlan((plan) => ({
        ...plan,
        ideas: plan.ideas.map((idea) =>
          idea.id === ideaId ? { ...idea, isSaved: !idea.isSaved } : idea
        ),
      }));
    },
    [updateCurrentPlan]
  );

  const setCreatedBlueprint = useCallback(
    (newPlan: EventPlan): void => {
      setPlansByVertical((prev) => ({
        ...prev,
        [newPlan.vertical]: newPlan,
      }));
      setActiveVertical(newPlan.vertical);
      showNotification(`Generated "${newPlan.title}" blueprint.`);
    },
    [showNotification]
  );

  const resetDemoBlueprints = useCallback((): void => {
    setPlansByVertical(SEED_PLANS);
    showNotification('Reset all vertical blueprints to default benchmarks.');
  }, [showNotification]);

  return {
    currentPlan,
    activeVertical,
    budgetSummary,
    readinessMetrics,
    toastMessage,
    setActiveVertical,
    showNotification,
    updateTotalBudget,
    updateGuestCount,
    handleRebalanceBudget,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    toggleTaskStatus,
    addMilestone,
    deleteMilestone,
    toggleVendorCompliance,
    addVendor,
    deleteVendor,
    applyAiBudgetAdjustment,
    applyAiMilestone,
    saveAiIdea,
    toggleIdeaSaved,
    setCreatedBlueprint,
    resetDemoBlueprints,
  };
}
