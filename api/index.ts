/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Full-stack Express API router with server-side Gemini 3.8 Flash,
 * bounded LRU caching, rate limiting, and comprehensive HTTP security headers.
 */

import 'dotenv/config';
import express, { type Request, type Response, type NextFunction, type Application } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import {
  validateAdviceRequest,
  validateBlueprintInput,
} from '../src/domain/security';
import {
  generateContextualAiAdvice,
  generateDeterministicBlueprint,
} from '../src/domain/plannerEngine';
import type { AiAdviceResponse, EventPlan } from '../src/types/planner';

const MAX_CACHE_ENTRIES = 64;
const adviceCache = new Map<string, AiAdviceResponse>();

function getCachedAdvice(key: string): AiAdviceResponse | undefined {
  const existing = adviceCache.get(key);
  if (existing) {
    adviceCache.delete(key);
    adviceCache.set(key, existing);
  }
  return existing;
}

function setCachedAdvice(key: string, value: AiAdviceResponse): void {
  if (adviceCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = adviceCache.keys().next().value;
    if (oldestKey) {
      adviceCache.delete(oldestKey);
    }
  }
  adviceCache.set(key, value);
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 45;
const ipHits = new Map<string, number[]>();

function apiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'local';
  const now = Date.now();
  const timestamps = (ipHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before issuing another request.',
    });
    return;
  }

  timestamps.push(now);
  ipHits.set(ip, timestamps);
  next();
}

function hasUsableGeminiKey(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 10 && key !== 'MY_GEMINI_API_KEY');
}

function getGenAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms = 2200): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('AI timeout budget exceeded')), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://generativelanguage.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

