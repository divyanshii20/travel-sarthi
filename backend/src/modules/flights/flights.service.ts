import axios from 'axios';
import { env } from '../../config/env';
import { withCache, buildCacheKey } from '../../shared/cache';
import { logger } from '../../shared/logger';
import { ExternalServiceError } from '../../shared/errors';
import type { FlightSearchRequestDTO, FlightResult, FlightFilterOptions } from '../../../../../travel-sarthi-shared-types/src';

// ─── Amadeus Token Cache ──────────────────────────────────────────────────────

let amadeusToken: { token: string; expiresAt: number } | null = null;

async function getAmadeusToken(): Promise<string> {
  if (amadeusToken && Date.now() < amadeusToken.expiresAt - 60000) {
    return amadeusToken.token;
  }

  const res = await axios.post(
    `${env.AMADEUS_BASE_URL}/v1/security/oauth2/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.AMADEUS_CLIENT_ID,
      client_secret: env.AMADEUS_CLIENT_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  const data = res.data as { access_token: string; expires_in: number };
  amadeusToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

// ─── Kiwi Search ──────────────────────────────────────────────────────────────

async function searchKiwi(dto: FlightSearchRequestDTO): Promise<FlightResult[]> {
  try {
    const res = await axios.get(`${env.KIWI_API_BASE}/v2/search`, {
      headers: { apikey: env.KIWI_API_KEY },
      params: {
        fly_from: dto.origin,
        fly_to: dto.destination,
        date_from: dto.departDate,
        date_to: dto.departDate,
        return_from: dto.returnDate,
        return_to: dto.returnDate,
        adults: dto.travelers.adults,
        children: dto.travelers.children,
        infants: dto.travelers.infants,
        selected_cabins: mapCabinClass(dto.cabinClass),
        max_stopovers: dto.directOnly ? 0 : undefined,
        curr: 'INR',
        limit: 50,
        sort: 'price',
      },
      timeout: 15000,
    });

    return transformKiwiResults(res.data as KiwiResponse);
  } catch (err) {
    logger.warn({ err }, 'Kiwi search failed');
    return [];
  }
}

// ─── Amadeus Search ───────────────────────────────────────────────────────────

async function searchAmadeus(dto: FlightSearchRequestDTO): Promise<FlightResult[]> {
  try {
    const token = await getAmadeusToken();
    const res = await axios.get(`${env.AMADEUS_BASE_URL}/v2/shopping/flight-offers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        originLocationCode: dto.origin,
        destinationLocationCode: dto.destination,
        departureDate: dto.departDate,
        returnDate: dto.returnDate,
        adults: dto.travelers.adults,
        children: dto.travelers.children > 0 ? dto.travelers.children : undefined,
        infants: dto.travelers.infants > 0 ? dto.travelers.infants : undefined,
        travelClass: mapAmadeusClass(dto.cabinClass),
        nonStop: dto.directOnly ? true : undefined,
        currencyCode: 'INR',
        max: 25,
      },
      timeout: 15000,
    });

    return transformAmadeusResults(res.data as AmadeusResponse);
  } catch (err) {
    logger.warn({ err }, 'Amadeus search failed');
    return [];
  }
}

// ─── Aviation Stack Search ────────────────────────────────────────────────────

interface AviationStackFlight {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    iata: string;
    scheduled: string;
    estimated: string | null;
    actual: string | null;
    terminal: string | null;
    gate: string | null;
    delay: number | null;
  };
  arrival: {
    airport: string;
    iata: string;
    scheduled: string;
    estimated: string | null;
    terminal: string | null;
    gate: string | null;
    delay: number | null;
  };
  airline: { name: string; iata: string; icao: string };
  flight: { number: string; iata: string; icao: string };
}

interface AviationStackResponse {
  data: AviationStackFlight[];
  pagination?: { limit: number; offset: number; count: number; total: number };
}

async function searchAviationStack(dto: FlightSearchRequestDTO): Promise<FlightResult[]> {
  if (env.AVIATIONSTACK_API_KEY === 'placeholder') return [];
  try {
    const res = await axios.get(`${env.AVIATIONSTACK_BASE_URL}/flights`, {
      params: {
        access_key: env.AVIATIONSTACK_API_KEY,
        dep_iata: dto.origin,
        arr_iata: dto.destination,
        flight_date: dto.departDate,
        flight_status: 'scheduled',
        limit: 25,
      },
      timeout: 12000,
    });

    return transformAviationStackResults(res.data as AviationStackResponse);
  } catch (err) {
    logger.warn({ err }, 'AviationStack search failed');
    return [];
  }
}

