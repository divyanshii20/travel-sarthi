import axios from 'axios';
import { env } from '../../config/env';
import { withCache, buildCacheKey } from '../../shared/cache';
import { logger } from '../../shared/logger';
import { ExternalServiceError } from '../../shared/errors';
import { db } from '../../config/database';
import { itineraries, itineraryGenerationCache } from '../../db/schema/itineraries';
import type { GenerateItineraryRequestDTO, Itinerary, ItineraryDay, Activity } from '../../../../../travel-sarthi-shared-types/src';

// CDN image mapping for destinations
const DESTINATION_IMAGES: Record<string, string> = {
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  thailand: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  singapore: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800&q=80',
  maldives: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80',
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
  rajasthan: 'https://images.unsplash.com/photo-1477587458883-47145ed31acb?w=800&q=80',
};

function getDestinationImage(destination: string): string {
  const key = destination.toLowerCase().replace(/[^a-z]/g, '');
  for (const [name, url] of Object.entries(DESTINATION_IMAGES)) {
    if (key.includes(name)) return url;
  }
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';
}

export async function generateItinerary(
  dto: GenerateItineraryRequestDTO,
  userId: string,
): Promise<Itinerary> {
  const cacheKey = buildCacheKey(
    'itinerary',
    dto.destination.toLowerCase().replace(/\s+/g, '_'),
    dto.startDate,
    dto.endDate,
    dto.style.sort().join(','),
    dto.pace,
  );

  return withCache<Itinerary>(cacheKey, 86400, async () => {
    const prompt = buildItineraryPrompt(dto);

    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        },
        { timeout: 30000 },
      );

      const raw = res.data as {
        candidates: { content: { parts: { text: string }[] } }[];
        usageMetadata: { totalTokenCount: number };
      };

      const text = raw.candidates[0]?.content.parts[0]?.text;
      if (!text) throw new ExternalServiceError('Gemini', 'Empty response');

      const parsed = JSON.parse(text) as GeminiItineraryResponse;
      return transformGeminiResponse(parsed, dto, userId, raw.usageMetadata.totalTokenCount);
    } catch (err) {
      if (err instanceof ExternalServiceError) throw err;
      logger.error({ err }, 'Gemini itinerary generation failed');
      throw new ExternalServiceError('Gemini', 'Failed to generate itinerary');
    }
  });
}

function buildItineraryPrompt(dto: GenerateItineraryRequestDTO): string {
  const days = Math.round(
    (new Date(dto.endDate).getTime() - new Date(dto.startDate).getTime()) / (1000 * 60 * 60 * 24),
  ) + 1;

  return `You are an expert travel planner for Indian travelers. Generate a detailed ${days}-day itinerary for ${dto.destination}.

Trip Details:
- Destination: ${dto.destination}
- Start Date: ${dto.startDate}
- End Date: ${dto.endDate}
- Duration: ${days} days
- Travelers: ${dto.travelers.adults} adults, ${dto.travelers.children} children, ${dto.travelers.infants} infants
- Total Budget: ₹${dto.budgetTotal.toLocaleString('en-IN')}
- Travel Style: ${dto.style.join(', ')}
- Pace: ${dto.pace}
${dto.mustInclude?.length ? `- Must Include: ${dto.mustInclude.join(', ')}` : ''}
${dto.avoidCategories?.length ? `- Avoid: ${dto.avoidCategories.join(', ')}` : ''}

Return a JSON object with this exact structure:
{
  "title": "string",
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "city": "string",
      "country": "string",
      "theme": "string",
      "activities": [
        {
          "id": "unique-id",
          "title": "string",
          "description": "string (2-3 sentences)",
          "category": "sightseeing|adventure|culture|food|shopping|nightlife|wellness|transport|nature|beach|religious",
          "timeOfDay": "morning|afternoon|evening|night|full_day",
          "startTime": "HH:mm",
          "endTime": "HH:mm",
          "duration": 90,
          "locationName": "string",
          "locationAddress": "string",
          "lat": 0.0,
          "lng": 0.0,
          "mapsUrl": "string",
          "estimatedCostInr": 500,
          "localTip": "string",
          "bookingRequired": false,
          "bookingUrl": null,
          "rating": 4.5,
          "tags": ["string"]
        }
      ],
      "connectors": [
        {
          "from": "location name",
          "to": "location name",
          "mode": "taxi|metro|walk|bus|ferry",
          "durationMinutes": 20,
          "estimatedCostInr": 200,
          "distanceKm": 5.0,
          "description": "string"
        }
      ],
      "totalDayCostInr": 3000
    }
  ],
  "budgetBreakdown": {
    "flightsInr": 0,
    "accommodationInr": 0,
    "foodInr": 0,
    "activitiesInr": 0,
    "transportInr": 0,
    "shoppingInr": 0,
    "miscellaneousInr": 0,
    "totalInr": 0,
    "totalWithCouponsInr": 0,
    "totalSavingsInr": 0
  }
}

Be specific with real places, accurate timings, realistic costs in INR. Include local tips from a local's perspective.`;
}

