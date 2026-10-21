/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Form component for adding critical-path milestones or day-of run-of-show cues.
 */

import { Plus } from 'lucide-react';
import { useState, type FormEvent, type JSX } from 'react';
import { sanitizeText } from '../../domain/security';
import type { TaskPhase, TimelineItem } from '../../types/planner';

export interface TimelineAddFormProps {
  readonly onAdd: (milestone: Omit<TimelineItem, 'id'>) => void;
}

const PHASES: readonly TaskPhase[] = [
  'Foundation (6–12 Months)',
  'Vendor Lock (3–5 Months)',
  'Detailed Operations (1–2 Months)',
  'Final Week Confirmation',
  'Day-Of Run of Show',
] as const;

export function TimelineAddForm({ onAdd }: TimelineAddFormProps): JSX.Element {
  const [phase, setPhase] = useState<TaskPhase>('Detailed Operations (1–2 Months)');
  const [timeSlot, setTimeSlot] = useState('T-3 Weeks');
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('Operations Lead');
  const [isCritical, setIsCritical] = useState(true);
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const cleanTitle = sanitizeText(title, 160);
    if (!cleanTitle || cleanTitle.length < 3) {
      setFormError('Please enter a milestone title (at least 3 characters).');
      return;
    }
    setFormError('');
    onAdd({
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
    <form onSubmit={handleSubmit} className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">Add Timeline Milestone or Run-of-Show Cue</h2>
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
  );
}
