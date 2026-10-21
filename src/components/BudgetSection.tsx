/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget & What-If Ledger coordinator section with proportional
 * auto-rebalancing, category filtering, editable data grid, and add-item form.
 */

import { Scale } from 'lucide-react';
import { useState, type JSX } from 'react';
import { ALL_BUDGET_CATEGORIES } from '../constants/event-benchmarks.constants';
import type { BudgetItem, BudgetSummary, EventPlan } from '../types/planner';
import { BudgetAddForm } from './budget/BudgetAddForm';
import { BudgetTable } from './budget/BudgetTable';

export interface BudgetSectionProps {
  readonly plan: EventPlan;
  readonly budget: BudgetSummary;
  readonly onUpdateTotalBudget: (newBudget: number) => void;
  readonly onUpdateGuestCount: (newGuests: number) => void;
  readonly onRebalanceBudget: () => void;
  readonly onAddBudgetItem: (item: Omit<BudgetItem, 'id'>) => void;
  readonly onUpdateBudgetItem: (id: string, patch: Partial<BudgetItem>) => void;
  readonly onDeleteBudgetItem: (id: string) => void;
}

export function BudgetSection({
  plan,
  budget,
  onUpdateTotalBudget,
  onUpdateGuestCount,
  onRebalanceBudget,
  onAddBudgetItem,
  onUpdateBudgetItem,
  onDeleteBudgetItem,
}: BudgetSectionProps): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredItems =
    selectedCategory === 'ALL'
      ? plan.budgetItems
      : plan.budgetItems.filter((item) => item.category === selectedCategory);

  return (
    <section aria-labelledby="budget-heading" className="space-y-8">
      {/* Header & What-If Simulator Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Financial Ledger &amp; Proportional Reallocation Engine
          </p>
          <h1 id="budget-heading" className="font-display text-2xl font-semibold text-slate-900 mt-1">
            Budget &amp; What-If Ledger
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Lock contracted deposits and proportionally scale flexible categories to hit your target budget ceiling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5">
            <label htmlFor="target-budget-input" className="text-xs font-medium text-slate-600">
              Ceiling ($):
            </label>
            <input
              id="target-budget-input"
              type="number"
              min={200}
              max={10000000}
              step={250}
              value={plan.totalBudget}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (Number.isFinite(val) && val >= 200) {
                  onUpdateTotalBudget(val);
                }
              }}
              className="w-28 text-xs font-mono tabular-nums font-semibold text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5">
            <label htmlFor="guest-count-input" className="text-xs font-medium text-slate-600">
              Guests:
            </label>
            <input
              id="guest-count-input"
              type="number"
              min={2}
              max={50000}
              value={plan.guestCount}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (Number.isFinite(val) && val >= 2) {
                  onUpdateGuestCount(val);
                }
              }}
              className="w-20 text-xs font-mono tabular-nums font-semibold text-slate-900 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={onRebalanceBudget}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-900 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-900"
          >
            <Scale className="w-3.5 h-3.5" aria-hidden="true" />
            Auto-Balance Unlocked Items
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter Budget Line Items by Category"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
        >
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({plan.budgetItems.length})
          </button>
          {ALL_BUDGET_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === category
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {category.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <BudgetTable
        items={filteredItems}
        onUpdateItem={onUpdateBudgetItem}
        onDeleteItem={onDeleteBudgetItem}
      />

      <BudgetAddForm onAddItem={onAddBudgetItem} />
    </section>
  );
}