function transformAviationStackResults(data: AviationStackResponse): FlightResult[] {
  if (!data?.data?.length) return [];

  return data.data
    .filter((f) => f.flight_status === 'scheduled' && f.departure?.iata && f.arrival?.iata)
    .map((f): FlightResult => {
      const depTime = new Date(f.departure.scheduled);
      const arrTime = new Date(f.arrival.scheduled);
      const durationMin = Math.round((arrTime.getTime() - depTime.getTime()) / 60000);

      return {
        id: `avstack_${f.flight.iata}_${f.flight_date}`,
        source: 'aviationstack' as any,
        segments: [
          {
            id: `seg_${f.flight.iata}`,
            flightNumber: f.flight.iata,
            airline: { iataCode: f.airline.iata, name: f.airline.name, logoUrl: null },
            aircraft: { model: null, registration: null },
            departure: {
              airport: { iataCode: f.departure.iata, name: f.departure.airport, city: f.departure.iata, country: null, terminal: f.departure.terminal, gate: f.departure.gate },
              scheduledTime: f.departure.scheduled,
              estimatedTime: f.departure.estimated ?? f.departure.scheduled,
              actualTime: f.departure.actual ?? null,
              delay: f.departure.delay ?? 0,
            },
            arrival: {
              airport: { iataCode: f.arrival.iata, name: f.arrival.airport, city: f.arrival.iata, country: null, terminal: f.arrival.terminal, gate: f.arrival.gate },
              scheduledTime: f.arrival.scheduled,
              estimatedTime: f.arrival.estimated ?? f.arrival.scheduled,
              actualTime: null,
              delay: f.arrival.delay ?? 0,
            },
            duration: durationMin,
            cabinClass: 'economy',
            seatsAvailable: null,
            baggageAllowance: { cabin: '7kg', checked: '15kg' },
            amenities: [],
          },
        ],
        stops: 0,
        totalDuration: durationMin,
        prices: [
          {
            cabinClass: 'economy',
            price: { amount: 0, currency: 'INR', formatted: 'Check airline' },
            seatsLeft: null,
            isSoldOut: false,
            fareConditions: { isRefundable: false, isChangeable: false, baggageIncluded: false },
          },
        ],
        isSeatSelectable: false,
        voyageScore: { overall: 50, price: 50, speed: 50, comfort: 50, reliability: 50, convenience: 50, badge: null },
        bookingOptions: [],
        tags: [],
        alerts: [],
      };
    });
}

// ─── Parallel Search + Merge ──────────────────────────────────────────────────

export async function searchFlights(dto: FlightSearchRequestDTO) {
  const cacheKey = buildCacheKey(
    'flights',
    dto.origin ?? dto.originCity ?? 'any',
    dto.destination ?? 'any',
    dto.departDate,
    dto.returnDate ?? '',
    dto.cabinClass,
    dto.travelers.adults,
    dto.travelers.children,
    dto.travelers.infants,
  );

  return withCache(cacheKey, 900, async () => {
    const [kiwiResults, amadeusResults, aviationStackResults] = await Promise.all([
      searchKiwi(dto),
      searchAmadeus(dto),
      searchAviationStack(dto),
    ]);

    const merged = mergeAndDeduplicate([...kiwiResults, ...amadeusResults, ...aviationStackResults]);
    const scored = merged.map(computeVoyageScore);
    const sorted = scored.sort((a, b) => b.voyageScore.overall - a.voyageScore.overall);

    return {
      results: sorted,
      searchId: `srch_${Date.now()}`,
      searchedAt: new Date().toISOString(),
      currency: 'INR',
      totalResults: sorted.length,
      filters: buildFilterOptions(sorted),
    };
  });
}

// ─── Live Flight Status (Aviation Stack) ─────────────────────────────────────

export async function getLiveFlightStatus(flightIata: string, date: string) {
  if (env.AVIATIONSTACK_API_KEY === 'placeholder') {
    throw new ExternalServiceError('AviationStack API key not configured');
  }
  const cacheKey = buildCacheKey('flight-status', flightIata, date);
  return withCache(cacheKey, 120, async () => {
    const res = await axios.get(`${env.AVIATIONSTACK_BASE_URL}/flights`, {
      params: {
        access_key: env.AVIATIONSTACK_API_KEY,
        flight_iata: flightIata,
        flight_date: date,
      },
      timeout: 10000,
    });
    const data = res.data as AviationStackResponse;
    return data.data?.[0] ?? null;
  });
}

