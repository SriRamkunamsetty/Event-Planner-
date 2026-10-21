/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ALL_BUDGET_CATEGORIES } from '../domain/plannerEngine';
import { sanitizeText } from '../domain/security';
import type {
  BudgetCategory,
  EventPlan,
  ReadinessMetrics,
  VendorComplianceChecklist,
  VendorItem,
} from '../types/planner';

interface VendorSectionProps {
  plan: EventPlan;
  readiness: ReadinessMetrics;
  onToggleCompliance: (vendorId: string, field: keyof VendorComplianceChecklist) => void;
  onAddVendor: (vendor: Omit<VendorItem, 'id'>) => void;
  onDeleteVendor: (vendorId: string) => void;
}

export function VendorSection({
  plan,
  readiness,
  onToggleCompliance,
  onAddVendor,
  onDeleteVendor,
}: VendorSectionProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('Catering & Beverage');
  const [quotedAmount, setQuotedAmount] = useState('3500');
  const [contactPerson, setContactPerson] = useState('');
  const [sustainabilityNote, setSustainabilityNote] = useState('');
  const [formError, setFormError] = useState('');

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, 100);
    if (!cleanName || cleanName.length < 2) {
      setFormError('Please enter a vendor organization name.');
      return;
    }
    const quote = Math.max(0, Math.round(Number(quotedAmount) || 0));
    setFormError('');

    onAddVendor({
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
    <section aria-labelledby="vendor-heading" className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            4-Point Compliance Verification &amp; Quote Comparison Matrix
          </p>
          <h1
            id="vendor-heading"
            className="font-display text-2xl font-semibold text-slate-900 mt-1"
          >
            Vendor Checklist &amp; Compliance
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-mono tabular-nums">
            {readiness.fullyCompliantVendors} of {readiness.totalVendors} vendors 100% verified
            (Contract · Deposit · COI Insurance · ADA Accessibility)
          </p>
        </div>
      </div>

      {/* Vendor Compliance Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th scope="col" className="py-3 px-4">
                  Vendor &amp; Sustainability Note
                </th>
                <th scope="col" className="py-3 px-4">
                  Category &amp; Status
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Quote ($)
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Contract
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Deposit
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  COI Insurance
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  ADA Access
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Remove
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {plan.vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{vendor.name}</div>
                    <div className="text-slate-500 mt-0.5">
                      Contact: {vendor.contactPerson} · {vendor.sustainabilityNote}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                    <div>{vendor.category}</div>
                    <div className="text-slate-500 capitalize">
                      {vendor.status} · {vendor.rating.toFixed(1)} rating
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    ${vendor.quotedAmount.toLocaleString()}
                  </td>
                  {(
                    [
                      ['contractSigned', 'Contract Signed'],
                      ['depositPaid', 'Deposit Paid'],
                      ['insuranceVerified', 'COI Insurance Verified'],
                      ['accessibilityConfirmed', 'ADA Accessibility Confirmed'],
                    ] as const
                  ).map(([field, label]) => (
                    <td key={field} className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={vendor.compliance[field]}
                        onChange={() => onToggleCompliance(vendor.id, field)}
                        aria-label={`${label} for ${vendor.name}`}
                        className="w-4 h-4 rounded border-slate-300 text-teal-900 focus:ring-teal-800 cursor-pointer"
                      />
                    </td>
                  ))}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteVendor(vendor.id)}
                      aria-label={`Remove vendor ${vendor.name}`}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Form */}
      <form
        onSubmit={handleAdd}
        className="p-5 bg-white border border-slate-200 rounded-xl space-y-4"
      >
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
    </section>
  );
}
