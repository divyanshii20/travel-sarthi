import crypto from 'node:crypto';
import axios from 'axios';
import { and, eq } from 'drizzle-orm';
import { env } from '../../config/env';
import { db } from '../../config/database';
import { buildCacheKey, withCache } from '../../shared/cache';
import { ExternalServiceError, NotFoundError } from '../../shared/errors';
import { logger } from '../../shared/logger';
import {
  destinationPois,
  destinations,
  savedItineraries,
} from '../../db/schema/hotels';
import type {
  GenerateItineraryRequestDTO,
  Itinerary,
  ItineraryDay,
  ItinerarySlot,
} from '../../../../../travel-sarthi-shared-types/src';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

type NormalizedGenerateRequest = {
  destination: string;
  flyingFrom: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  budgetInr: number;
  travelStyle: string[];
  customPreferences: string;
  mode: 'A' | 'B';
};

type GeminiItineraryResponse = {
  destination: string;
  country: string;
  flag: string;
  trip_summary: {
    total_days: number;
    total_travelers: number;
    budget_tier: 'Budget' | 'Mid-range' | 'Luxury';
    estimated_total_inr: number;
    estimated_per_person_inr: number;
    best_currency: string;
    exchange_rate_note: string;
    weather_during_trip: string;
    language_tip: string;
    emergency_number: string;
    indian_embassy: string;
  };
  pre_trip_checklist: string[];
  days: Array<{
    day_number: number;
    date: string;
    day_label: string;
    theme: string;
    neighborhood_focus: string;
    weather_expected: string;
    slots: Array<{
      slot_id: string;
      time_start: string;
      time_end: string;
      duration_min: number;
      type: string;
      activity: string;
      location: string;
      transport_mode?: string;
      transport_detail?: string;
      distance_km?: number;
      cost_inr_per_person?: number;
      cost_inr_total?: number;
      notes?: string;
      tip?: string;
      booking_required?: boolean;
      booking_tip?: string;
      map_query?: string;
      highlights?: string[];
      photo_spot?: string;
      cuisine?: string;
      must_try?: string[];
      vegetarian_options?: boolean;
      why_now?: string;
    }>;
    day_budget_summary: {
      accommodation_inr: number;
      food_inr: number;
      transport_inr: number;
      activities_inr: number;
      misc_inr: number;
      day_total_inr: number;
      day_total_per_person_inr: number;
    };
    day_tips: string[];
  }>;
  hotels: Array<{
    name: string;
    area: string;
    tier: 'Budget' | 'Mid' | 'Luxury';
    why_here: string;
    price_inr_per_night: number;
    booking_platform: string;
    check_in_day: number;
    check_out_day: number;
    nights: number;
  }>;
  transport_summary: {
    airport_transfer_in?: { mode: string; cost_inr: number; duration_min?: number };
    airport_transfer_out?: { mode: string; cost_inr: number; duration_min?: number; depart_time?: string };
    day_passes: string[];
    app_downloads: string[];
  };
  budget_breakdown: {
    flights_inr: number;
    accommodation_total_inr: number;
    food_total_inr: number;
    transport_local_inr: number;
    activities_inr: number;
    shopping_buffer_inr: number;
    visa_fee_inr: number;
    misc_contingency_inr: number;
    grand_total_inr: number;
    per_person_inr: number;
    vs_budget: 'under' | 'within' | 'slightly over' | 'over';
    savings_tips: string[];
  };
  experiences_by_category: {
    must_do: string[];
    food_trail: string[];
    off_beaten_path: string[];
    splurge_if_possible: string[];
    skip: string[];
  };
  day_trips: Array<{
    name: string;
    distance_km: number;
    duration_hours: number;
    transport: string;
    best_day: string;
    cost_inr_per_person: number;
    highlights: string[];
  }>;
  cultural_guide: {
    dos: string[];
    donts: string[];
    scams_to_avoid: string[];
    indian_specific: string[];
  };
  packing_list: {
    essentials: string[];
    clothing: string[];
    health: string[];
    tech: string[];
  };
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GEMINI CLIENT — multi-model auto-fallback
   Google frequently renames / removes free-tier models. This helper tries
   the configured GEMINI_MODEL first, then walks down a list of known-good
   names if it returns 404. The first successful name is cached so we
   don't pay the per-request retry cost after the first call.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const GEMINI_MODEL_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview-05-20',
  'gemini-flash-latest',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-8b-latest',
];

let cachedWorkingGeminiModel: string | null = null;

