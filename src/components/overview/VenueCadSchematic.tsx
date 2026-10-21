/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Scaled architectural CAD floorplan SVG diagram displaying
 * spatial zoning, acoustic coverage, seating matrices, and ADA egress routing.
 */

import type { JSX } from 'react';
import type { EventPlan } from '../../types/planner';

export interface VenueCadSchematicProps {
  readonly plan: EventPlan;
}

export function VenueCadSchematic({ plan }: VenueCadSchematicProps): JSX.Element {
  const isWedding = plan.vertical === 'wedding';
  const isBirthday = plan.vertical === 'birthday';
  const stageTitle = isWedding
    ? 'Ceremony Arch & Quartet'
    : isBirthday
      ? 'DJ Booth & Cello Stage'
      : 'Solar Main Stage & ASL';

  return (
    <div className="my-4 bg-slate-900 rounded-lg p-4 text-slate-100 overflow-hidden">
      <svg
        viewBox="0 0 680 280"
        role="img"
        aria-label={`Architectural floorplan schematic for ${plan.title}`}
        className="w-full h-auto block"
      >
        <defs>
          <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(148, 163, 184, 0.12)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="680" height="280" fill="url(#cad-grid)" />

        {/* Outer Venue Perimeter */}
        <rect
          x="18"
          y="18"
          width="644"
          height="244"
          rx="6"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1.5"
          strokeDasharray="6 3"
        />

        {/* Zone A: Stage / Ceremony / Focal Anchor */}
        <rect
          x="36"
          y="36"
          width="175"
          height="208"
          rx="4"
          fill="rgba(20, 184, 166, 0.14)"
          stroke="#2DD4BF"
          strokeWidth="1.5"
        />
        <text x="48" y="62" fill="#5EEAD4" fontSize="11" fontFamily="monospace">
          ZONE A · FOCAL STAGE
        </text>
        <text x="48" y="82" fill="#F8FAFC" fontSize="11.5" fontWeight="600">
          {stageTitle}
        </text>
        <text x="50" y="102" fill="#94A3B8" fontSize="10" fontFamily="monospace">
          Inductive Loop + 1:12 Ramp
        </text>
        <circle
          cx="124"
          cy="172"
          r="38"
          fill="rgba(45, 212, 191, 0.12)"
          stroke="#2DD4BF"
          strokeDasharray="3 3"
        />
        <text
          x="124"
          y="176"
          textAnchor="middle"
          fill="#E2E8F0"
          fontSize="10"
          fontFamily="monospace"
        >
          PA Coverage
        </text>

        {/* Zone B: Seating Matrix */}
        <rect
          x="228"
          y="36"
          width="244"
          height="208"
          rx="4"
          fill="rgba(56, 189, 248, 0.1)"
          stroke="#38BDF8"
          strokeWidth="1.5"
        />
        <text x="244" y="62" fill="#7DD3FC" fontSize="11" fontFamily="monospace">
          ZONE B · HOSPITALITY MATRIX
        </text>
        <text x="244" y="82" fill="#F8FAFC" fontSize="13" fontWeight="600">
          {plan.guestCount} Pax Seating &amp; Aisles
        </text>

        {[0, 1, 2].map((col) =>
          [0, 1].map((row) => (
            <g
              key={`tbl-${col}-${row}`}
              transform={`translate(${262 + col * 68}, ${118 + row * 62})`}
            >
              <circle
                cx="18"
                cy="18"
                r="18"
                fill="rgba(248, 250, 252, 0.08)"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              <text
                x="18"
                y="22"
                textAnchor="middle"
                fill="#E2E8F0"
                fontSize="9"
                fontFamily="monospace"
              >
                T{col * 2 + row + 1}
              </text>
            </g>
          ))
        )}

        {/* Zone C & D: Culinary & Quiet Sensory Alcove */}
        <rect
          x="488"
          y="36"
          width="156"
          height="98"
          rx="4"
          fill="rgba(251, 191, 36, 0.12)"
          stroke="#FBBF24"
          strokeWidth="1.5"
        />
        <text x="502" y="60" fill="#FDE68A" fontSize="10" fontFamily="monospace">
          ZONE C · CULINARY
        </text>
        <text x="502" y="78" fill="#F8FAFC" fontSize="12" fontWeight="600">
          Allergen-Safe Prep
        </text>

        <rect
          x="488"
          y="146"
          width="156"
          height="98"
          rx="4"
          fill="rgba(167, 139, 250, 0.12)"
          stroke="#C4B5FD"
          strokeWidth="1.5"
        />
        <text x="502" y="170" fill="#DDD6FE" fontSize="10" fontFamily="monospace">
          ZONE D · ACCESS &amp; CARE
        </text>
        <text x="502" y="188" fill="#F8FAFC" fontSize="12" fontWeight="600">
          Quiet Sensory Lounge
        </text>
      </svg>
    </div>
  );
}
