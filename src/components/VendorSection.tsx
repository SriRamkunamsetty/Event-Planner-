/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Vendor coordinator section for 4-point compliance and quote comparison.
 */

import type { JSX } from 'react';
import type {
  EventPlan,
  ReadinessMetrics,
  VendorComplianceChecklist,
  VendorItem,
} from '../types/planner';
import { VendorAddForm } from './vendor/VendorAddForm';
import { VendorTable } from './vendor/VendorTable';

export interface VendorSectionProps {
  readonly plan: EventPlan;
  readonly readiness: ReadinessMetrics;
  readonly onToggleCompliance: (
    vendorId: string,
    field: keyof VendorComplianceChecklist
  ) => void;
  readonly onAddVendor: (vendor: Omit<VendorItem, 'id'>) => void;
  readonly onDeleteVendor: (vendorId: string) => void;
}

export function VendorSection({
  plan,
  readiness,
  onToggleCompliance,
  onAddVendor,
  onDeleteVendor,
}: VendorSectionProps): JSX.Element {
  return (
    <section aria-labelledby="vendor-heading" className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            4-Point Compliance Verification &amp; Quote Comparison Matrix
          </p>
          <h1 id="vendor-heading" className="font-display text-2xl font-semibold text-slate-900 mt-1">
            Vendor Checklist &amp; Compliance
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-mono tabular-nums">
            {readiness.fullyCompliantVendors} of {readiness.totalVendors} vendors 100% verified
            (Contract · Deposit · COI Insurance · ADA Accessibility)
          </p>
        </div>
      </div>

      <VendorTable
        vendors={plan.vendors}
        onToggleCompliance={onToggleCompliance}
        onDeleteVendor={onDeleteVendor}
      />

      <VendorAddForm onAdd={onAddVendor} />
    </section>
  );
}
