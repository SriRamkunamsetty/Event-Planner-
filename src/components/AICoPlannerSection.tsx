/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview GenAI Co-Planner and Personalized Ideas Studio. Provides scenario prompts,
 * server-side Gemini advice synthesis with aria-live="polite" and aria-busy regions.
 */

import { Bookmark, Check, Loader2, Plus, Send, Sparkles } from 'lucide-react';
import { useState, type FormEvent, type JSX } from 'react';
import type {
  AiAdviceResponse,
  AiRecommendedBudgetAdjustment,
  AiRecommendedMilestone,
  EventPlan,
  PersonalizedIdea,
} from '../types/planner';

export interface AICoPlannerSectionProps {
  readonly plan: EventPlan;
  readonly onApplyBudgetAdjustment: (adj: AiRecommendedBudgetAdjustment) => void;
  readonly onApplyMilestone: (milestone: AiRecommendedMilestone) => void;
  readonly onSaveIdea: (idea: Omit<PersonalizedIdea, 'id' | 'isSaved'>) => void;
  readonly onToggleIdeaSaved: (ideaId: string) => void;
}

const SCENARIO_PROMPTS: readonly string[] = [
  'Optimize for a 25% rain probability and add an indoor/tent transition protocol',
  'Reduce total catering & floral spend by 12% without sacrificing guest experience',
  'Design 3 zero-waste, allergen-inclusive culinary & favor ideas for our guest count',
  'Create a multi-generational accessibility & quiet-lounge hospitality plan',
] as const;

export function AICoPlannerSection({
  plan,
  onApplyBudgetAdjustment,
  onApplyMilestone,
  onSaveIdea,
  onToggleIdeaSaved,
}: AICoPlannerSectionProps): JSX.Element {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [advice, setAdvice] = useState<AiAdviceResponse | null>(null);
  const [appliedKeys, setAppliedKeys] = useState<Record<string, boolean>>({});

  const runAdvisor = async (queryText: string): Promise<void> => {
    const trimmed = queryText.trim();
    if (trimmed.length < 4) {
      setError('Please enter a planning question or select a scenario above.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/planner/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          vertical: plan.vertical,
          totalBudget: plan.totalBudget,
          guestCount: plan.guestCount,
          setting: plan.setting,
          plan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to generate planning recommendations.');
      } else {
        setAdvice(data as AiAdviceResponse);
      }
    } catch (_err) {
      setError('Network error while contacting the planning server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    void runAdvisor(prompt);
  };

  return (
    <section aria-labelledby="ai-coplanner-heading" className="space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-500">
          Server-Side Gemini 3.8 Flash Architecture · Contextual Decision Engine
        </p>
        <h1 id="ai-coplanner-heading" className="font-display text-2xl font-semibold text-slate-900 mt-1">
          AI Co-Planner &amp; Personalized Ideas Studio
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Ask scenario questions grounded in active{' '}
          <span className="font-semibold text-slate-900">{plan.title}</span> parameters (
          <span className="font-mono tabular-nums">
            {plan.guestCount} guests · ${plan.totalBudget.toLocaleString()} ceiling · {plan.setting}
          </span>
          ) and apply recommendations directly to your ledger or schedule.
        </p>
      </div>

      {/* Input Form & Scenario Prompts */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="ai-scenario-input" className="block text-xs font-semibold text-slate-900">
            Describe a planning constraint, budget trade-off, weather scenario, or creative theme
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="ai-scenario-input"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., How should we rebalance our budget if guest count increases by 20% and we need vegan tasting stations?"
              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-2 focus:outline-teal-800"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-teal-900 rounded-lg hover:bg-teal-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  Synthesizing Plan...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  Analyze &amp; Recommend
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <p role="alert" className="text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium text-slate-500">Or run a one-click contextual simulation:</p>
          <div className="flex flex-wrap gap-2">
            {SCENARIO_PROMPTS.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setPrompt(sample);
                  void runAdvisor(sample);
                }}
                className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors text-left cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic AI Results Region with ARIA Live Region */}
      <section
        id="planner-results"
        aria-live="polite"
        aria-busy={loading}
        className={advice ? 'p-6 bg-white border border-teal-800/30 rounded-xl space-y-6' : 'hidden'}
      >
        {advice && (
          <>
            <div className="pb-4 border-b border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-teal-900 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  Contextual Architecture Synthesis
                </span>
                <span className="font-mono text-slate-500 font-normal">Verified Structured Output</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">{advice.executiveSummary}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{advice.contextualAnalysis}</p>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900">Risk &amp; Contingency Guardrail:</span>{' '}
                {advice.riskMitigation}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-900">Recommended Budget Line Adjustments</h2>
                <div className="space-y-2.5">
                  {advice.budgetAdjustments.map((adj, idx) => {
                    const key = `b-${idx}-${adj.title}`;
                    const isApplied = Boolean(appliedKeys[key]);
                    return (
                      <div
                        key={key}
                        className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="font-semibold text-slate-900">{adj.title}</div>
                          <div className="text-slate-500">
                            {adj.category} · Target:{' '}
                            <span className="font-mono tabular-nums font-semibold text-slate-900">
                              ${adj.suggestedAmount.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-600">{adj.reason}</p>
                        </div>
                        <button
                          type="button"
                          disabled={isApplied}
                          onClick={() => {
                            onApplyBudgetAdjustment(adj);
                            setAppliedKeys((prev) => ({ ...prev, [key]: true }));
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-teal-900 bg-white border border-slate-300 rounded-md hover:bg-teal-50 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {isApplied ? (
                            <span className="inline-flex items-center gap-1">
                              <Check className="w-3 h-3" aria-hidden="true" /> Applied
                            </span>
                          ) : (
                            'Apply to Budget'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-900">Recommended Critical-Path Milestones</h2>
                <div className="space-y-2.5">
                  {advice.newMilestones.map((ms, idx) => {
                    const key = `m-${idx}-${ms.title}`;
                    const isApplied = Boolean(appliedKeys[key]);
                    return (
                      <div
                        key={key}
                        className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="font-semibold text-slate-900">{ms.title}</div>
                          <div className="text-slate-500 font-mono tabular-nums">
                            {ms.timeOffsetOrSlot} · Owner: {ms.owner}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isApplied}
                          onClick={() => {
                            onApplyMilestone(ms);
                            setAppliedKeys((prev) => ({ ...prev, [key]: true }));
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-teal-900 bg-white border border-slate-300 rounded-md hover:bg-teal-50 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {isApplied ? (
                            <span className="inline-flex items-center gap-1">
                              <Check className="w-3 h-3" aria-hidden="true" /> Added
                            </span>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 inline mr-0.5" aria-hidden="true" />
                              Add to Timeline
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Curated Concepts Board */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Curated Concept Board ({plan.ideas.length})</h2>
          <p className="text-xs text-slate-500">Personalized guest touchpoints, zero-waste design, and culinary signatures</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plan.ideas.map((idea) => (
            <div key={idea.id} className="p-5 bg-white border border-slate-200 rounded-xl flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs text-slate-500">
                  {idea.category} · {idea.impactLevel} ·{' '}
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    ${idea.estimatedCost.toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{idea.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{idea.description}</p>
                <p className="text-xs text-slate-500 pt-1">Rationale: {idea.rationale}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onToggleIdeaSaved(idea.id)}
                  aria-pressed={idea.isSaved}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                    idea.isSaved ? 'text-teal-800' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${idea.isSaved ? 'fill-teal-800' : ''}`} aria-hidden="true" />
                  {idea.isSaved ? 'Bookmarked in Production Plan' : 'Bookmark Concept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
