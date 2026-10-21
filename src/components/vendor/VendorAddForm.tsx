/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Form component for adding vendors with sustainability notes and quotes.
 */

import { Plus } from 'lucide-react';
import { useState, type FormEvent, type JSX } from 'react';
import { ALL_BUDGET_CATEGORIES } from '../../constants/event-benchmarks.constants';
import { sanitizeText } from '../../domain/security';
import type { BudgetCategory, VendorItem } from '../../types/planner';

export interface VendorAddFormProps {
  readonly onAdd: (vendor: Omit<VendorItem, 'id'>) => void;
}

export function VendorAddForm({ onAdd }: VendorAddFormProps): JSX.Element {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('Catering & Beverage');
  const [quotedAmount, setQuotedAmount] = useState('3500');
  const [contactPerson, setContactPerson] = useState('');
  const [sustainabilityNote, setSustainabilityNote] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const cleanName = sanitizeText(name, 100);
    if (!cleanName || cleanName.length < 2) {
      setFormError('Please enter a vendor organization name.');
      return;
    }
    const quote = Math.max(0, Math.round(Number(quotedAmount) || 0));
    setFormError('');

    onAdd({
      name: cleanName,
      category,
      status: 'shortlisted',
      quotedAmount: quote,
      rating: 4.8,
      contactPerson: sanitizeText(contactPerson, 80) || 'Account Coordinator',
      contactEmail: 'ops@vendor-partner.example.com',
      leadTimeWeeks: 6,
      sustainabilityNote:
        sanitizeText(sustainabilityNote, 160) ||
        'Verified local sourcing and ADA load-in compliance.',
      compliance: {
        contractSigned: true,
        depositPaid: false,
        insuranceVerified: false,
        accessibilityConfirmed: true,
      },
    });

    setName('');
    setContactPerson('');
    setSustainabilityNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">Add Vendor to Checklist</h2>
      {formError && (
        <p role="alert" className="text-xs font-medium text-red-700">
          {formError}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label htmlFor="vendor-name" className="block text-xs font-medium text-slate-700 mb-1">
            Vendor Name
          </label>
          <input
            id="vendor-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Solstice Acoustic Collective"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="vendor-category" className="block text-xs font-medium text-slate-700 mb-1">
            Category
          </label>
          <select
            id="vendor-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as BudgetCategory)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
          >
            {ALL_BUDGET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="vendor-quote" className="block text-xs font-medium text-slate-700 mb-1">
            Quoted Amount ($)
          </label>
          <input
            id="vendor-quote"
            type="number"
            min={0}
            value={quotedAmount}
            onChange={(e) => setQuotedAmount(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="vendor-contact" className="block text-xs font-medium text-slate-700 mb-1">
            Lead Contact
          </label>
          <input
            id="vendor-contact"
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Aria Chen"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add Vendor
          </button>
        </div>
      </div>
    </form>
  );
}
