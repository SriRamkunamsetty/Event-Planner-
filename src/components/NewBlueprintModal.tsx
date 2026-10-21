/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { validateBlueprintInput } from '../domain/security';
import type { EventPlan, EventVertical, VenueSetting } from '../types/planner';

interface NewBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatedPlan: (plan: EventPlan) => void;
}

export function NewBlueprintModal({
  isOpen,
  onClose,
  onCreatedPlan,
}: NewBlueprintModalProps) {
  const [title, setTitle] = useState('Coastal Botanical Wedding & Reception');
  const [vertical, setVertical] = useState<EventVertical>('wedding');
  const [totalBudget, setTotalBudget] = useState('36000');
  const [guestCount, setGuestCount] = useState('120');
  const [eventDate, setEventDate] = useState('2027-08-14');
  const [location, setLocation] = useState('Marin Headlands Cultural Center');
  const [setting, setSetting] = useState<VenueSetting>('hybrid');
  const [priorities, setPriorities] = useState(
    'Zero-waste floral installations, celiac-safe plated dinner, and acoustic jazz trio'
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validation = validateBlueprintInput({
      title,
      vertical,
      totalBudget: Number(totalBudget),
      guestCount: Number(guestCount),
      eventDate,
      location,
      setting,
      priorities,
    });

    if (!validation.valid || !validation.data) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    setLoading(true);
    try {
      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });
      const payload = await res.json();
      if (!res.ok || !payload.plan) {
        setErrors([payload.error || 'Could not generate event blueprint.']);
      } else {
        onCreatedPlan(payload.plan as EventPlan);
        onClose();
      }
    } catch (_err) {
      setErrors(['Network error while generating blueprint.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-blueprint-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-teal-800">
              GenAI Event Blueprint Architect
            </p>
            <h2
              id="modal-blueprint-title"
              className="font-display text-xl font-semibold text-slate-900 mt-0.5"
            >
              Generate Custom Celebration Plan
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close New Event Blueprint dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {errors.length > 0 && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-1"
          >
            {errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="bp-title" className="block font-semibold text-slate-800 mb-1">
                Event Title
              </label>
              <input
                id="bp-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="bp-vertical" className="block font-semibold text-slate-800 mb-1">
                Celebration Vertical
              </label>
              <select
                id="bp-vertical"
                value={vertical}
                onChange={(e) => setVertical(e.target.value as EventVertical)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
              >
                <option value="wedding">Wedding &amp; Reception</option>
                <option value="birthday">Milestone Birthday Celebration</option>
                <option value="community">Community &amp; Civic Festival</option>
              </select>
            </div>

            <div>
              <label htmlFor="bp-setting" className="block font-semibold text-slate-800 mb-1">
                Venue Setting
              </label>
              <select
                id="bp-setting"
                value={setting}
                onChange={(e) => setSetting(e.target.value as VenueSetting)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
              >
                <option value="hybrid">Hybrid (Indoor + Outdoor)</option>
                <option value="outdoor">Outdoor (Weather Contingency Active)</option>
                <option value="indoor">Indoor Climate-Controlled</option>
              </select>
            </div>

            <div>
              <label htmlFor="bp-budget" className="block font-semibold text-slate-800 mb-1">
                Total Budget Ceiling ($)
              </label>
              <input
                id="bp-budget"
                type="number"
                min={200}
                max={10000000}
                required
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full px-3 py-2 font-mono tabular-nums border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="bp-guests" className="block font-semibold text-slate-800 mb-1">
                Estimated Guest Count
              </label>
              <input
                id="bp-guests"
                type="number"
                min={2}
                max={50000}
                required
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-full px-3 py-2 font-mono tabular-nums border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="bp-date" className="block font-semibold text-slate-800 mb-1">
                Target Event Date
              </label>
              <input
                id="bp-date"
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 font-mono tabular-nums border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="bp-location" className="block font-semibold text-slate-800 mb-1">
                Venue / City
              </label>
              <input
                id="bp-location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bp-priorities" className="block font-semibold text-slate-800 mb-1">
                Dietary, Cultural, or Sustainability Priorities
              </label>
              <textarea
                id="bp-priorities"
                rows={2}
                value={priorities}
                onChange={(e) => setPriorities(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-900 rounded-lg hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  Building Blueprint...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  Generate Event Blueprint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
