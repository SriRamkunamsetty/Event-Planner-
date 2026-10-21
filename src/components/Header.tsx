/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Main top navigation bar adhering strictly to the 3-zone contract.
 * Zone 1: Text wordmark. Zone 2: 5 navigation links. Zone 3: 1 primary CTA.
 */

import type { JSX } from 'react';

export type ActiveTab = 'overview' | 'budget' | 'timeline' | 'vendors' | 'ai';

export interface HeaderProps {
  readonly activeTab: ActiveTab;
  readonly onSelectTab: (tab: ActiveTab) => void;
  readonly onOpenNewBlueprint: () => void;
}

interface NavItem {
  readonly id: ActiveTab;
  readonly label: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'budget', label: 'Budget Ledger' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'ai', label: 'AI Co-Planner' },
] as const;

export function Header({
  activeTab,
  onSelectTab,
  onOpenNewBlueprint,
}: HeaderProps): JSX.Element {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-y-2 gap-x-4 md:gap-8 px-4 sm:px-6 py-3">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('overview');
          }}
          className="font-display text-lg sm:text-xl font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
        >
          Atelier Chronos
        </a>

        {/* Zone 2: 5 single-line navigation links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="order-3 md:order-2 w-full md:w-auto flex items-center justify-between sm:justify-start md:justify-center gap-3 sm:gap-6 overflow-x-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTab(item.id);
                }}
                className={`text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 ${
                  isActive
                    ? 'border-teal-800 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="order-2 md:order-3 flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenNewBlueprint}
            className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-teal-900 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-900 cursor-pointer"
          >
            New Event Blueprint
          </button>
        </div>
      </div>
    </header>
  );
}
