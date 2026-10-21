/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Main application shell for Atelier Chronos — GenAI Celebration & Event Planner.
 * Adheres strictly to Google TypeScript Style (GTS) and AST modularity limits (< 120 lines).
 */

import { useState, type JSX } from 'react';
import { Header, type ActiveTab } from './components/Header';
import { OverviewSection } from './components/OverviewSection';
import { BudgetSection } from './components/BudgetSection';
import { TimelineSection } from './components/TimelineSection';
import { VendorSection } from './components/VendorSection';
import { AICoPlannerSection } from './components/AICoPlannerSection';
import { NewBlueprintModal } from './components/NewBlueprintModal';
import { ExportModal } from './components/ExportModal';
import { useEventPlan } from './hooks/use-event-plan';

export function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const planState = useEventPlan();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Keyboard-accessible WCAG Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-900 focus:text-white focus:rounded-md focus:shadow-md focus:outline-2 focus:outline-offset-2 focus:outline-teal-800"
      >
        Skip to Event Planner Workspace
      </a>

      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewBlueprint={() => setIsBlueprintModalOpen(true)}
      />

      {planState.toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg shadow-lg border border-slate-700"
        >
          {planState.toastMessage}
        </div>
      )}

      <main id="main-content" className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <OverviewSection
            plan={planState.currentPlan}
            budget={planState.budgetSummary}
            readiness={planState.readinessMetrics}
            onSelectVertical={planState.setActiveVertical}
            onNavigateTab={setActiveTab}
            onOpenExport={() => setIsExportModalOpen(true)}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetSection
            plan={planState.currentPlan}
            budget={planState.budgetSummary}
            onUpdateTotalBudget={planState.updateTotalBudget}
            onUpdateGuestCount={planState.updateGuestCount}
            onRebalanceBudget={planState.handleRebalanceBudget}
            onAddBudgetItem={planState.addBudgetItem}
            onUpdateBudgetItem={planState.updateBudgetItem}
            onDeleteBudgetItem={planState.deleteBudgetItem}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineSection
            plan={planState.currentPlan}
            readiness={planState.readinessMetrics}
            onToggleTaskStatus={planState.toggleTaskStatus}
            onAddMilestone={planState.addMilestone}
            onDeleteMilestone={planState.deleteMilestone}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorSection
            plan={planState.currentPlan}
            readiness={planState.readinessMetrics}
            onToggleCompliance={planState.toggleVendorCompliance}
            onAddVendor={planState.addVendor}
            onDeleteVendor={planState.deleteVendor}
          />
        )}

        {activeTab === 'ai' && (
          <AICoPlannerSection
            plan={planState.currentPlan}
            onApplyBudgetAdjustment={planState.applyAiBudgetAdjustment}
            onApplyMilestone={planState.applyAiMilestone}
            onSaveIdea={planState.saveAiIdea}
            onToggleIdeaSaved={planState.toggleIdeaSaved}
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
              onClick={planState.resetDemoBlueprints}
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
        onCreatedPlan={(newPlan) => {
          planState.setCreatedBlueprint(newPlan);
          setActiveTab('overview');
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        plan={planState.currentPlan}
        budget={planState.budgetSummary}
        readiness={planState.readinessMetrics}
      />
    </div>
  );
}

export default App;
