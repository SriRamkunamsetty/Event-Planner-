/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BlueprintGeneratorInput, EventVertical, VenueSetting } from '../types/planner';

const VALID_VERTICALS: ReadonlySet<EventVertical> = new Set(['wedding', 'birthday', 'community']);
const VALID_SETTINGS: ReadonlySet<VenueSetting> = new Set(['indoor', 'outdoor', 'hybrid']);
const DANGEROUS_KEYS: ReadonlySet<string> = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Strips HTML tags, script payloads, control characters, and normalizes whitespace.
 */
export function sanitizeText(input: unknown, maxLength = 400): string {
  if (typeof input !== 'string') {
    return '';
  }
  const withoutScripts = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  return withoutScripts.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

/**
 * Protects CSV exports from spreadsheet formula injection (CSV Injection / DDE).
 */
export function escapeCsvCell(value: string | number | boolean): string {
  const raw = String(value ?? '');
  const neutralized = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  const escapedQuotes = neutralized.replace(/"/g, '""');
  return `"${escapedQuotes}"`;
}

/**
 * Recursively checks an unknown payload for prototype pollution keys.
 */
export function isSafeObject(value: unknown, depth = 0): boolean {
  if (depth > 8) return false;
  if (value === null || typeof value !== 'object') return true;
  if (Array.isArray(value)) {
    return value.every((item) => isSafeObject(item, depth + 1));
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (DANGEROUS_KEYS.has(key)) {
      return false;
    }
    if (!isSafeObject(record[key], depth + 1)) {
      return false;
    }
  }
  return true;
}

/**
 * Validates and sanitizes user input for generating a new Event Blueprint.
 */
export function validateBlueprintInput(raw: unknown): {
  valid: boolean;
  data?: BlueprintGeneratorInput;
  errors: string[];
} {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object' || !isSafeObject(raw)) {
    return { valid: false, errors: ['Invalid or unsafe request payload.'] };
  }

  const obj = raw as Record<string, unknown>;
  const title = sanitizeText(obj.title, 120);
  if (!title || title.length < 3) {
    errors.push('Event title must be at least 3 characters.');
  }

  const vertical = obj.vertical as EventVertical;
  if (!VALID_VERTICALS.has(vertical)) {
    errors.push('Event vertical must be wedding, birthday, or community.');
  }

  const totalBudget = Number(obj.totalBudget);
  if (!Number.isFinite(totalBudget) || totalBudget < 200 || totalBudget > 10_000_000) {
    errors.push('Total budget must be between $200 and $10,000,000.');
  }

  const guestCount = Math.round(Number(obj.guestCount));
  if (!Number.isFinite(guestCount) || guestCount < 2 || guestCount > 50_000) {
    errors.push('Guest count must be between 2 and 50,000 attendees.');
  }

  const eventDate = sanitizeText(obj.eventDate, 32);
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    errors.push('Event date must be a valid YYYY-MM-DD date.');
  }

  const location = sanitizeText(obj.location, 120) || 'Metropolitan Venue';
  const setting = VALID_SETTINGS.has(obj.setting as VenueSetting)
    ? (obj.setting as VenueSetting)
    : 'hybrid';
  const priorities = sanitizeText(obj.priorities, 500);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      title,
      vertical,
      totalBudget: Math.round(totalBudget),
      guestCount,
      eventDate,
      location,
      setting,
      priorities,
    },
    errors: [],
  };
}

/**
 * Validates and sanitizes AI Co-Planner advisory prompts.
 */
export function validateAdviceRequest(raw: unknown): {
  valid: boolean;
  prompt?: string;
  vertical?: EventVertical;
  totalBudget?: number;
  guestCount?: number;
  setting?: VenueSetting;
  errors: string[];
} {
  if (!raw || typeof raw !== 'object' || !isSafeObject(raw)) {
    return { valid: false, errors: ['Invalid or unsafe advisory request payload.'] };
  }

  const obj = raw as Record<string, unknown>;
  const prompt = sanitizeText(obj.prompt, 600);
  if (!prompt || prompt.length < 4) {
    return {
      valid: false,
      errors: ['Please provide a planning question or scenario of at least 4 characters.'],
    };
  }

  const vertical = VALID_VERTICALS.has(obj.vertical as EventVertical)
    ? (obj.vertical as EventVertical)
    : 'wedding';
  const totalBudget = Number.isFinite(Number(obj.totalBudget))
    ? Math.max(200, Math.min(10_000_000, Math.round(Number(obj.totalBudget))))
    : 25000;
  const guestCount = Number.isFinite(Number(obj.guestCount))
    ? Math.max(2, Math.min(50_000, Math.round(Number(obj.guestCount))))
    : 100;
  const setting = VALID_SETTINGS.has(obj.setting as VenueSetting)
    ? (obj.setting as VenueSetting)
    : 'hybrid';

  return {
    valid: true,
    prompt,
    vertical,
    totalBudget,
    guestCount,
    setting,
    errors: [],
  };
}
