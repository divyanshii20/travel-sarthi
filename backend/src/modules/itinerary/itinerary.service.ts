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
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8000,
            responseMimeType: 'application/json',
          },
        },
        { timeout: 45000 },
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Gemini returned an empty itinerary payload');
      }

      parsed = JSON.parse(text) as GeminiItineraryResponse;
      validateGeminiResponse(parsed);
    } catch (error) {
      logger.error({ error, normalized }, 'Elite itinerary generation failed');
      throw new ExternalServiceError('Gemini', 'Failed to generate a valid itinerary');
    }

    const itinerary = await transformGeminiResponse(parsed, normalized, destinationContext);

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

async function getDestinationContext(destinationName: string) {
  const slugGuess = destinationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const [destination] = await db
    .select()
    .from(destinations)
    .where(
      and(
        eq(destinations.slug, slugGuess),
      ),
    )
    .limit(1);

  const resolvedDestination = destination
    ?? (await db.select().from(destinations).where(eq(destinations.name, destinationName)).limit(1))[0]
    ?? null;

  if (resolvedDestination == null) {
    return null;
  }

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

function buildElitePrompt(request: NormalizedGenerateRequest, destinationContext: Awaited<ReturnType<typeof getDestinationContext>>) {
  const durationDays = getDurationDays(request.departureDate, request.returnDate);
  const totalTravelers = request.adults + request.children;
  const budgetPerPersonPerDay = totalTravelers > 0 && durationDays > 0
    ? Math.round(request.budgetInr / totalTravelers / durationDays)
    : request.budgetInr;

  const destinationSummary = destinationContext == null
    ? 'No curated destination context was available. Infer carefully from general travel knowledge.'
    : [
      `Known destination record for ${destinationContext.name}, ${destinationContext.country}.`,
      `Visa status: ${destinationContext.visaStatus ?? 'unknown'}`,
      `Budget/day estimates in INR: budget=${destinationContext.budgetPerDay ?? 'n/a'}, mid=${destinationContext.budgetMidPerDay ?? 'n/a'}, luxury=${destinationContext.budgetLuxuryPerDay ?? 'n/a'}`,
      `Best months: ${(destinationContext.bestMonths ?? []).join(', ')}`,
      `Direct flight cities: ${(destinationContext.directFlightCities ?? []).join(', ')}`,
      `Weather summary: ${destinationContext.weatherSummary ?? 'n/a'}`,
      `Safety score: ${destinationContext.safetyScore}`,
      `Top POIs:\n${destinationContext.pois.map((poi) => `- ${poi.name} | ${poi.category ?? 'General'} | priority ${poi.priority} | avg ${poi.avgVisitHours ?? '?'}h | best ${poi.bestTimeOfDay ?? 'Any'} | fee ${poi.entryFeeInr ?? 0} INR`).join('\n')}`,
    ].join('\n');

  return [
    'You are an elite travel planner with encyclopedic knowledge of every destination worldwide.',
    'You create hyper-accurate, logistically perfect itineraries for Indian travelers.',
    '',
    'CRITICAL ACCURACY RULES:',
    '1. All travel times must reflect real-world conditions.',
    '2. Cluster activities geographically by district or zone.',
    '3. Respect opening hours and likely closures.',
    '4. Use INR and realistic per-person costs.',
    '5. Max 4-5 major attractions per day.',
    '6. Always include travel buffers and realistic meal durations.',
    '7. Children slow the pace and increase transition time.',
    '',
    `Trip request:`,
    `Destination: ${request.destination}`,
    `Flying from: ${request.flyingFrom || 'Not specified'}`,
    `Departure date: ${request.departureDate}`,
    `Return date: ${request.returnDate}`,
    `Duration days: ${durationDays}`,
    `Adults: ${request.adults}`,
    `Children: ${request.children}`,
    `Budget total INR: ${request.budgetInr}`,
    `Budget per person per day INR: ${budgetPerPersonPerDay}`,
    `Travel style: ${request.travelStyle.join(', ')}`,
    `Custom preferences: ${request.customPreferences || 'None'}`,
    `Mode: ${request.mode}`,
    '',
    destinationSummary,
    '',
    'Return ONLY valid JSON with this exact top-level structure and snake_case keys:',
    JSON.stringify({
      destination: 'string',
      country: 'string',
      flag: 'emoji',
      trip_summary: {
        total_days: durationDays,
        total_travelers: totalTravelers,
        budget_tier: 'Budget | Mid-range | Luxury',
        estimated_total_inr: request.budgetInr,
        estimated_per_person_inr: Math.round(request.budgetInr / Math.max(totalTravelers, 1)),
        best_currency: 'string',
        exchange_rate_note: 'string',
        weather_during_trip: 'string',
        language_tip: 'string',
        emergency_number: 'string',
        indian_embassy: 'string',
      },
      pre_trip_checklist: ['string'],
      days: [{
        day_number: 1,
        date: request.departureDate,
        day_label: 'string',
        theme: 'string',
        neighborhood_focus: 'string',
        weather_expected: 'string',
        slots: [{
          slot_id: 'd1_s1',
          time_start: '14:00',
          time_end: '15:30',
          duration_min: 90,
          type: 'travel',
          activity: 'Airport Transfer to Hotel',
          location: 'string',
          transport_mode: 'string',
          transport_detail: 'string',
          distance_km: 0,
          cost_inr_per_person: 0,
          cost_inr_total: 0,
          notes: 'string',
          tip: 'string',
          booking_required: false,
          booking_tip: 'string',
          map_query: 'string',
        }],
        day_budget_summary: {
          accommodation_inr: 0,
          food_inr: 0,
          transport_inr: 0,
          activities_inr: 0,
          misc_inr: 0,
          day_total_inr: 0,
          day_total_per_person_inr: 0,
        },
        day_tips: ['string'],
      }],
      hotels: [{
        name: 'string',
        area: 'string',
        tier: 'Budget | Mid | Luxury',
        why_here: 'string',
        price_inr_per_night: 0,
        booking_platform: 'string',
        check_in_day: 1,
        check_out_day: 2,
        nights: 1,
      }],
      transport_summary: {
        airport_transfer_in: { mode: 'string', cost_inr: 0, duration_min: 0 },
        airport_transfer_out: { mode: 'string', cost_inr: 0, duration_min: 0, depart_time: 'string' },
        day_passes: ['string'],
        app_downloads: ['string'],
      },
      budget_breakdown: {
        flights_inr: 0,
        accommodation_total_inr: 0,
        food_total_inr: 0,
        transport_local_inr: 0,
        activities_inr: 0,
        shopping_buffer_inr: 0,
        visa_fee_inr: 0,
        misc_contingency_inr: 0,
        grand_total_inr: 0,
        per_person_inr: 0,
        vs_budget: 'within',
        savings_tips: ['string'],
      },
      experiences_by_category: {
        must_do: ['string'],
        food_trail: ['string'],
        off_beaten_path: ['string'],
        splurge_if_possible: ['string'],
        skip: ['string'],
      },
      day_trips: [{
        name: 'string',
        distance_km: 0,
        duration_hours: 0,
        transport: 'string',
        best_day: 'string',
        cost_inr_per_person: 0,
        highlights: ['string'],
      }],
      cultural_guide: {
        dos: ['string'],
        donts: ['string'],
        scams_to_avoid: ['string'],
        indian_specific: ['string'],
      },
      packing_list: {
        essentials: ['string'],
        clothing: ['string'],
        health: ['string'],
        tech: ['string'],
      },
    }),
  ].join('\n');
}

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

async function transformGeminiResponse(
  payload: GeminiItineraryResponse,
  request: NormalizedGenerateRequest,
  destinationContext: Awaited<ReturnType<typeof getDestinationContext>>,
): Promise<Itinerary> {
  const heroImage = destinationContext?.heroImageUrl ?? null;
  const totalTravelers = request.adults + request.children;

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
    title: `${payload.destination} Precision Itinerary`,
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

  await enrichItineraryWithGoogleSignals(itinerary, payload.destination, payload.country);

  return itinerary;
}

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

async function enrichItineraryWithGoogleSignals(itinerary: Itinerary, destination: string, country: string) {
  if (
    env.GOOGLE_PLACES_API_KEY === 'placeholder' ||
    env.GOOGLE_PLACES_API_KEY.trim().length === 0
  ) {
    return;
  }

  for (const day of itinerary.days) {
    if (day.slots == null || day.slots.length === 0) continue;

    const resolvedPlaces = await Promise.all(
      day.slots.map((slot) => resolvePlace(`${slot.location}, ${destination}, ${country}`)),
    );

    for (let index = 0; index < day.slots.length; index += 1) {
      const slot = day.slots[index];
      const resolved = resolvedPlaces[index];
      if (slot == null || resolved == null) continue;

      slot.mapQuery = resolved.mapsUrl ?? slot.mapQuery;
      if (slot.notes == null || slot.notes.length === 0) {
        slot.notes = resolved.address;
      }

      const nextResolved = resolvedPlaces[index + 1];
      const nextSlot = day.slots[index + 1];
      if (nextResolved == null || nextSlot == null) continue;

      const leg = await getDistanceMatrixLeg(resolved.placeId, nextResolved.placeId);
      if (leg == null) continue;

      nextSlot.distanceKm = nextSlot.distanceKm ?? leg.distanceKm;
      if (nextSlot.transportDetail == null || nextSlot.transportDetail.length === 0) {
        nextSlot.transportDetail = `${leg.durationMinutes} min by road based on Google distance data`;
      }
    }
  }
}

async function resolvePlace(query: string) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
      params: {
        input: query,
        inputtype: 'textquery',
        fields: 'place_id,name,formatted_address',
        key: env.GOOGLE_PLACES_API_KEY,
      },
      timeout: 15000,
    });

    const candidate = response.data?.candidates?.[0];
    if (candidate == null) return null;

    return {
      placeId: candidate.place_id as string,
      address: candidate.formatted_address as string,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query_place_id=${candidate.place_id}`,
    };
  } catch (error) {
    logger.warn({ error, query }, 'Google place resolution failed');
    return null;
  }
}

async function getDistanceMatrixLeg(originPlaceId: string, destinationPlaceId: string) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `place_id:${originPlaceId}`,
        destinations: `place_id:${destinationPlaceId}`,
        mode: 'driving',
        key: env.GOOGLE_PLACES_API_KEY,
      },
      timeout: 15000,
    });

    const element = response.data?.rows?.[0]?.elements?.[0];
    if (element?.status !== 'OK') return null;

    return {
      distanceKm: Math.round((element.distance.value as number) / 100) / 10,
      durationMinutes: Math.max(1, Math.round((element.duration.value as number) / 60)),
    };
  } catch (error) {
    logger.warn({ error, originPlaceId, destinationPlaceId }, 'Google distance lookup failed');
    return null;
  }
}
