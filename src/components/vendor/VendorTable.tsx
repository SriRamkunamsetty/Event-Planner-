/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview 4-point compliance verification matrix and vendor quote comparison table.
 */

import { Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import type { VendorComplianceChecklist, VendorItem } from '../../types/planner';

export interface VendorTableProps {
  readonly vendors: readonly VendorItem[];
  readonly onToggleCompliance: (
    vendorId: string,
    field: keyof VendorComplianceChecklist
  ) => void;
  readonly onDeleteVendor: (vendorId: string) => void;
}

export function VendorTable({
  vendors,
  onToggleCompliance,
  onDeleteVendor,
}: VendorTableProps): JSX.Element {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th scope="col" className="py-3 px-4">Vendor &amp; Sustainability Note</th>
              <th scope="col" className="py-3 px-4">Category &amp; Status</th>
              <th scope="col" className="py-3 px-4 text-right">Quote ($)</th>
              <th scope="col" className="py-3 px-4 text-center">Contract</th>
              <th scope="col" className="py-3 px-4 text-center">Deposit</th>
              <th scope="col" className="py-3 px-4 text-center">COI Insurance</th>
              <th scope="col" className="py-3 px-4 text-center">ADA Access</th>
              <th scope="col" className="py-3 px-4 text-right">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {vendors.map((vendor) => (
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
  );
}