async function callGeminiWithFallback(prompt: string): Promise<GeminiItineraryResponse> {
  const candidates: string[] = [];
  if (cachedWorkingGeminiModel) candidates.push(cachedWorkingGeminiModel);
  if (env.GEMINI_MODEL && !candidates.includes(env.GEMINI_MODEL)) candidates.push(env.GEMINI_MODEL);
  for (const m of GEMINI_MODEL_FALLBACKS) if (!candidates.includes(m)) candidates.push(m);

  let lastError: unknown = new Error('No Gemini model attempted');

  for (const model of candidates) {
    const t0 = Date.now();
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 16000,
            responseMimeType: 'application/json',
          },
        },
        { timeout: 25000 }, // 25s — fail fast so we can fall through to Groq
      );

      const candidate = response.data?.candidates?.[0];
      const finishReason = candidate?.finishReason;
      const text = candidate?.content?.parts?.[0]?.text;

      if (typeof text !== 'string' || text.trim().length === 0) {
        throw new Error(`Gemini returned an empty payload (finishReason: ${finishReason})`);
      }
      if (finishReason === 'MAX_TOKENS') {
        logger.warn({ model, textLength: text.length }, 'Gemini hit token limit — JSON may be truncated');
      }

      const parsed = JSON.parse(text) as GeminiItineraryResponse;
      validateGeminiResponse(parsed);

      // Success — cache the working model name
      if (cachedWorkingGeminiModel !== model) {
        logger.info({ model, finishReason, ms: Date.now() - t0 }, 'Gemini model worked — caching');
        cachedWorkingGeminiModel = model;
      }
      return parsed;
    } catch (err) {
      lastError = err;
      const status = axios.isAxiosError(err) ? err.response?.status : null;
      const code = axios.isAxiosError(err) ? err.code : null;
      const elapsed = Date.now() - t0;
      // 404 = model name not available → try next.
      // Other errors (429, 500, timeout, etc.) → bail to Groq immediately.
      if (status === 404) {
        logger.warn({ model, status, ms: elapsed }, 'Gemini model not found — trying next');
        if (cachedWorkingGeminiModel === model) cachedWorkingGeminiModel = null;
        continue;
      }
      logger.warn({ model, status, code, ms: elapsed }, 'Gemini failed (non-404) — bailing to Groq');
      throw err;
    }
  }
  throw lastError;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GROQ CLIENT (Llama 3.1 70B — lightweight tasks)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

async function callGroq(systemPrompt: string, userPrompt: string, maxTokens = 200): Promise<string> {
  if (env.GROQ_API_KEY === 'placeholder' || env.GROQ_API_KEY.trim().length === 0) return '';
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: maxTokens,
      },
      {
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 10000,
      },
    );
    return (res.data?.choices?.[0]?.message?.content ?? '').trim();
  } catch (err) {
    logger.warn({ err }, 'Groq call failed');
    return '';
  }
}

// Groq sometimes deprecates models too — keep a small fallback list.
const GROQ_MODEL_FALLBACKS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
];

