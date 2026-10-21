/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview High-density timeline and run-of-show data table displaying status,
 * time slots, owner tags, critical-path dependencies, and deletion controls.
 */

import { CheckCircle2, Clock, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import type { TaskStatus, TimelineItem } from '../../types/planner';

export interface TimelineTableProps {
  readonly items: readonly TimelineItem[];
  readonly onToggleStatus: (id: string) => void;
  readonly onDeleteItem: (id: string) => void;
}

const STATUS_LABELS: Readonly<Record<TaskStatus, string>> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending',
  at_risk: 'At Risk',
};

export function TimelineTable({
  items,
  onToggleStatus,
  onDeleteItem,
}: TimelineTableProps): JSX.Element {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th scope="col" className="py-3 px-4">Status</th>
              <th scope="col" className="py-3 px-4">Time / Offset</th>
              <th scope="col" className="py-3 px-4">Milestone &amp; Phase</th>
              <th scope="col" className="py-3 px-4">Owner</th>
              <th scope="col" className="py-3 px-4">Dependency / Path</th>
              <th scope="col" className="py-3 px-4 text-right">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {items.map((item) => {
              const isDone = item.status === 'completed';
              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(item.id)}
                      aria-label={`Toggle status for ${item.title} (currently ${STATUS_LABELS[item.status]})`}
                      className="inline-flex items-center gap-1.5 font-medium text-slate-800 hover:text-teal-800 cursor-pointer whitespace-nowrap"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                      )}
                      <span>{STATUS_LABELS[item.status]}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                    {item.timeOffsetOrSlot}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {item.title}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {item.phase}
                      {item.dependencyNote ? ` · ${item.dependencyNote}` : ''}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">{item.owner}</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {item.isCriticalPath ? 'Critical Path' : 'Standard Flow'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      aria-label={`Remove milestone ${item.title}`}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
