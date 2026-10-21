/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Domain benchmark constants, category definitions, and allocation
 * weights for the Celebration & Event Planner. Adheres to Google TypeScript Style.
 */

import type { BudgetCategory, EventCategory, EventVertical } from '../types/planner';

export const ALL_BUDGET_CATEGORIES: readonly BudgetCategory[] = [
  'Venue & Permits',
  'Catering & Beverage',
  'Production & AV',
  'Decor & Floral',
  'Entertainment & Talent',
  'Photography & Media',
  'Logistics & Accessibility',
  'Contingency Reserve',
] as const;

export const MIN_COST_PER_GUEST_INR: Readonly<Record<EventCategory, number>> = {
  wedding: 1200,
  birthday: 450,
  community: 200,
};

export const VERTICAL_WEIGHTS: Readonly<
  Record<EventVertical, Readonly<Record<BudgetCategory, number>>>
> = {
  wedding: {
    'Venue & Permits': 0.24,
    'Catering & Beverage': 0.3,
    'Production & AV': 0.07,
    'Decor & Floral': 0.12,
    'Entertainment & Talent': 0.08,
    'Photography & Media': 0.1,
    'Logistics & Accessibility': 0.04,
    'Contingency Reserve': 0.05,
  },
  birthday: {
    'Venue & Permits': 0.22,
    'Catering & Beverage': 0.34,
    'Production & AV': 0.08,
    'Decor & Floral': 0.1,
    'Entertainment & Talent': 0.12,
    'Photography & Media': 0.06,
    'Logistics & Accessibility': 0.03,
    'Contingency Reserve': 0.05,
  },
  community: {
    'Venue & Permits': 0.16,
    'Catering & Beverage': 0.2,
    'Production & AV': 0.22,
    'Decor & Floral': 0.06,
    'Entertainment & Talent': 0.14,
    'Photography & Media': 0.05,
    'Logistics & Accessibility': 0.1,
    'Contingency Reserve': 0.07,
  },
};

export const CATEGORY_TITLES: Readonly<
  Record<BudgetCategory, Readonly<Record<EventVertical, string>>>
> = {
  'Venue & Permits': {
    wedding: 'Ceremony & Reception Estate Rental',
    birthday: 'Private Terrace & Lounge Buyout',
    community: 'Civic Plaza Permit & Street Closure Fee',
  },
  'Catering & Beverage': {
    wedding: 'Seasonal Plated Dinner & Bar',
    birthday: 'Artisanal Tasting Stations & Cocktail Bar',
    community: 'Local Food Truck Stipends & Hydration Stations',
  },
  'Production & AV': {
    wedding: 'Architectural Uplighting & Wireless Ceremony Sound',
    birthday: 'Acoustic Sound System & Ambient Projection Mapping',
    community: 'Main Stage PA Array, Generators & ADA Ramp Staging',
  },
  'Decor & Floral': {
    wedding: 'Sustainable Botanical Installations & Linen Tablescapes',
    birthday: 'Custom Entry Archway, Candlelight & Table Styling',
    community: 'Wayfinding Signage, Welcome Banners & Shade Canopies',
  },
  'Entertainment & Talent': {
    wedding: 'Live String Quartet & Reception DJ Set',
    birthday: 'Live Vinyl DJ & Interactive Photo Booth',
    community: 'Regional Acoustic Ensemble & Community Workshop Hosts',
  },
  'Photography & Media': {
    wedding: 'Full-Day Documentary Photo & Cinema Team',
    birthday: 'Candid Editorial Photographer & Instant Print Station',
    community: 'Event Documentation & Livestream Production Crew',
  },
  'Logistics & Accessibility': {
    wedding: 'Guest Shuttle Service, Coat Check & Step-Free Access',
    birthday: 'Valet Coordination & Restroom Attendants',
    community: 'ADA Accessible Restrooms, First-Aid Tent & Waste Sorting',
  },
  'Contingency Reserve': {
    wedding: 'Weather Marquee & Overtime Buffer',
    birthday: 'Last-Minute Guest Count & Service Buffer',
    community: 'Inclement Weather & Crowd Safety Reserve',
  },
};
