/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeCsvCell,
  isSafeObject,
  sanitizeText,
  validateAdviceRequest,
  validateBlueprintInput,
} from './security.ts';
import {
  calculateBudgetSummary,
  calculateReadinessMetrics,
  exportBudgetToCSV,
  generateContextualAIAdvice,
  generateDeterministicBlueprint,
  rebalanceBudget,
} from './plannerEngine.ts';

test('security: sanitizeText strips XSS script tags and event handlers cleanly', () => {
  const dirty = '  <script>alert("xss")</script><img src=x onerror=alert(1)>Garden Gala  ';
  assert.equal(sanitizeText(dirty), 'Garden Gala');
});

test('security: escapeCsvCell neutralizes spreadsheet formula injection', () => {
  assert.equal(escapeCsvCell('=CMD("calc")'), `"'=CMD(""calc"")"`);
  assert.equal(escapeCsvCell('+SUM(A1:A2)'), `"'+SUM(A1:A2)"`);
  assert.equal(escapeCsvCell('Venue Deposit'), `"Venue Deposit"`);
});

test('security: isSafeObject blocks prototype pollution payloads', () => {
  const malicious = JSON.parse('{"__proto__": {"polluted": true}}');
  assert.equal(isSafeObject(malicious), false);
  assert.equal(isSafeObject({ title: 'Safe Event', nested: { ok: true } }), true);
});

test('security: validateBlueprintInput enforces numeric and date boundaries', () => {
  const invalid = validateBlueprintInput({
    title: 'A',
    vertical: 'invalid_vertical',
    totalBudget: -500,
    guestCount: 0,
    eventDate: 'not-a-date',
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length, 5);

  const valid = validateBlueprintInput({
    title: 'Botanical Wedding',
    vertical: 'wedding',
    totalBudget: 35000,
    guestCount: 140,
    eventDate: '2027-06-15',
    location: 'San Francisco Conservatory',
    setting: 'outdoor',
    priorities: 'Zero-waste floral design',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.data?.totalBudget, 35000);
});

test('plannerEngine: calculateBudgetSummary computes accurate variance and per-guest costs', () => {
  const plan = generateDeterministicBlueprint({
    title: 'Community Arts Festival',
    vertical: 'community',
    totalBudget: 20000,
    guestCount: 500,
    eventDate: '2027-09-12',
    location: 'Civic Center Plaza',
    setting: 'outdoor',
    priorities: 'ADA stage ramps and local food trucks',
  });

  const summary = calculateBudgetSummary(plan);
  assert.equal(summary.totalBudget, 20000);
  assert.equal(summary.totalAllocated, 20000);
  assert.equal(summary.plannedPerGuest, 40);
  assert.equal(summary.healthStatus, 'Nominal');
});

test('plannerEngine: rebalanceBudget preserves locked items and scales unlocked items to exact target', () => {
  const initialItems = [
    {
      id: '1',
      category: 'Venue & Permits' as const,
      title: 'Locked Venue',
      allocated: 10000,
      actual: 10000,
      paid: 5000,
      isLocked: true,
      notes: '',
    },
    {
      id: '2',
      category: 'Catering & Beverage' as const,
      title: 'Flexible Catering',
      allocated: 6000,
      actual: 5000,
      paid: 0,
      isLocked: false,
      notes: '',
    },
    {
      id: '3',
      category: 'Decor & Floral' as const,
      title: 'Flexible Decor',
      allocated: 4000,
      actual: 3000,
      paid: 0,
      isLocked: false,
      notes: '',
    },
  ];

  // Rebalance from $20,000 down to $15,000 -> locked stays $10,000, unlocked scales to $5,000
  const rebalanced = rebalanceBudget(initialItems, 15000);
  assert.equal(rebalanced[0].allocated, 10000);
  const totalAfter = rebalanced.reduce((acc, item) => acc + item.allocated, 0);
  assert.equal(totalAfter, 15000);
  assert.equal(rebalanced[1].allocated, 3000);
  assert.equal(rebalanced[2].allocated, 2000);
});

test('plannerEngine: calculateReadinessMetrics tracks task completion and 4-point vendor compliance', () => {
  const plan = generateDeterministicBlueprint({
    title: 'Milestone 40th Birthday',
    vertical: 'birthday',
    totalBudget: 12000,
    guestCount: 60,
    eventDate: '2027-04-20',
    location: 'Skyline Terrace',
    setting: 'hybrid',
    priorities: 'Live jazz quartet',
  });

  const readiness = calculateReadinessMetrics(plan);
  assert.equal(readiness.totalTasks, 7);
  assert.equal(readiness.completedTasks, 2);
  assert.equal(readiness.fullyCompliantVendors, 2);
  assert.ok(readiness.overallReadinessScore > 0 && readiness.overallReadinessScore <= 100);
});

test('plannerEngine: generateContextualAIAdvice and CSV export work deterministically', () => {
  const plan = generateDeterministicBlueprint({
    title: 'Garden Wedding',
    vertical: 'wedding',
    totalBudget: 40000,
    guestCount: 120,
    eventDate: '2027-05-18',
    location: 'Botanical Pavilion',
    setting: 'outdoor',
    priorities: 'Rain backup and vegan menu',
  });

  const reqValidation = validateAdviceRequest({
    prompt: 'What if it rains on our outdoor ceremony?',
    vertical: 'wedding',
    totalBudget: 40000,
    guestCount: 120,
  });
  assert.equal(reqValidation.valid, true);

  const advice = generateContextualAIAdvice(reqValidation.prompt!, plan);
  assert.ok(advice.executiveSummary.includes('Weather Resilience Protocol'));
  assert.ok(advice.budgetAdjustments.length >= 2);

  const csv = exportBudgetToCSV(plan);
  assert.ok(csv.includes('"Category","Line Item"'));
});
