/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SEED_PLANS } from './data/seedPlans';
import {
  calculateBudgetSummary,
  calculateReadinessMetrics,
  rebalanceBudget,
} from './domain/plannerEngine';
import { Header, type ActiveTab } from './components/Header';
import { OverviewSection } from './components/OverviewSection';
import { BudgetSection } from './components/BudgetSection';
import { TimelineSection } from './components/TimelineSection';
import { VendorSection } from './components/VendorSection';
import { AICoPlannerSection } from './components/AICoPlannerSection';
import { NewBlueprintModal } from './components/NewBlueprintModal';
import { ExportModal } from './components/ExportModal';
import type {
  AIRecommendedBudgetAdjustment,
  AIRecommendedMilestone,
  BudgetItem,
  EventPlan,
  EventVertical,
  PersonalizedIdea,
  TaskStatus,
  TimelineItem,
  VendorComplianceChecklist,
  VendorItem,
} from './types/planner';

const STORAGE_KEY = 'atelier_chronos_plans_v1';

export default function App() {
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
      // Fallback to deterministic seed plans
    }
    return SEED_PLANS;
  });

  const [activeVertical, setActiveVertical] = useState<EventVertical>('wedding');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plansByVertical));
    } catch (_e) {
      // Ignore storage quota errors in private browsing
    }
  }, [plansByVertical]);

  const showNotification = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  const currentPlan = plansByVertical[activeVertical];

  const budgetSummary = useMemo(
    () => calculateBudgetSummary(currentPlan),
    [currentPlan]
  );

  const readinessMetrics = useMemo(
    () => calculateReadinessMetrics(currentPlan),
    [currentPlan]
  );

  const updateCurrentPlan = useCallback(
    (updater: (prev: EventPlan) => EventPlan) => {
      setPlansByVertical((prev) => ({
        ...prev,
        [activeVertical]: updater(prev[activeVertical]),
      }));
    },
    [activeVertical]
  );

  const handleUpdateTotalBudget = useCallback(
    (newBudget: number) => {
      updateCurrentPlan((plan) => ({
        ...plan,
        totalBudget: Math.round(newBudget),
      }));
    },
    [updateCurrentPlan]
  );

  const handleUpdateGuestCount = useCallback(
    (newGuests: number) => {
      updateCurrentPlan((plan) => ({
        ...plan,
        guestCount: Math.max(2, Math.round(newGuests)),
      }));
    },
    [updateCurrentPlan]
  );

  const handleRebalanceBudget = useCallback(() => {
    updateCurrentPlan((plan) => ({
      ...plan,
      budgetItems: rebalanceBudget(plan.budgetItems, plan.totalBudget),
    }));
    showNotification('Unlocked budget line items proportionally rebalanced to ceiling.');
  }, [updateCurrentPlan, showNotification]);

  const handleAddBudgetItem = useCallback(
    (item: Omit<BudgetItem, 'id'>) => {
      updateCurrentPlan((plan) => ({
        ...plan,
        budgetItems: [
          ...plan.budgetItems,
          { ...item, id: `b-custom-${Date.now()}` },
        ],
      }));
      showNotification(`Added "${item.title}" to Budget Ledger.`);
    },
    [updateCurrentPlan, showNotification]
  );

  const handleUpdateBudgetItem = useCallback(
    (id: string, patch: Partial<BudgetItem>) => {
      updateCurrentPlan((plan) => ({
        ...plan,
        budgetItems: plan.budgetItems.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      }));
    },
    [updateCurrentPlan]
  );

  const handleDeleteBudgetItem = useCallback(
    (id: string) => {
      updateCurrentPlan((plan) => ({
        ...plan,
        budgetItems: plan.budgetItems.filter((item) => item.id !== id),
      }));
      showNotification('Removed line item from Budget Ledger.');
    },
    [updateCurrentPlan, showNotification]
  );

  const handleToggleTaskStatus = useCallback(
    (id: string) => {
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

  const handleAddMilestone = useCallback(
    (milestone: Omit<TimelineItem, 'id'>) => {
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

  const handleDeleteMilestone = useCallback(
    (id: string) => {
      updateCurrentPlan((plan) => ({
        ...plan,
        timelineItems: plan.timelineItems.filter((t) => t.id !== id),
      }));
    },
    [updateCurrentPlan]
  );

  const handleToggleVendorCompliance = useCallback(
    (vendorId: string, field: keyof VendorComplianceChecklist) => {
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

  const handleAddVendor = useCallback(
    (vendor: Omit<VendorItem, 'id'>) => {
      updateCurrentPlan((plan) => ({
        ...plan,
        vendors: [...plan.vendors, { ...vendor, id: `v-custom-${Date.now()}` }],
      }));
      showNotification(`Added "${vendor.name}" to Vendor Matrix.`);
    },
    [updateCurrentPlan, showNotification]
  );

  const handleDeleteVendor = useCallback(
    (vendorId: string) => {
      updateCurrentPlan((plan) => ({
        ...plan,
        vendors: plan.vendors.filter((v) => v.id !== vendorId),
      }));
    },
    [updateCurrentPlan]
  );

  const handleApplyAIBudgetAdjustment = useCallback(
    (adj: AIRecommendedBudgetAdjustment) => {
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

  const handleApplyAIMilestone = useCallback(
    (ms: AIRecommendedMilestone) => {
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

  const handleSaveAIIdea = useCallback(
    (idea: Omit<PersonalizedIdea, 'id' | 'isSaved'>) => {
      updateCurrentPlan((plan) => ({
        ...plan,
        ideas: [
          {
            ...idea,
            id: `i-ai-${Date.now()}`,
            isSaved: true,
          },
          ...plan.ideas,
        ],
      }));
      showNotification(`Saved "${idea.title}" to Concept Board.`);
    },
    [updateCurrentPlan, showNotification]
  );

  const handleToggleIdeaSaved = useCallback(
    (ideaId: string) => {
      updateCurrentPlan((plan) => ({
        ...plan,
        ideas: plan.ideas.map((idea) =>
          idea.id === ideaId ? { ...idea, isSaved: !idea.isSaved } : idea
        ),
      }));
    },
    [updateCurrentPlan]
  );

  const handleCreatedBlueprint = useCallback(
    (newPlan: EventPlan) => {
      setPlansByVertical((prev) => ({
        ...prev,
        [newPlan.vertical]: newPlan,
      }));
      setActiveVertical(newPlan.vertical);
      setActiveTab('overview');
      showNotification(`Generated "${newPlan.title}" blueprint.`);
    },
    [showNotification]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewBlueprint={() => setIsBlueprintModalOpen(true)}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg shadow-lg border border-slate-700"
        >
          {toastMessage}
        </div>
      )}

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <OverviewSection
            plan={currentPlan}
            budget={budgetSummary}
            readiness={readinessMetrics}
            onSelectVertical={(v) => setActiveVertical(v)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenExport={() => setIsExportModalOpen(true)}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetSection
            plan={currentPlan}
            budget={budgetSummary}
            onUpdateTotalBudget={handleUpdateTotalBudget}
            onUpdateGuestCount={handleUpdateGuestCount}
            onRebalanceBudget={handleRebalanceBudget}
            onAddBudgetItem={handleAddBudgetItem}
            onUpdateBudgetItem={handleUpdateBudgetItem}
            onDeleteBudgetItem={handleDeleteBudgetItem}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineSection
            plan={currentPlan}
            readiness={readinessMetrics}
            onToggleTaskStatus={handleToggleTaskStatus}
            onAddMilestone={handleAddMilestone}
            onDeleteMilestone={handleDeleteMilestone}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorSection
            plan={currentPlan}
            readiness={readinessMetrics}
            onToggleCompliance={handleToggleVendorCompliance}
            onAddVendor={handleAddVendor}
            onDeleteVendor={handleDeleteVendor}
          />
        )}

        {activeTab === 'ai' && (
          <AICoPlannerSection
            plan={currentPlan}
            onApplyBudgetAdjustment={handleApplyAIBudgetAdjustment}
            onApplyMilestone={handleApplyAIMilestone}
            onSaveIdea={handleSaveAIIdea}
            onToggleIdeaSaved={handleToggleIdeaSaved}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-[1360px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            Atelier Chronos · Celebration &amp; Event Planning Architecture (Weddings · Birthdays ·
            Community Events)
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setPlansByVertical(SEED_PLANS);
                showNotification('Reset all vertical blueprints to default benchmarks.');
              }}
              className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              Reset Demo Blueprints
            </button>
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              Export Master Packet
            </button>
          </div>
        </div>
      </footer>

      <NewBlueprintModal
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
        onCreatedPlan={handleCreatedBlueprint}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        plan={currentPlan}
        budget={budgetSummary}
        readiness={readinessMetrics}
      />
    </div>
  );
}
