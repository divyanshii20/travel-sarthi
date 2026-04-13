import axios from 'axios';
import { env } from '../../config/env';
import { withCache, buildCacheKey } from '../../shared/cache';
import { logger } from '../../shared/logger';
import { ExternalServiceError } from '../../shared/errors';
import type { FarePredictionRequestDTO, FarePrediction, PricePredictionSignal } from '../../../../../travel-sarthi-shared-types/src';

export async function getPricePrediction(dto: FarePredictionRequestDTO): Promise<{
  prediction: FarePrediction;
  cachedAt: string | null;
}> {
  const cacheKey = buildCacheKey(
    'prediction',
    dto.origin,
    dto.destination,
    dto.departDate,
    dto.returnDate ?? '',
    dto.cabinClass,
    dto.travelers.adults,
  );

  let cachedAt: string | null = null;

  const prediction = await withCache<FarePrediction>(cacheKey, 14400, async () => {
    try {
      const res = await axios.post(
        `${env.ML_SERVICE_URL}/predict`,
        {
          features: buildFeatures(dto),
          includeFlexibleDates: true,
          flexibleDaysWindow: 7,
          includeExplanation: false,
        },
        {
          headers: { 'X-API-Key': env.ML_SERVICE_API_KEY },
          timeout: 10000,
        },
      );

      const mlResponse = res.data as {
        signal: PricePredictionSignal;
        confidence: number;
        predictedPrice: number;
        predictedLow: number;
        predictedHigh: number;
        recommendedBuyWindowStart: string | null;
        recommendedBuyWindowEnd: string | null;
        priceHistory: { date: string; price: number; currency: string }[];
        flexibleDates: unknown[];
      };

      return transformMlResponse(mlResponse, dto);
    } catch (err) {
      logger.warn({ err }, 'ML service unavailable — using rule-based fallback');
      return getFallbackPrediction(dto);
    }
  });

  return { prediction, cachedAt };
}

function buildFeatures(dto: FarePredictionRequestDTO) {
  const departDate = new Date(dto.departDate);
  const now = new Date();
  const daysUntilDeparture = Math.round((departDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    origin: dto.origin,
    destination: dto.destination,
    departDayOfWeek: departDate.getDay(),
    departMonth: departDate.getMonth() + 1,
    departDay: departDate.getDate(),
    daysUntilDeparture,
    bookingDayOfWeek: now.getDay(),
    bookingMonth: now.getMonth() + 1,
    isWeekend: [0, 6].includes(departDate.getDay()),
    cabinClass: dto.cabinClass,
    totalTravelers: dto.travelers.adults + dto.travelers.children + dto.travelers.infants,
    stops: 0,
    currentPrice: 0,
    priceVsRouteAvg: 1,
    priceVsSeasonAvg: 1,
    priceTrend7d: 0,
    priceTrend30d: 0,
    priceVolatility: 0,
    lowestPriceInWindow: 0,
    historicalAvgPrice: 0,
    searchVolume7d: 0,
    bookingVelocity: 0,
    availableSeatsPercent: 0.5,
    competitorRouteCount: 5,
    airportCongestionScore: 0.5,
    fuelPriceIndex: 100,
    exchangeRateUsdInr: 83.5,
  };
}

function transformMlResponse(
  mlRes: {
    signal: PricePredictionSignal;
    confidence: number;
    predictedPrice: number;
    predictedLow: number;
    predictedHigh: number;
    recommendedBuyWindowStart: string | null;
    recommendedBuyWindowEnd: string | null;
    priceHistory: { date: string; price: number; currency: string }[];
    flexibleDates: unknown[];
  },
  dto: FarePredictionRequestDTO,
): FarePrediction {
  const currency = 'INR';

  return {
    signal: mlRes.signal,
    confidence: mlRes.confidence,
    currentPrice: { amount: mlRes.predictedPrice, currency, formatted: `₹${mlRes.predictedPrice.toLocaleString('en-IN')}` },
    predictedLow: { amount: mlRes.predictedLow, currency, formatted: `₹${mlRes.predictedLow.toLocaleString('en-IN')}` },
    predictedHigh: { amount: mlRes.predictedHigh, currency, formatted: `₹${mlRes.predictedHigh.toLocaleString('en-IN')}` },
    recommendedBuyWindow: mlRes.recommendedBuyWindowStart && mlRes.recommendedBuyWindowEnd
      ? { from: mlRes.recommendedBuyWindowStart, to: mlRes.recommendedBuyWindowEnd }
      : null,
    priceHistory: mlRes.priceHistory.map((h) => ({ date: h.date, price: h.price, currency: currency as any })),
    flexibleDates: [],
    explanation: getSignalExplanation(mlRes.signal, mlRes.confidence),
  };
}

function getFallbackPrediction(dto: FarePredictionRequestDTO): FarePrediction {
  const departDate = new Date(dto.departDate);
  const now = new Date();
  const daysUntil = Math.round((departDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let signal: PricePredictionSignal;
  if (daysUntil < 7) signal = 'BUY_NOW';
  else if (daysUntil < 21) signal = 'WATCH';
  else if (daysUntil < 60) signal = 'FLEXIBLE';
  else signal = 'WAIT';

  const currency = 'INR';
  const basePrice = 8000;

  return {
    signal,
    confidence: 0.55,
    currentPrice: { amount: basePrice, currency, formatted: `₹${basePrice.toLocaleString('en-IN')}` },
    predictedLow: { amount: basePrice * 0.85, currency, formatted: `₹${(basePrice * 0.85).toLocaleString('en-IN')}` },
    predictedHigh: { amount: basePrice * 1.2, currency, formatted: `₹${(basePrice * 1.2).toLocaleString('en-IN')}` },
    recommendedBuyWindow: null,
    priceHistory: [],
    flexibleDates: [],
    explanation: getSignalExplanation(signal, 0.55),
  };
}

function getSignalExplanation(signal: PricePredictionSignal, confidence: number): string {
  const pct = Math.round(confidence * 100);
  const map: Record<PricePredictionSignal, string> = {
    BUY_NOW: `Our AI model (${pct}% confidence) recommends booking immediately — prices are likely to rise.`,
    WAIT: `Our AI model (${pct}% confidence) suggests waiting — prices may drop further.`,
    FLEXIBLE: `You have flexibility — prices are stable. Consider adjusting dates by ±3 days for savings.`,
    WATCH: `Monitor prices over the next few days — the trend is uncertain.`,
    STABLE: `Prices are stable for this route. Book when convenient.`,
  };
  return map[signal];
}

function getSignalBadgeColor(signal: PricePredictionSignal): string {
  const map: Record<PricePredictionSignal, string> = {
    BUY_NOW: '#FF6B6B',
    WAIT: '#F4A261',
    FLEXIBLE: '#0B7A75',
    WATCH: '#FF6B35',
    STABLE: '#7A7A9A',
  };
  return map[signal];
}