interface GeminiItineraryResponse {
  title: string;
  days: {
    dayNumber: number;
    date: string;
    city: string;
    country: string;
    theme: string;
    activities: {
      id: string;
      title: string;
      description: string;
      category: string;
      timeOfDay: string;
      startTime: string;
      endTime: string;
      duration: number;
      locationName: string;
      locationAddress: string;
      lat: number;
      lng: number;
      mapsUrl: string;
      estimatedCostInr: number;
      localTip: string | null;
      bookingRequired: boolean;
      bookingUrl: string | null;
      rating: number | null;
      tags: string[];
    }[];
    connectors: {
      from: string;
      to: string;
      mode: string;
      durationMinutes: number;
      estimatedCostInr: number;
      distanceKm: number;
      description: string;
    }[];
    totalDayCostInr: number;
  }[];
  budgetBreakdown: {
    flightsInr: number;
    accommodationInr: number;
    foodInr: number;
    activitiesInr: number;
    transportInr: number;
    shoppingInr: number;
    miscellaneousInr: number;
    totalInr: number;
    totalWithCouponsInr: number;
    totalSavingsInr: number;
  };
}

function transformGeminiResponse(
  data: GeminiItineraryResponse,
  dto: GenerateItineraryRequestDTO,
  userId: string,
  tokensUsed: number,
): Itinerary {
  const heroImage = getDestinationImage(dto.destination);

  const days: ItineraryDay[] = data.days.map((day) => ({
    dayNumber: day.dayNumber,
    date: day.date,
    city: day.city,
    country: day.country,
    heroImage: { url: heroImage, alt: `${day.city} Day ${day.dayNumber}` },
    weather: null,
    activities: day.activities.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category as Activity['category'],
      timeOfDay: a.timeOfDay as Activity['timeOfDay'],
      startTime: a.startTime,
      endTime: a.endTime,
      duration: a.duration,
      location: {
        name: a.locationName,
        address: a.locationAddress,
        coordinates: { lat: a.lat, lng: a.lng },
        googlePlaceId: null,
        mapsUrl: a.mapsUrl,
      },
      estimatedCost: { amount: a.estimatedCostInr, currency: 'INR', formatted: `₹${a.estimatedCostInr.toLocaleString('en-IN')}` },
      image: null,
      localTip: a.localTip,
      bookingRequired: a.bookingRequired,
      bookingUrl: a.bookingUrl,
      rating: a.rating,
      reviewCount: null,
      tags: a.tags,
      isCompleted: false,
      isSkipped: false,
      customNote: null,
    })),
    connectors: day.connectors.map((c) => ({
      from: c.from,
      to: c.to,
      mode: c.mode as any,
      duration: c.durationMinutes,
      estimatedCost: { amount: c.estimatedCostInr, currency: 'INR', formatted: `₹${c.estimatedCostInr.toLocaleString('en-IN')}` },
      distanceKm: c.distanceKm,
      description: c.description,
    })),
    totalEstimatedCost: { amount: day.totalDayCostInr, currency: 'INR', formatted: `₹${day.totalDayCostInr.toLocaleString('en-IN')}` },
    notes: null,
  }));

  const bb = data.budgetBreakdown;
  const mkMoney = (v: number) => ({ amount: v, currency: 'INR' as const, formatted: `₹${v.toLocaleString('en-IN')}` });

  const durationDays = data.days.length;

  return {
    id: `itin_${Date.now()}`,
    tripId: dto.existingTripId ?? '',
    title: data.title,
    destination: dto.destination,
    startDate: dto.startDate,
    endDate: dto.endDate,
    durationDays,
    days,
    budgetBreakdown: {
      flights: mkMoney(bb.flightsInr),
      accommodation: mkMoney(bb.accommodationInr),
      food: mkMoney(bb.foodInr),
      activities: mkMoney(bb.activitiesInr),
      transport: mkMoney(bb.transportInr),
      shopping: mkMoney(bb.shoppingInr),
      miscellaneous: mkMoney(bb.miscellaneousInr),
      total: mkMoney(bb.totalInr),
      totalWithCoupons: mkMoney(bb.totalWithCouponsInr),
      totalSavings: mkMoney(bb.totalSavingsInr),
    },
    generatedAt: new Date().toISOString(),
    generatedBy: 'ai',
    version: 1,
    isPublic: false,
    shareToken: null,
  };
}
