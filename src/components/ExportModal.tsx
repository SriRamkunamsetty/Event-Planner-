/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import { exportBudgetToCSV, exportPlanToMarkdown } from '../domain/plannerEngine';
import type { BudgetSummary, EventPlan, ReadinessMetrics } from '../types/planner';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: EventPlan;
  budget: BudgetSummary;
  readiness: ReadinessMetrics;
}

export function ExportModal({
  isOpen,
  onClose,
  plan,
  budget,
  readiness,
}: ExportModalProps) {
  const [format, setFormat] = useState<'markdown' | 'csv'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const content =
    format === 'markdown'
      ? exportPlanToMarkdown(plan, budget, readiness)
      : exportBudgetToCSV(plan);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const mime = format === 'markdown' ? 'text/markdown;charset=utf-8' : 'text/csv;charset=utf-8';
    const ext = format === 'markdown' ? 'md' : 'csv';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.vertical}-production-book.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-slate-500">
              RFC-4180 CSV (Formula-Injection Protected) &amp; Markdown Production Packet
            </p>
            <h2
              id="export-modal-title"
              className="font-display text-xl font-semibold text-slate-900 mt-0.5"
            >
              Export Master Event Production Book
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Export dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setFormat('markdown')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                format === 'markdown'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Production Book (.md)
            </button>
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                format === 'csv'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Budget Ledger (.csv)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  Copy Text
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-900 rounded-lg hover:bg-teal-800 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Download File
            </button>
          </div>
        </div>

        <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-auto max-h-80 leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
}
