/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Form component for adding custom budget line items with validation.
 */

import { Plus } from 'lucide-react';
import { useState, type FormEvent, type JSX } from 'react';
import { ALL_BUDGET_CATEGORIES } from '../../constants/event-benchmarks.constants';
import { sanitizeText } from '../../domain/security';
import type { BudgetCategory, BudgetItem } from '../../types/planner';

export interface BudgetAddFormProps {
  readonly onAddItem: (item: Omit<BudgetItem, 'id'>) => void;
}

export function BudgetAddForm({ onAddItem }: BudgetAddFormProps): JSX.Element {
  const [newCategory, setNewCategory] = useState<BudgetCategory>('Catering & Beverage');
  const [newTitle, setNewTitle] = useState('');
  const [newAllocated, setNewAllocated] = useState('1500');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const cleanTitle = sanitizeText(newTitle, 120);
    const allocatedNum = Math.round(Number(newAllocated));

    if (!cleanTitle || cleanTitle.length < 2) {
      setFormError('Please enter a descriptive line-item title (at least 2 characters).');
      return;
    }
    if (!Number.isFinite(allocatedNum) || allocatedNum < 0) {
      setFormError('Allocated amount must be a valid non-negative number.');
      return;
    }

    setFormError('');
    onAddItem({
      category: newCategory,
      title: cleanTitle,
      allocated: allocatedNum,
      actual: allocatedNum,
      paid: 0,
      isLocked: false,
      notes: sanitizeText(newNotes, 200) || 'Added via Budget Ledger.',
    });

    setNewTitle('');
    setNewAllocated('1200');
    setNewNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
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
            onChange={(e) => setNewAllocated(e.target.value)}
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
  );
}
