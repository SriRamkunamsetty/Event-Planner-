/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview High-density editable financial data grid with per-line lock controls,
 * allocated/actual spend inputs, and variance indicators.
 */

import { Lock, Trash2, Unlock } from 'lucide-react';
import type { JSX } from 'react';
import type { BudgetItem } from '../../types/planner';

export interface BudgetTableProps {
  readonly items: readonly BudgetItem[];
  readonly onUpdateItem: (id: string, patch: Partial<BudgetItem>) => void;
  readonly onDeleteItem: (id: string) => void;
}

export function BudgetTable({
  items,
  onUpdateItem,
  onDeleteItem,
}: BudgetTableProps): JSX.Element {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th scope="col" className="py-3 px-4">Line Item &amp; Category</th>
              <th scope="col" className="py-3 px-4 text-right">Allocated ($)</th>
              <th scope="col" className="py-3 px-4 text-right">Actual ($)</th>
              <th scope="col" className="py-3 px-4 text-right">Paid ($)</th>
              <th scope="col" className="py-3 px-4 text-right">Variance</th>
              <th scope="col" className="py-3 px-4 text-center">Lock</th>
              <th scope="col" className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No budget items in this category. Add a new line item below.
                </td>
              </tr>
            ) : (
              items.map((item) => {
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
                          onUpdateItem(item.id, {
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
                          onUpdateItem(item.id, {
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
                        onClick={() => onUpdateItem(item.id, { isLocked: !item.isLocked })}
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
                        onClick={() => onDeleteItem(item.id)}
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
  );
}
