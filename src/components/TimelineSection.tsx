/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Timeline coordinator section for phase milestones and day-of run-of-show.
 */

import { useState, type JSX } from 'react';
import type { EventPlan, ReadinessMetrics, TimelineItem } from '../types/planner';
import { TimelineAddForm } from './timeline/TimelineAddForm';
import { TimelineTable } from './timeline/TimelineTable';

export interface TimelineSectionProps {
  readonly plan: EventPlan;
  readonly readiness: ReadinessMetrics;
  readonly onToggleTaskStatus: (id: string) => void;
  readonly onAddMilestone: (milestone: Omit<TimelineItem, 'id'>) => void;
  readonly onDeleteMilestone: (id: string) => void;
}

export function TimelineSection({
  plan,
  readiness,
  onToggleTaskStatus,
  onAddMilestone,
  onDeleteMilestone,
}: TimelineSectionProps): JSX.Element {
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'dayof'>('all');

  const filteredItems = plan.timelineItems.filter((item) => {
    if (filterMode === 'critical') return item.isCriticalPath;
    if (filterMode === 'dayof') return item.phase === 'Day-Of Run of Show';
    return true;
  });

  return (
    <section aria-labelledby="timeline-heading" className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Critical-Path Milestones &amp; Hour-by-Hour Day-Of Run of Show
          </p>
          <h1 id="timeline-heading" className="font-display text-2xl font-semibold text-slate-900 mt-1">
            Timeline &amp; Production Schedule
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-mono tabular-nums">
            {readiness.completedTasks} of {readiness.totalTasks} milestones complete (
            {readiness.taskCompletionRate}%) · {readiness.criticalPathRemaining} critical-path items remaining
          </p>
        </div>

        <div
          role="group"
          aria-label="Filter Timeline Milestones"
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
        >
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Milestones ({plan.timelineItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('critical')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterMode === 'critical'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Critical Path Only
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('dayof')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterMode === 'dayof'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Day-Of Run of Show
          </button>
        </div>
      </div>

      <TimelineTable
        items={filteredItems}
        onToggleStatus={onToggleTaskStatus}
        onDeleteItem={onDeleteMilestone}
      />

      <TimelineAddForm onAdd={onAddMilestone} />
    </section>
  );
}