async function callGroqForItinerary(prompt: string): Promise<GeminiItineraryResponse> {
  if (env.GROQ_API_KEY === 'placeholder' || env.GROQ_API_KEY.trim().length === 0) {
    throw new Error('Groq API key not configured');
  }
  let lastError: unknown = new Error('No Groq model attempted');

  for (const model of GROQ_MODEL_FALLBACKS) {
    const t0 = Date.now();
    try {
      logger.info({ model }, 'Groq attempt');
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an elite travel architect. You MUST respond with ONLY valid JSON — no markdown, no explanation, no code blocks. Output the raw JSON object directly.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 8192,
          response_format: { type: 'json_object' },
        },
        {
          headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          timeout: 45000, // 45s, not 120s — fail fast
        },
      );
      const text = (res.data?.choices?.[0]?.message?.content ?? '').trim();
      if (text.length === 0) throw new Error('Groq returned empty itinerary');
      const parsed = JSON.parse(text) as GeminiItineraryResponse;
      logger.info({ model, ms: Date.now() - t0, bytes: text.length }, 'Groq success');
      return parsed;
    } catch (err) {
      lastError = err;
      const status = axios.isAxiosError(err) ? err.response?.status : null;
      const code = axios.isAxiosError(err) ? err.code : null;
      const data = axios.isAxiosError(err) ? err.response?.data : null;
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ model, status, code, msg, data, ms: Date.now() - t0 }, 'Groq attempt failed');
      // 401/403 = bad key → no point trying other models
      if (status === 401 || status === 403) throw err;
      // 404/400 → model deprecated, try next
      // Otherwise (timeout, 5xx) → try next anyway
    }
  }
  throw lastError;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PUBLIC API
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export async function generateItinerary(
  dto: GenerateItineraryRequestDTO | Record<string, unknown>,
  userId: string,
): Promise<Itinerary> {
  const normalized = normalizeRequest(dto);
  const requestHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')
    .slice(0, 24);

  const cacheKey = buildCacheKey('itinerary-elite', userId, requestHash);

  return withCache(cacheKey, 86400, async () => {
    const destinationContext = await getDestinationContext(normalized.destination);
    const prompt = buildElitePrompt(normalized, destinationContext);

    let parsed: GeminiItineraryResponse;
    try {
      parsed = await callGeminiWithFallback(prompt);
    } catch (error) {
      const geminiStatus = axios.isAxiosError(error) ? error.response?.status : null;
      const geminiData = axios.isAxiosError(error) ? error.response?.data : null;
      logger.warn({ geminiStatus, geminiData }, 'Gemini failed — attempting Groq fallback');

      // Fallback to Groq (Llama 3.3 70B) when Gemini is rate-limited or unavailable
      try {
        logger.info('Generating itinerary via Groq fallback');
        const groqPrompt = buildGroqCompactPrompt(normalized, destinationContext);
        parsed = await callGroqForItinerary(groqPrompt);
        validateGeminiResponse(parsed);
        logger.info('Groq fallback succeeded');
      } catch (groqError) {
        const groqMsg = groqError instanceof Error ? groqError.message : String(groqError);
        const groqStatus = axios.isAxiosError(groqError) ? groqError.response?.status : null;
        const groqData = axios.isAxiosError(groqError) ? groqError.response?.data : null;
        const keyConfigured = env.GROQ_API_KEY !== 'placeholder' && env.GROQ_API_KEY.trim().length > 0;
        logger.error(
          { geminiStatus, groqMsg, groqStatus, groqData, groqKeyConfigured: keyConfigured },
          'Both Gemini and Groq failed for itinerary generation',
        );
        const userMsg = !keyConfigured
          ? 'AI service quota exhausted. Add a free GROQ_API_KEY to .env (https://console.groq.com/keys) to enable fallback.'
          : 'Unable to generate itinerary — AI services unavailable. Please try again in a moment.';
        throw new ExternalServiceError('AI', userMsg);
      }
    }

    const itinerary = await transformGeminiResponse(parsed, normalized, destinationContext);

    // Generate premium title via Groq
    const groqTitle = await callGroq(
      'You generate catchy, premium travel itinerary titles. Return ONLY the title text, nothing else. Max 8 words.',
      `${itinerary.durationDays}-day trip to ${parsed.destination}, ${parsed.country} for ${normalized.adults + normalized.children} travelers. Style: ${normalized.travelStyle.join(', ')}. Budget tier: ${parsed.trip_summary.budget_tier}.`,
      50,
    );
    if (groqTitle.length > 3) {
      itinerary.title = groqTitle.replace(/^["']|["']$/g, '');
    }

    const [savedRow] = await db.insert(savedItineraries).values({
      userId,
      destinationId: destinationContext?.id ?? null,
      title: itinerary.title,
      durationDays: itinerary.durationDays,
      travelers: normalized.adults + normalized.children,
      budgetInr: normalized.budgetInr,
      itineraryJson: itinerary,
      mode: normalized.mode,
    }).returning({ id: savedItineraries.id });

    if (savedRow != null) {
      itinerary.id = savedRow.id;
    }

    return itinerary;
  });
}

export async function getSavedItinerary(id: string, userId: string): Promise<Itinerary> {
  const [row] = await db
    .select()
    .from(savedItineraries)
    .where(and(eq(savedItineraries.id, id), eq(savedItineraries.userId, userId)))
    .limit(1);

  if (row == null) {
    throw new NotFoundError('Saved itinerary');
  }

  return row.itineraryJson as Itinerary;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   NORMALIZE REQUEST
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function normalizeRequest(input: GenerateItineraryRequestDTO | Record<string, unknown>): NormalizedGenerateRequest {
  const record = input as Record<string, unknown>;

  const adults = Number(record.adults ?? (record.travelers as { adults?: number } | undefined)?.adults ?? 1);
  const children = Number(record.children ?? (record.travelers as { children?: number } | undefined)?.children ?? 0);
  const travelStyle = Array.isArray(record.travel_style)
    ? record.travel_style.map(String)
    : Array.isArray(record.style)
      ? record.style.map(String)
      : ['cultural'];

  return {
    destination: String(record.destination ?? '').trim(),
    flyingFrom: String(record.flying_from ?? (record.flightInfo as { origin?: string } | undefined)?.origin ?? '').trim(),
    departureDate: String(record.departure_date ?? record.startDate ?? '').trim(),
    returnDate: String(record.return_date ?? record.endDate ?? '').trim(),
    adults: Number.isFinite(adults) && adults > 0 ? adults : 1,
    children: Number.isFinite(children) && children >= 0 ? children : 0,
    budgetInr: Number(record.budget_inr ?? record.budgetTotal ?? 0),
    travelStyle: travelStyle.length > 0 ? travelStyle : ['cultural'],
    customPreferences: String(record.custom_preferences ?? (record.mustInclude as string[] | undefined)?.join(', ') ?? '').trim(),
    mode: String(record.mode ?? 'A') === 'B' ? 'B' : 'A',
  };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DESTINATION CONTEXT FROM DB
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

async function getDestinationContext(destinationName: string) {
  const slugGuess = destinationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const [destination] = await db
    .select()
    .from(destinations)
    .where(eq(destinations.slug, slugGuess))
    .limit(1);

  const resolvedDestination = destination
    ?? (await db.select().from(destinations).where(eq(destinations.name, destinationName)).limit(1))[0]
    ?? null;

  if (resolvedDestination == null) return null;

  const pois = await db
    .select()
    .from(destinationPois)
    .where(eq(destinationPois.destinationId, resolvedDestination.id))
    .limit(18);

  return {
    ...resolvedDestination,
    pois: pois.map((poi) => ({
      name: poi.name,
      category: poi.category,
      avgVisitHours: poi.avgVisitHours != null ? Number(poi.avgVisitHours) : null,
      entryFeeInr: poi.entryFeeInr,
      bestTimeOfDay: poi.bestTimeOfDay,
      openingHours: poi.openingHours,
      priority: poi.priority,
      description: poi.description,
    })),
  };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   WORLD-CLASS SYSTEM PROMPT (Gemini)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function buildGroqCompactPrompt(request: NormalizedGenerateRequest, destinationContext: Awaited<ReturnType<typeof getDestinationContext>>): string {
  const durationDays = getDurationDays(request.departureDate, request.returnDate);
  const totalTravelers = request.adults + request.children;

  return `Create a ${durationDays}-day travel itinerary for ${request.destination} for ${totalTravelers} travelers (${request.adults} adults${request.children > 0 ? `, ${request.children} children` : ''}).
Budget: INR ${request.budgetInr}. Style: ${request.travelStyle.join(', ')}. Dates: ${request.departureDate} to ${request.returnDate}.
${request.customPreferences ? `Special requests: ${request.customPreferences}` : ''}
${destinationContext ? `Currency: ${destinationContext.currency}. Timezone: ${destinationContext.timezoneName}.` : ''}

Return ONLY a JSON object with this structure:
{
  "destination": "city name",
  "country": "country name",
  "flag": "🏳",
  "trip_summary": { "total_days": ${durationDays}, "total_travelers": ${totalTravelers}, "budget_tier": "Budget|Mid-range|Luxury", "estimated_total_inr": 0, "estimated_per_person_inr": 0, "best_currency": "USD", "exchange_rate_note": "1 USD ≈ ₹83", "weather_during_trip": "hot", "language_tip": "tip", "emergency_number": "911", "indian_embassy": "address" },
  "pre_trip_checklist": ["passport", "visa"],
  "days": [
    {
      "day_number": 1,
      "date": "${request.departureDate}",
      "day_label": "Arrival Day",
      "theme": "theme",
      "neighborhood_focus": "area",
      "weather_expected": "sunny",
      "slots": [
        { "slot_id": "d1_s1", "time_start": "14:00", "time_end": "16:00", "duration_min": 120, "type": "sightseeing", "activity": "activity name", "location": "Specific Place Name, District", "transport_mode": "taxi", "transport_detail": "Taxi from airport", "distance_km": 5, "cost_inr_per_person": 500, "cost_inr_total": 1000, "notes": "note", "tip": "pro tip", "booking_required": false, "booking_tip": "", "map_query": "Place Name City", "highlights": ["highlight"], "photo_spot": "spot", "cuisine": null, "must_try": [], "vegetarian_options": true, "why_now": "reason" }
      ],
      "day_budget_summary": { "accommodation_inr": 0, "food_inr": 0, "transport_inr": 0, "activities_inr": 0, "misc_inr": 0, "day_total_inr": 0, "day_total_per_person_inr": 0 },
      "day_tips": ["tip"]
    }
  ],
  "hotels": [{ "name": "Hotel Name", "area": "area", "tier": "Mid", "why_here": "reason", "price_inr_per_night": 3000, "booking_platform": "Booking.com", "check_in_day": 1, "check_out_day": ${durationDays}, "nights": ${durationDays - 1} }],
  "transport_summary": { "airport_transfer_in": { "mode": "taxi", "cost_inr": 800, "duration_min": 30 }, "airport_transfer_out": { "mode": "taxi", "cost_inr": 800, "duration_min": 30, "depart_time": "10:00" }, "day_passes": [], "app_downloads": ["Uber"] },
  "budget_breakdown": { "flights_inr": 0, "accommodation_total_inr": 0, "food_total_inr": 0, "transport_local_inr": 0, "activities_inr": 0, "shopping_buffer_inr": 0, "visa_fee_inr": 0, "misc_contingency_inr": 0, "grand_total_inr": 0, "per_person_inr": 0, "vs_budget": "within", "savings_tips": ["tip"] },
  "experiences_by_category": { "must_do": [], "food_trail": [], "off_beaten_path": [], "splurge_if_possible": [], "skip": [] },
  "day_trips": [],
  "cultural_guide": { "dos": [], "donts": [], "scams_to_avoid": [], "indian_specific": [] },
  "packing_list": { "essentials": [], "clothing": [], "health": [], "tech": [] }
}

Fill all ${durationDays} days with 4-5 real slots each. Use real place names. Keep costs in INR. Be concise but accurate.`;
}

function buildElitePrompt(request: NormalizedGenerateRequest, destinationContext: Awaited<ReturnType<typeof getDestinationContext>>) {
  const durationDays = getDurationDays(request.departureDate, request.returnDate);
  const totalTravelers = request.adults + request.children;
  const budgetPerPersonPerDay = totalTravelers > 0 && durationDays > 0
    ? Math.round(request.budgetInr / totalTravelers / durationDays)
    : request.budgetInr;

  const destinationSummary = destinationContext == null
    ? 'No curated destination data available. Use your comprehensive travel knowledge.'
    : [
      `=== DESTINATION INTELLIGENCE ===`,
      `${destinationContext.name}, ${destinationContext.country} (${destinationContext.flagEmoji ?? ''})`,
      `Visa: ${destinationContext.visaStatus ?? 'check'} | Safety: ${destinationContext.safetyScore}/100 | Weather: ${destinationContext.weatherScore}/100`,
      `Budget tiers INR/day: budget=${destinationContext.budgetPerDay ?? '?'}, mid=${destinationContext.budgetMidPerDay ?? '?'}, luxury=${destinationContext.budgetLuxuryPerDay ?? '?'}`,
      `Best months: [${(destinationContext.bestMonths ?? []).join(',')}] | Avoid: [${(destinationContext.avoidMonths ?? []).join(',')}]`,
      `Direct flights from: ${(destinationContext.directFlightCities ?? []).join(', ') || 'none listed'}`,
      `Weather: ${destinationContext.weatherSummary ?? 'n/a'}`,
      `Currency: ${destinationContext.currency} | Timezone: ${destinationContext.timezoneName}`,
      destinationContext.pois.length > 0
        ? `Top POIs:\n${destinationContext.pois.map((p) => `  • ${p.name} (${p.category ?? 'General'}) — ${p.avgVisitHours ?? '?'}h visit, ₹${p.entryFeeInr ?? 0} entry, best: ${p.bestTimeOfDay ?? 'any'}`).join('\n')}`
        : '',
    ].filter(Boolean).join('\n');

  return `You are the world's #1 elite travel architect for Indian travelers. You have visited every destination personally. You know every hidden alley, the best local restaurant that tourists never find, the exact time to visit each monument to avoid crowds, and the cultural nuances that transform a good trip into an unforgettable journey.

=== YOUR EXPERTISE ===
• Deep knowledge of every destination's neighborhoods, zones, and micro-regions
• Expert at geographic clustering — you NEVER schedule activities that require unnecessary backtracking
• Cultural intelligence — you understand what Indian travelers specifically need (vegetarian options, spice levels, language barriers, safety concerns, tipping customs, dress codes)
• Budget mastery — you know real costs in INR with uncanny accuracy
• Seasonal intelligence — you know weather patterns, festival calendars, peak/off-peak dynamics
• Insider knowledge — you know the photo spots nobody talks about, the restaurants where locals eat, the shortcuts that save hours

=== PLANNING RULES (NON-NEGOTIABLE) ===
1. GEOGRAPHIC CLUSTERING: Group activities by neighborhood/zone. Morning in one area, afternoon in an adjacent one. Never zigzag across the city.
2. REALISTIC PACING: Max 4-5 major activities per day. Include transit buffer time between activities. Meals are experiences, not interruptions — allocate 45-90 min.
3. TIME-OF-DAY INTELLIGENCE: Temples/monuments → morning (cooler, fewer crowds). Markets/shopping → afternoon. Food tours/nightlife → evening. Sunrise/sunset spots at the right time.
4. CHILDREN AWARENESS: If children are present, slow the pace by 30%. Add child-friendly activities. Include rest/nap breaks mid-afternoon. Avoid very long walks.
5. FIRST & LAST DAY: Day 1 = arrival, check-in, light exploration nearby. Last day = checkout, last-minute shopping, airport transfer. Never overpack these days.
6. COSTS IN INR: Every cost must be in Indian Rupees. Be precise — entry fees, meal costs, transport fares. Include tipping guidelines.
7. VEGETARIAN INTELLIGENCE: Always mention vegetarian options. For each restaurant, note if veg-friendly. For countries with limited veg options, provide survival strategies.
8. BOOKING INTELLIGENCE: Flag what MUST be pre-booked (skip-the-line tickets, popular restaurants, sunrise permits) vs what can be done on-the-spot.
9. SAFETY-FIRST: Note areas to avoid at night, common tourist scams, emergency contacts, nearest Indian embassy.
10. TRANSPORT LOGIC: Recommend the BEST transport mode for each leg (walk if <1km, metro/bus for 1-5km, taxi/cab for 5km+). Name specific metro lines, bus numbers, or ride-hailing apps.

=== TRIP DETAILS ===
Destination: ${request.destination}
Flying from: ${request.flyingFrom || 'India (city not specified)'}
Dates: ${request.departureDate} → ${request.returnDate} (${durationDays} days)
Travelers: ${request.adults} adults${request.children > 0 ? `, ${request.children} children` : ''}
Total budget: ₹${request.budgetInr.toLocaleString('en-IN')} (₹${budgetPerPersonPerDay.toLocaleString('en-IN')}/person/day)
Travel style: ${request.travelStyle.join(', ')}
${request.customPreferences ? `Special requests: ${request.customPreferences}` : ''}

${destinationSummary}

=== OUTPUT FORMAT ===
Return ONLY valid JSON. Use snake_case keys. Follow this exact structure:

${JSON.stringify({
  destination: 'string',
  country: 'string',
  flag: 'emoji',
  trip_summary: {
    total_days: durationDays,
    total_travelers: totalTravelers,
    budget_tier: 'Budget | Mid-range | Luxury',
    estimated_total_inr: 0,
    estimated_per_person_inr: 0,
    best_currency: 'string',
    exchange_rate_note: '1 USD ≈ ₹83 (example)',
    weather_during_trip: 'string',
    language_tip: 'string',
    emergency_number: 'string',
    indian_embassy: 'string',
  },
  pre_trip_checklist: ['item1', 'item2'],
  days: [{
    day_number: 1,
    date: request.departureDate,
    day_label: 'Arrival & First Impressions',
    theme: 'string',
    neighborhood_focus: 'string',
    weather_expected: 'string',
    slots: [{
      slot_id: 'd1_s1',
      time_start: '14:00',
      time_end: '15:30',
      duration_min: 90,
      type: 'travel | sightseeing | food | shopping | wellness | adventure | cultural | nightlife | rest | transport',
      activity: 'string',
      location: 'Specific place name, Area/District',
      transport_mode: 'walk | metro | bus | taxi | auto | tuk-tuk | ferry | train | flight | cable-car | bicycle',
      transport_detail: 'Take Metro Line X to Station Y (15 min)',
      distance_km: 0,
      cost_inr_per_person: 0,
      cost_inr_total: 0,
      notes: 'string',
      tip: 'insider tip or pro-tip',
      booking_required: false,
      booking_tip: 'string',
      map_query: 'Google Maps searchable name',
      highlights: ['highlight1'],
      photo_spot: 'string',
      cuisine: 'string or null',
      must_try: ['dish1'],
      vegetarian_options: true,
      why_now: 'why this time of day is perfect',
    }],
    day_budget_summary: { accommodation_inr: 0, food_inr: 0, transport_inr: 0, activities_inr: 0, misc_inr: 0, day_total_inr: 0, day_total_per_person_inr: 0 },
    day_tips: ['tip1'],
  }],
  hotels: [{ name: 'string', area: 'string', tier: 'Budget | Mid | Luxury', why_here: 'string', price_inr_per_night: 0, booking_platform: 'string', check_in_day: 1, check_out_day: 2, nights: 1 }],
  transport_summary: { airport_transfer_in: { mode: 'string', cost_inr: 0, duration_min: 0 }, airport_transfer_out: { mode: 'string', cost_inr: 0, duration_min: 0, depart_time: 'string' }, day_passes: ['string'], app_downloads: ['string'] },
  budget_breakdown: { flights_inr: 0, accommodation_total_inr: 0, food_total_inr: 0, transport_local_inr: 0, activities_inr: 0, shopping_buffer_inr: 0, visa_fee_inr: 0, misc_contingency_inr: 0, grand_total_inr: 0, per_person_inr: 0, vs_budget: 'within', savings_tips: ['string'] },
  experiences_by_category: { must_do: ['string'], food_trail: ['string'], off_beaten_path: ['string'], splurge_if_possible: ['string'], skip: ['string'] },
  day_trips: [{ name: 'string', distance_km: 0, duration_hours: 0, transport: 'string', best_day: 'string', cost_inr_per_person: 0, highlights: ['string'] }],
  cultural_guide: { dos: ['string'], donts: ['string'], scams_to_avoid: ['string'], indian_specific: ['string'] },
  packing_list: { essentials: ['string'], clothing: ['string'], health: ['string'], tech: ['string'] },
})}

IMPORTANT: For each slot's "location" field, use a specific, Google-searchable place name (e.g., "Senso-ji Temple, Asakusa" not just "temple"). This is used to resolve real GPS data via Google Places API after your response.

Now create the ultimate ${durationDays}-day itinerary for ${request.destination}. Make it extraordinary.`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VALIDATE GEMINI RESPONSE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function validateGeminiResponse(payload: GeminiItineraryResponse) {
  if (!Array.isArray(payload.days) || payload.days.length === 0) {
    throw new Error('Itinerary must contain at least one day');
  }
  for (const day of payload.days) {
    if (!Array.isArray(day.slots) || day.slots.length === 0) {
      throw new Error(`Day ${day.day_number} has no slots`);
    }
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TRANSFORM GEMINI → ITINERARY
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

async function transformGeminiResponse(
  payload: GeminiItineraryResponse,
  request: NormalizedGenerateRequest,
  destinationContext: Awaited<ReturnType<typeof getDestinationContext>>,
): Promise<Itinerary> {
  const heroImage = destinationContext?.heroImageUrl ?? null;

  const days: ItineraryDay[] = payload.days.map((day) => {
    const slots: ItinerarySlot[] = day.slots.map((slot) => ({
      slotId: slot.slot_id,
      timeStart: slot.time_start,
      timeEnd: slot.time_end,
      durationMin: slot.duration_min,
      type: slot.type,
      activity: slot.activity,
      location: slot.location,
      transportMode: slot.transport_mode,
      transportDetail: slot.transport_detail,
      distanceKm: slot.distance_km,
      costInrPerPerson: slot.cost_inr_per_person,
      costInrTotal: slot.cost_inr_total,
      notes: slot.notes,
      tip: slot.tip,
      bookingRequired: slot.booking_required,
      bookingTip: slot.booking_tip,
      mapQuery: slot.map_query,
      highlights: slot.highlights,
      photoSpot: slot.photo_spot,
      cuisine: slot.cuisine,
      mustTry: slot.must_try,
      vegetarianOptions: slot.vegetarian_options,
      whyNow: slot.why_now,
    }));

    return {
      dayNumber: day.day_number,
      date: day.date,
      city: payload.destination,
      country: payload.country,
      heroImage: { url: heroImage ?? '', alt: `${payload.destination} day ${day.day_number}` },
      weather: null,
      activities: [],
      connectors: [],
      totalEstimatedCost: {
        amount: day.day_budget_summary.day_total_inr,
        currency: 'INR',
        formatted: `₹${day.day_budget_summary.day_total_inr.toLocaleString('en-IN')}`,
      },
      notes: null,
      dayLabel: day.day_label,
      theme: day.theme,
      neighborhoodFocus: day.neighborhood_focus,
      weatherExpected: day.weather_expected,
      slots,
      dayBudgetSummary: {
        accommodationInr: day.day_budget_summary.accommodation_inr,
        foodInr: day.day_budget_summary.food_inr,
        transportInr: day.day_budget_summary.transport_inr,
        activitiesInr: day.day_budget_summary.activities_inr,
        miscInr: day.day_budget_summary.misc_inr,
        dayTotalInr: day.day_budget_summary.day_total_inr,
        dayTotalPerPersonInr: day.day_budget_summary.day_total_per_person_inr,
      },
      dayTips: day.day_tips,
    };
  });

  const itinerary: Itinerary = {
    id: crypto.randomUUID(),
    tripId: '',
    title: `${payload.destination} ${days.length}-Day Itinerary`,
    destination: payload.destination,
    country: payload.country,
    flag: payload.flag,
    startDate: request.departureDate,
    endDate: request.returnDate,
    durationDays: payload.trip_summary.total_days,
    days,
    budgetBreakdown: {
      flights: money(payload.budget_breakdown.flights_inr),
      accommodation: money(payload.budget_breakdown.accommodation_total_inr),
      food: money(payload.budget_breakdown.food_total_inr),
      activities: money(payload.budget_breakdown.activities_inr),
      transport: money(payload.budget_breakdown.transport_local_inr),
      shopping: money(payload.budget_breakdown.shopping_buffer_inr),
      miscellaneous: money(payload.budget_breakdown.misc_contingency_inr),
      total: money(payload.budget_breakdown.grand_total_inr),
      totalWithCoupons: money(payload.budget_breakdown.grand_total_inr),
      totalSavings: money(0),
      visaFee: money(payload.budget_breakdown.visa_fee_inr),
      shoppingBuffer: money(payload.budget_breakdown.shopping_buffer_inr),
      grandTotal: money(payload.budget_breakdown.grand_total_inr),
      perPerson: money(payload.budget_breakdown.per_person_inr),
      vsBudget: payload.budget_breakdown.vs_budget,
      savingsTips: payload.budget_breakdown.savings_tips,
    },
    generatedAt: new Date().toISOString(),
    generatedBy: 'ai',
    version: 2,
    isPublic: false,
    shareToken: null,
    mode: request.mode,
    heroImage,
    tripSummary: {
      totalDays: payload.trip_summary.total_days,
      totalTravelers: payload.trip_summary.total_travelers,
      budgetTier: payload.trip_summary.budget_tier,
      estimatedTotalInr: payload.trip_summary.estimated_total_inr,
      estimatedPerPersonInr: payload.trip_summary.estimated_per_person_inr,
      bestCurrency: payload.trip_summary.best_currency,
      exchangeRateNote: payload.trip_summary.exchange_rate_note,
      weatherDuringTrip: payload.trip_summary.weather_during_trip,
      languageTip: payload.trip_summary.language_tip,
      emergencyNumber: payload.trip_summary.emergency_number,
      indianEmbassy: payload.trip_summary.indian_embassy,
    },
    preTripChecklist: payload.pre_trip_checklist,
    hotels: payload.hotels.map((hotel) => ({
      name: hotel.name,
      area: hotel.area,
      tier: hotel.tier,
      whyHere: hotel.why_here,
      priceInrPerNight: hotel.price_inr_per_night,
      bookingPlatform: hotel.booking_platform,
      checkInDay: hotel.check_in_day,
      checkOutDay: hotel.check_out_day,
      nights: hotel.nights,
    })),
    transportSummary: {
      airportTransferIn: payload.transport_summary.airport_transfer_in,
      airportTransferOut: payload.transport_summary.airport_transfer_out,
      dayPasses: payload.transport_summary.day_passes,
      appDownloads: payload.transport_summary.app_downloads,
    },
    experiencesByCategory: {
      mustDo: payload.experiences_by_category.must_do,
      foodTrail: payload.experiences_by_category.food_trail,
      offBeatenPath: payload.experiences_by_category.off_beaten_path,
      splurgeIfPossible: payload.experiences_by_category.splurge_if_possible,
      skip: payload.experiences_by_category.skip,
    },
    dayTrips: payload.day_trips,
    culturalGuide: {
      dos: payload.cultural_guide.dos,
      donts: payload.cultural_guide.donts,
      scamsToAvoid: payload.cultural_guide.scams_to_avoid,
      indianSpecific: payload.cultural_guide.indian_specific,
    },
    packingList: payload.packing_list,
  };

  // Phase 2: Enrich with Google APIs (real distances, addresses, Maps URLs)
  await enrichItineraryWithGoogleSignals(itinerary, payload.destination, payload.country);

  return itinerary;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GOOGLE API ENRICHMENT (Phase 2 — Factual Data)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

async function enrichItineraryWithGoogleSignals(itinerary: Itinerary, destination: string, country: string) {
  if (env.GOOGLE_PLACES_API_KEY === 'placeholder' || env.GOOGLE_PLACES_API_KEY.trim().length === 0) {
    logger.info('Google Places API key not set — skipping enrichment');
    return;
  }

  // Step 1: Geocode destination city for location bias
  const cityGeo = await geocodeDestination(destination, country);

  for (const day of itinerary.days) {
    if (day.slots == null || day.slots.length === 0) continue;

    // Step 2: Resolve all slot locations via Google Places (parallel within day)
    const resolvedPlaces = await Promise.all(
      day.slots.map((slot: ItinerarySlot) =>
        resolvePlaceEnhanced(`${slot.location}, ${destination}, ${country}`, cityGeo),
      ),
    );

    // Step 3: Fill place data into slots + compute distance legs
    for (let i = 0; i < day.slots.length; i++) {
      const slot = day.slots[i];
      const resolved = resolvedPlaces[i];
      if (slot == null || resolved == null) continue;

      // Fill Google data
      slot.mapQuery = resolved.mapsUrl ?? slot.mapQuery;
      if (slot.notes == null || slot.notes.length === 0) {
        slot.notes = resolved.address;
      }

      // Step 4: Distance Matrix for consecutive slots
      const nextResolved = resolvedPlaces[i + 1];
      const nextSlot = day.slots[i + 1];
      if (nextResolved == null || nextSlot == null) continue;

      const transportMode = mapTransportMode(nextSlot.transportMode);
      const leg = await getDistanceMatrixWithMode(resolved.placeId, nextResolved.placeId, transportMode);
      if (leg == null) continue;

      nextSlot.distanceKm = leg.distanceKm;
      nextSlot.transportDetail = `${leg.durationMin} min by ${transportMode} (${leg.distanceKm} km)`;
    }

    // Small delay between days to respect rate limits
    await new Promise((r) => setTimeout(r, 200));
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GOOGLE API HELPERS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

async function geocodeDestination(destination: string, country: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address: `${destination}, ${country}`, key: env.GOOGLE_PLACES_API_KEY },
      timeout: 10000,
    });
    const loc = res.data?.results?.[0]?.geometry?.location;
    if (loc == null) return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

async function resolvePlaceEnhanced(query: string, locationBias?: { lat: number; lng: number } | null) {
  try {
    const params: Record<string, string> = {
      input: query,
      inputtype: 'textquery',
      fields: 'place_id,name,formatted_address,geometry',
      key: env.GOOGLE_PLACES_API_KEY,
    };
    if (locationBias != null) {
      params.locationbias = `point:${locationBias.lat},${locationBias.lng}`;
    }

    const res = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
      params,
      timeout: 10000,
    });

    const candidate = res.data?.candidates?.[0];
    if (candidate == null) return null;

    return {
      placeId: candidate.place_id as string,
      address: candidate.formatted_address as string,
      lat: candidate.geometry?.location?.lat as number | undefined,
      lng: candidate.geometry?.location?.lng as number | undefined,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query_place_id=${candidate.place_id}`,
    };
  } catch (err) {
    logger.warn({ err, query }, 'Google place resolution failed');
    return null;
  }
}

function mapTransportMode(mode?: string): string {
  if (mode == null) return 'driving';
  const m = mode.toLowerCase();
  if (m === 'walk' || m === 'walking') return 'walking';
  if (m === 'metro' || m === 'bus' || m === 'train' || m === 'transit' || m === 'ferry') return 'transit';
  if (m === 'bicycle' || m === 'cycling') return 'bicycling';
  return 'driving';
}

async function getDistanceMatrixWithMode(originPlaceId: string, destPlaceId: string, mode: string) {
  try {
    const res = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `place_id:${originPlaceId}`,
        destinations: `place_id:${destPlaceId}`,
        mode,
        key: env.GOOGLE_PLACES_API_KEY,
      },
      timeout: 10000,
    });

    const element = res.data?.rows?.[0]?.elements?.[0];
    if (element?.status !== 'OK') return null;

    return {
      distanceKm: Math.round((element.distance.value as number) / 100) / 10,
      durationMin: Math.max(1, Math.round((element.duration.value as number) / 60)),
    };
  } catch (err) {
    logger.warn({ err, originPlaceId, destPlaceId }, 'Google distance lookup failed');
    return null;
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   UTILITIES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function getDurationDays(startDate: string, endDate: string) {
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
}

function money(amount: number) {
  return {
    amount,
    currency: 'INR' as const,
    formatted: `₹${amount.toLocaleString('en-IN')}`,
  };
}
