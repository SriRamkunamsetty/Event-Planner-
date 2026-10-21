/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, Plus, Trash2 } from 'lucide-react';
import { sanitizeText } from '../domain/security';
import type {
  EventPlan,
  ReadinessMetrics,
  TaskPhase,
  TaskStatus,
  TimelineItem,
} from '../types/planner';

interface TimelineSectionProps {
  plan: EventPlan;
  readiness: ReadinessMetrics;
  onToggleTaskStatus: (id: string) => void;
  onAddMilestone: (milestone: Omit<TimelineItem, 'id'>) => void;
  onDeleteMilestone: (id: string) => void;
}

const PHASES: readonly TaskPhase[] = [
  'Foundation (6–12 Months)',
  'Vendor Lock (3–5 Months)',
  'Detailed Operations (1–2 Months)',
  'Final Week Confirmation',
  'Day-Of Run of Show',
] as const;

const STATUS_LABELS: Record<TaskStatus, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending',
  at_risk: 'At Risk',
};

export function TimelineSection({
  plan,
  readiness,
  onToggleTaskStatus,
  onAddMilestone,
  onDeleteMilestone,
}: TimelineSectionProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'dayof'>('all');
  const [phase, setPhase] = useState<TaskPhase>('Detailed Operations (1–2 Months)');
  const [timeSlot, setTimeSlot] = useState('T-3 Weeks');
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('Operations Lead');
  const [isCritical, setIsCritical] = useState(true);
  const [formError, setFormError] = useState('');

  const filteredItems = plan.timelineItems.filter((item) => {
    if (filterMode === 'critical') return item.isCriticalPath;
    if (filterMode === 'dayof') return item.phase === 'Day-Of Run of Show';
    return true;
  });

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(title, 160);
    if (!cleanTitle || cleanTitle.length < 3) {
      setFormError('Please enter a milestone title (at least 3 characters).');
      return;
    }
    setFormError('');
    onAddMilestone({
      phase,
      timeOffsetOrSlot: sanitizeText(timeSlot, 32) || 'TBD',
      title: cleanTitle,
      owner: sanitizeText(owner, 60) || 'Lead Producer',
      status: 'pending',
      isCriticalPath: isCritical,
    });
    setTitle('');
  };

  return (
    <section aria-labelledby="timeline-heading" className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Critical-Path Milestones &amp; Hour-by-Hour Day-Of Run of Show
          </p>
          <h1
            id="timeline-heading"
            className="font-display text-2xl font-semibold text-slate-900 mt-1"
          >
            Timeline &amp; Production Schedule
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-mono tabular-nums">
            {readiness.completedTasks} of {readiness.totalTasks} milestones complete (
            {readiness.taskCompletionRate}%) · {readiness.criticalPathRemaining} critical-path
            items remaining
          </p>
        </div>

        {/* Filter Buttons */}
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

      {/* Timeline Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th scope="col" className="py-3 px-4">
                  Status
                </th>
                <th scope="col" className="py-3 px-4">
                  Time / Offset
                </th>
                <th scope="col" className="py-3 px-4">
                  Milestone &amp; Phase
                </th>
                <th scope="col" className="py-3 px-4">
                  Owner
                </th>
                <th scope="col" className="py-3 px-4">
                  Dependency / Path
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Remove
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredItems.map((item) => {
                const isDone = item.status === 'completed';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleTaskStatus(item.id)}
                        aria-label={`Toggle status for ${item.title} (currently ${STATUS_LABELS[item.status]})`}
                        className="inline-flex items-center gap-1.5 font-medium text-slate-800 hover:text-teal-800 cursor-pointer whitespace-nowrap"
                      >
                        {isDone ? (
                          <CheckCircle2
                            className="w-4 h-4 text-emerald-700 shrink-0"
                            aria-hidden="true"
                          />
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
                      <div
                        className={`font-semibold ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
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
                        onClick={() => onDeleteMilestone(item.id)}
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

      {/* Add Custom Milestone Form */}
      <form
        onSubmit={handleAdd}
        className="p-5 bg-white border border-slate-200 rounded-xl space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">
          Add Timeline Milestone or Run-of-Show Cue
        </h2>
        {formError && (
          <p role="alert" className="text-xs font-medium text-red-700">
            {formError}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label htmlFor="milestone-phase" className="block text-xs font-medium text-slate-700 mb-1">
              Phase
            </label>
            <select
              id="milestone-phase"
              value={phase}
              onChange={(e) => setPhase(e.target.value as TaskPhase)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="milestone-time" className="block text-xs font-medium text-slate-700 mb-1">
              Time / Offset
            </label>
            <input
              id="milestone-time"
              type="text"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              placeholder="e.g. 19:15 or T-2 Weeks"
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="milestone-title" className="block text-xs font-medium text-slate-700 mb-1">
              Milestone Action
            </label>
            <input
              id="milestone-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Confirm ASL interpreter stage spotlight & sightline"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="milestone-owner" className="block text-xs font-medium text-slate-700 mb-1">
              Owner
            </label>
            <input
              id="milestone-owner"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCritical}
                onChange={(e) => setIsCritical(e.target.checked)}
                className="rounded border-slate-300 text-teal-900"
              />
              <span>Critical</span>
            </label>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Cue
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