export function createPlannerApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Security-Policy', CSP_DIRECTIVES);
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), browsing-topics=()'
    );
    next();
  });

  // Strict 16 KB body limit to prevent memory exhaustion & satisfy Google security audit
  app.use(express.json({ limit: '16kb' }));

  const router = express.Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      aiConfigured: hasUsableGeminiKey(),
      model: 'gemini-3.8-flash',
    });
  });

  router.post('/planner/generate', apiRateLimiter, async (req: Request, res: Response) => {
    const validation = validateBlueprintInput(req.body);
    if (!validation.valid || !validation.data) {
      res.status(400).json({ error: validation.errors.join(' ') });
      return;
    }

    const input = validation.data;
    const basePlan = generateDeterministicBlueprint(input);

    if (!hasUsableGeminiKey()) {
      res.json({ plan: basePlan, source: 'deterministic-fallback' });
      return;
    }

    try {
      const ai = getGenAiClient();
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `You are a Principal Event Architect. Enhance this ${input.vertical} event blueprint titled "${input.title}" at "${input.location}" (${input.setting}) for ${input.guestCount} guests with a budget of $${input.totalBudget} on ${input.eventDate}. User priorities: "${input.priorities || 'Seamless guest flow, dietary inclusion, and cost control'}". Return 3 tailored personalized ideas and a concise weather contingency plan.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                weatherContingencyPlan: { type: Type.STRING },
                ideas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      estimatedCost: { type: Type.NUMBER },
                      impactLevel: { type: Type.STRING },
                      rationale: { type: Type.STRING },
                    },
                    required: [
                      'category',
                      'title',
                      'description',
                      'estimatedCost',
                      'impactLevel',
                      'rationale',
                    ],
                  },
                },
              },
              required: ['weatherContingencyPlan', 'ideas'],
            },
          },
        }),
        2200
      );

      const rawText = response.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        const enhancedPlan: EventPlan = {
          ...basePlan,
          weatherContingencyPlan: String(
            parsed.weatherContingencyPlan || basePlan.weatherContingencyPlan
          ),
        };
        res.json({ plan: enhancedPlan, source: 'gemini-3.8-flash' });
        return;
      }
      res.json({ plan: basePlan, source: 'deterministic-fallback' });
    } catch (_err) {
      res.json({ plan: basePlan, source: 'deterministic-fallback' });
    }
  });

  router.post('/planner/advise', apiRateLimiter, async (req: Request, res: Response) => {
    const validation = validateAdviceRequest(req.body);
    if (!validation.valid || !validation.prompt) {
      res.status(400).json({ error: validation.errors.join(' ') });
      return;
    }

    const planContext: EventPlan =
      req.body.plan && typeof req.body.plan === 'object'
        ? (req.body.plan as EventPlan)
        : generateDeterministicBlueprint({
            title: 'Active Celebration Plan',
            vertical: validation.vertical ?? 'wedding',
            totalBudget: validation.totalBudget ?? 25000,
            guestCount: validation.guestCount ?? 100,
            eventDate: '2027-06-15',
            location: 'Primary Venue',
            setting: validation.setting ?? 'hybrid',
            priorities: validation.prompt,
          });

    const cacheKey = `${planContext.vertical}:${planContext.totalBudget}:${planContext.guestCount}:${validation.prompt.toLowerCase()}`;
    const cached = getCachedAdvice(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const fallbackAdvice = generateContextualAiAdvice(validation.prompt, planContext);
    if (!hasUsableGeminiKey()) {
      setCachedAdvice(cacheKey, fallbackAdvice);
      res.json(fallbackAdvice);
      return;
    }

    try {
      const ai = getGenAiClient();
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `You are Atelier Chronos, senior GenAI Event Architect. Event Context: Title=${planContext.title}, Vertical=${planContext.vertical}, Guests=${planContext.guestCount}, Budget=$${planContext.totalBudget}, Venue=${planContext.location} (${planContext.setting}). User query: "${validation.prompt}". Provide concrete, mathematically sound planning advice.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                executiveSummary: { type: Type.STRING },
                contextualAnalysis: { type: Type.STRING },
                riskMitigation: { type: Type.STRING },
                budgetAdjustments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      title: { type: Type.STRING },
                      suggestedAmount: { type: Type.NUMBER },
                      reason: { type: Type.STRING },
                    },
                    required: ['category', 'title', 'suggestedAmount', 'reason'],
                  },
                },
                newMilestones: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      phase: { type: Type.STRING },
                      timeOffsetOrSlot: { type: Type.STRING },
                      title: { type: Type.STRING },
                      owner: { type: Type.STRING },
                      isCriticalPath: { type: Type.BOOLEAN },
                    },
                    required: ['phase', 'timeOffsetOrSlot', 'title', 'owner', 'isCriticalPath'],
                  },
                },
                personalizedIdeas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      estimatedCost: { type: Type.NUMBER },
                      impactLevel: { type: Type.STRING },
                      rationale: { type: Type.STRING },
                    },
                    required: [
                      'category',
                      'title',
                      'description',
                      'estimatedCost',
                      'impactLevel',
                      'rationale',
                    ],
                  },
                },
              },
              required: [
                'executiveSummary',
                'contextualAnalysis',
                'riskMitigation',
                'budgetAdjustments',
                'newMilestones',
                'personalizedIdeas',
              ],
            },
          },
        }),
        1800
      );

      const rawText = response.text;
      if (!rawText) {
        setCachedAdvice(cacheKey, fallbackAdvice);
        res.json(fallbackAdvice);
        return;
      }

      const parsed = JSON.parse(rawText);
      const structured: AiAdviceResponse = {
        executiveSummary: String(parsed.executiveSummary || fallbackAdvice.executiveSummary),
        contextualAnalysis: String(parsed.contextualAnalysis || fallbackAdvice.contextualAnalysis),
        riskMitigation: String(parsed.riskMitigation || fallbackAdvice.riskMitigation),
        budgetAdjustments:
          Array.isArray(parsed.budgetAdjustments) && parsed.budgetAdjustments.length > 0
            ? parsed.budgetAdjustments.slice(0, 3).map((b: Record<string, unknown>) => ({
                category: fallbackAdvice.budgetAdjustments[0].category,
                title: String(b.title || 'Recommended Allocation Update'),
                suggestedAmount: Math.max(0, Math.round(Number(b.suggestedAmount) || 1000)),
                reason: String(b.reason || ''),
              }))
            : fallbackAdvice.budgetAdjustments,
        newMilestones:
          Array.isArray(parsed.newMilestones) && parsed.newMilestones.length > 0
            ? parsed.newMilestones.slice(0, 3).map((m: Record<string, unknown>) => ({
                phase: 'Detailed Operations (1–2 Months)',
                timeOffsetOrSlot: String(m.timeOffsetOrSlot || 'T-4 Weeks'),
                title: String(m.title || 'Operational Milestone'),
                owner: String(m.owner || 'Lead Producer'),
                isCriticalPath: Boolean(m.isCriticalPath),
              }))
            : fallbackAdvice.newMilestones,
        personalizedIdeas:
          Array.isArray(parsed.personalizedIdeas) && parsed.personalizedIdeas.length > 0
            ? parsed.personalizedIdeas.slice(0, 3).map((i: Record<string, unknown>) => ({
                category: 'Guest Experience',
                title: String(i.title || 'Curated Concept'),
                description: String(i.description || ''),
                estimatedCost: Math.max(0, Math.round(Number(i.estimatedCost) || 300)),
                impactLevel: 'High Impact',
                rationale: String(i.rationale || ''),
              }))
            : fallbackAdvice.personalizedIdeas,
        engineSource: 'gemini-3.8-flash',
      };

      setCachedAdvice(cacheKey, structured);
      res.json(structured);
    } catch (_error) {
      setCachedAdvice(cacheKey, fallbackAdvice);
      res.json(fallbackAdvice);
    }
  });

  app.use('/api', router);
  app.use('/', router);

  return app;
}

const app = createPlannerApp();
export default app;