// ─── VoyageScore 5-Dimension ──────────────────────────────────────────────────

function computeVoyageScore(flight: FlightResult): FlightResult {
  const prices = flight.prices.map((p) => p.price.amount);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceScore = maxPrice > 0 ? 100 - ((minPrice - maxPrice * 0.5) / maxPrice) * 100 : 50;

  const speedScore = Math.max(0, 100 - (flight.totalDuration - 60) / 10);
  const comfortScore = flight.stops === 0 ? 90 : flight.stops === 1 ? 65 : 40;
  const reliabilityScore = 70; // would come from historical data
  const convenienceScore = flight.isSeatSelectable ? 75 : 55;

  const overall = (
    priceScore * 0.35 +
    speedScore * 0.2 +
    comfortScore * 0.2 +
    reliabilityScore * 0.15 +
    convenienceScore * 0.1
  );

  let badge: FlightResult['voyageScore']['badge'] = null;
  if (overall >= 85) badge = 'recommended';
  else if (priceScore >= 90) badge = 'best_value';
  else if (speedScore >= 90) badge = 'fastest';
  else if (comfortScore >= 85) badge = 'most_comfortable';

  return {
    ...flight,
    voyageScore: {
      overall: Math.round(overall),
      price: Math.round(Math.min(100, priceScore)),
      speed: Math.round(Math.min(100, speedScore)),
      comfort: Math.round(comfortScore),
      reliability: Math.round(reliabilityScore),
      convenience: Math.round(convenienceScore),
      badge,
    },
  };
}

// ─── Transform Helpers ────────────────────────────────────────────────────────

function mapCabinClass(c: string): string {
  const map: Record<string, string> = {
    economy: 'M',
    premium_economy: 'W',
    business: 'C',
    first: 'F',
  };
  return map[c] ?? 'M';
}

function mapAmadeusClass(c: string): string {
  const map: Record<string, string> = {
    economy: 'ECONOMY',
    premium_economy: 'PREMIUM_ECONOMY',
    business: 'BUSINESS',
    first: 'FIRST',
  };
  return map[c] ?? 'ECONOMY';
}

interface KiwiResponse {
  data: unknown[];
  currency: string;
}

interface AmadeusResponse {
  data: unknown[];
  meta: unknown;
}

function transformKiwiResults(_data: KiwiResponse): FlightResult[] {
  // Kiwi returns itineraries with legs — transform to FlightResult
  // Full implementation would parse each itinerary's legs, stops, pricing
  return [];
}

function transformAmadeusResults(_data: AmadeusResponse): FlightResult[] {
  // Amadeus returns flight-offers with itineraries and price — transform accordingly
  return [];
}

function mergeAndDeduplicate(results: FlightResult[]): FlightResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = r.segments.map((s) => `${s.flightNumber}-${s.departureTime}`).join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildFilterOptions(results: FlightResult[]): FlightFilterOptions {
  const airlines = new Map<string, { code: string; name: string; count: number }>();
  const prices = results.flatMap((r) => r.prices.map((p) => p.price.amount));
  const durations = results.map((r) => r.totalDuration);

  for (const result of results) {
    for (const seg of result.segments) {
      const code = seg.airline.iataCode;
      const existing = airlines.get(code);
      if (existing) {
        existing.count++;
      } else {
        airlines.set(code, { code, name: seg.airline.name, count: 1 });
      }
    }
  }

  return {
    airlines: Array.from(airlines.values()),
    stops: [0, 1, 2].map((s) => ({
      value: s,
      count: results.filter((r) => r.stops === s).length,
    })),
    priceRange: { min: Math.min(...prices, 0), max: Math.max(...prices, 0) },
    durationRange: { min: Math.min(...durations, 0), max: Math.max(...durations, 0) },
    departureTimeSlots: [
      { label: 'Early Morning', from: '00:00', to: '06:00', count: 0 },
      { label: 'Morning', from: '06:00', to: '12:00', count: 0 },
      { label: 'Afternoon', from: '12:00', to: '18:00', count: 0 },
      { label: 'Evening', from: '18:00', to: '23:59', count: 0 },
    ],
    arrivalTimeSlots: [
      { label: 'Early Morning', from: '00:00', to: '06:00', count: 0 },
      { label: 'Morning', from: '06:00', to: '12:00', count: 0 },
      { label: 'Afternoon', from: '12:00', to: '18:00', count: 0 },
      { label: 'Evening', from: '18:00', to: '23:59', count: 0 },
    ],
  };
}
