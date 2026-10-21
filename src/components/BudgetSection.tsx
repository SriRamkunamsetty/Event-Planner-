/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { Lock, Plus, Scale, Trash2, Unlock } from 'lucide-react';
import { ALL_BUDGET_CATEGORIES } from '../domain/plannerEngine';
import { sanitizeText } from '../domain/security';
import type {
  BudgetCategory,
  BudgetItem,
  BudgetSummary,
  EventPlan,
} from '../types/planner';

interface BudgetSectionProps {
  plan: EventPlan;
  budget: BudgetSummary;
  onUpdateTotalBudget: (newBudget: number) => void;
  onUpdateGuestCount: (newGuests: number) => void;
  onRebalanceBudget: () => void;
  onAddBudgetItem: (item: Omit<BudgetItem, 'id'>) => void;
  onUpdateBudgetItem: (id: string, patch: Partial<BudgetItem>) => void;
  onDeleteBudgetItem: (id: string) => void;
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
}: BudgetSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [newCategory, setNewCategory] = useState<BudgetCategory>('Catering & Beverage');
  const [newTitle, setNewTitle] = useState('');
  const [newAllocated, setNewAllocated] = useState('1500');
  const [newActual, setNewActual] = useState('1500');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState('');

  const filteredItems =
    selectedCategory === 'ALL'
      ? plan.budgetItems
      : plan.budgetItems.filter((item) => item.category === selectedCategory);

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(newTitle, 120);
    const allocatedNum = Math.round(Number(newAllocated));
    const actualNum = Math.round(Number(newActual));

    if (!cleanTitle || cleanTitle.length < 2) {
      setFormError('Please enter a descriptive line-item title (at least 2 characters).');
      return;
    }
    if (!Number.isFinite(allocatedNum) || allocatedNum < 0) {
      setFormError('Allocated amount must be a valid non-negative number.');
      return;
    }

    setFormError('');
    onAddBudgetItem({
      category: newCategory,
      title: cleanTitle,
      allocated: allocatedNum,
      actual: Number.isFinite(actualNum) && actualNum >= 0 ? actualNum : allocatedNum,
      paid: 0,
      isLocked: false,
      notes: sanitizeText(newNotes, 200) || 'Added via Budget Ledger.',
    });

    setNewTitle('');
    setNewAllocated('1200');
    setNewActual('1200');
    setNewNotes('');
  };

  return (
    <section aria-labelledby="budget-heading" className="space-y-8">
      {/* Header & What-If Simulator Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Financial Ledger &amp; Proportional Reallocation Engine
          </p>
          <h1
            id="budget-heading"
            className="font-display text-2xl font-semibold text-slate-900 mt-1"
          >
            Budget &amp; What-If Ledger
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Lock contracted deposits and proportionally scale flexible categories to hit your target
            budget ceiling.
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

      {/* Category Distribution Summary Strip (Single-Elevation Depth) */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
          <span className="font-semibold text-slate-900">
            Category Allocation vs. Actual Spend
          </span>
          <span className="font-mono tabular-nums text-slate-600">
            Allocated: ${budget.totalAllocated.toLocaleString()} · Actual: $
            {budget.totalActual.toLocaleString()} ($
            {budget.actualPerGuest.toFixed(2)}/guest)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          {budget.categoryBreakdowns.map((cat) => {
            const isOver = cat.actual > cat.allocated && cat.allocated > 0;
            return (
              <div
                key={cat.category}
                className="pb-3 border-b border-slate-100 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800 truncate">{cat.category}</span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {cat.sharePercentage}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between font-mono tabular-nums">
                  <span className="text-sm font-semibold text-slate-900">
                    ${cat.actual.toLocaleString()}
                  </span>
                  <span className={isOver ? 'text-red-700 font-medium' : 'text-slate-500'}>
                    {isOver
                      ? `+$${Math.abs(cat.variance).toLocaleString()} over`
                      : `of $${cat.allocated.toLocaleString()}`}
                  </span>
                </div>
              </div>
            );
          })}
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

      {/* High-Density Financial Data Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th scope="col" className="py-3 px-4">
                  Line Item &amp; Category
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Allocated ($)
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Actual ($)
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Paid ($)
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Variance
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Lock
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No budget items in this category. Add a new line item below.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const variance = item.allocated - item.actual;
                  const isOver = variance < 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.title}</div>
                        <div className="text-slate-500 mt-0.5">
                          {item.category} · {item.notes}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <input
                          type="number"
                          min={0}
                          step={50}
                          aria-label={`Allocated amount for ${item.title}`}
                          value={item.allocated}
                          onChange={(e) =>
                            onUpdateBudgetItem(item.id, {
                              allocated: Math.max(0, Math.round(Number(e.target.value) || 0)),
                            })
                          }
                          className="w-24 text-right px-2 py-1 border border-slate-200 rounded bg-white text-slate-900 font-mono tabular-nums focus:outline-2 focus:outline-teal-800"
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <input
                          type="number"
                          min={0}
                          step={50}
                          aria-label={`Actual spend for ${item.title}`}
                          value={item.actual}
                          onChange={(e) =>
                            onUpdateBudgetItem(item.id, {
                              actual: Math.max(0, Math.round(Number(e.target.value) || 0)),
                            })
                          }
                          className="w-24 text-right px-2 py-1 border border-slate-200 rounded bg-white text-slate-900 font-mono tabular-nums focus:outline-2 focus:outline-teal-800"
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        ${item.paid.toLocaleString()}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono tabular-nums font-medium ${
                          isOver ? 'text-red-700' : 'text-emerald-800'
                        }`}
                      >
                        {isOver
                          ? `-$${Math.abs(variance).toLocaleString()} (Over)`
                          : `+$${variance.toLocaleString()} (Under)`}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateBudgetItem(item.id, { isLocked: !item.isLocked })
                          }
                          aria-label={
                            item.isLocked ? `Unlock ${item.title}` : `Lock ${item.title}`
                          }
                          className="p-1.5 rounded hover:bg-slate-200/70 text-slate-600 cursor-pointer"
                        >
                          {item.isLocked ? (
                            <Lock className="w-3.5 h-3.5 text-slate-900" aria-hidden="true" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteBudgetItem(item.id)}
                          aria-label={`Delete budget item ${item.title}`}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Budget Line Item Form */}
      <form
        onSubmit={handleAddSubmit}
        className="p-5 bg-white border border-slate-200 rounded-xl space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Add Budget Line Item</h2>
        {formError && (
          <p role="alert" className="text-xs font-medium text-red-700">
            {formError}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label htmlFor="new-budget-category" className="block text-xs font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              id="new-budget-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as BudgetCategory)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-2 focus:outline-teal-800"
            >
              {ALL_BUDGET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="new-budget-title" className="block text-xs font-medium text-slate-700 mb-1">
              Line Item Description
            </label>
            <input
              id="new-budget-title"
              type="text"
              placeholder="e.g. Late-Night Espresso & Pastry Cart"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-2 focus:outline-teal-800"
            />
          </div>

          <div>
            <label htmlFor="new-budget-allocated" className="block text-xs font-medium text-slate-700 mb-1">
              Allocated ($)
            </label>
            <input
              id="new-budget-allocated"
              type="number"
              min={0}
              value={newAllocated}
              onChange={(e) => {
                setNewAllocated(e.target.value);
                setNewActual(e.target.value);
              }}
              className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-2 focus:outline-teal-800"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Line Item
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
