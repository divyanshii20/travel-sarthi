// ─── ML Service Types ─────────────────────────────────────────────────────────

import type { ISODateString, ISODateTimeString, AirportCode, TravelClass } from './common';
import type { PricePredictionSignal, PriceHistoryPoint, FlexibleDateOption } from './flights';

// ─── 44-Feature Input Vector ─────────────────────────────────────────────────

export interface PricePredictionFeatures {
  // Route features (6)
  origin: AirportCode;
  destination: AirportCode;
  routeDistance: number;
  isInternational: boolean;
  isDomestic: boolean;
  isPopularRoute: boolean;

  // Temporal features (10)
  departDayOfWeek: number; // 0=Mon
  departMonth: number; // 1-12
  departDay: number; // 1-31
  daysUntilDeparture: number;
  bookingDayOfWeek: number;
  bookingMonth: number;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  isHolidayAdjacent: boolean;

  // Seasonal features (5)
  isSummerPeak: boolean;
  isWinterPeak: boolean;
  isMonsoon: boolean;
  seasonName: 'peak' | 'shoulder' | 'off';
  ipoWeekIndicator: boolean;

  // Flight features (8)
  cabinClass: TravelClass;
  totalTravelers: number;
  flightDurationMinutes: number;
  stops: number;
  airline: string;
  isLcc: boolean; // low cost carrier
  departureTimeSlot: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
  arrivalTimeSlot: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';

  // Price features (8)
  currentPrice: number;
  priceVsRouteAvg: number; // ratio
  priceVsSeasonAvg: number;
  priceTrend7d: number; // % change over 7 days
  priceTrend30d: number;
  priceVolatility: number; // std dev
  lowestPriceInWindow: number;
  historicalAvgPrice: number;

  // Demand features (5)
  searchVolume7d: number;
  bookingVelocity: number;
  availableSeatsPercent: number;
  competitorRouteCount: number;
  airportCongestionScore: number;

  // External signals (2)
  fuelPriceIndex: number;
  exchangeRateUsdInr: number;
}

// ─── Prediction Outputs ───────────────────────────────────────────────────────

export interface MLPredictionRequest {
  features: PricePredictionFeatures;
  includeFlexibleDates?: boolean;
  flexibleDaysWindow?: number; // +/- N days
  includeExplanation?: boolean;
}

export interface ModelExplanation {
  topFeatures: {
    feature: string;
    importance: number;
    direction: 'positive' | 'negative';
    humanReadable: string;
  }[];
  shapValues: Record<string, number>;
}

export interface MLPredictionResponse {
  signal: PricePredictionSignal;
  confidence: number;
  predictedPrice: number;
  predictedLow: number;
  predictedHigh: number;
  predictionIntervalDays: number;
  recommendedBuyWindowStart: ISODateString | null;
  recommendedBuyWindowEnd: ISODateString | null;
  priceHistory: PriceHistoryPoint[];
  flexibleDates: FlexibleDateOption[];
  explanation: ModelExplanation | null;
  modelVersion: string;
  inferenceMs: number;
}

export interface BatchPredictionRequest {
  items: { id: string; features: PricePredictionFeatures }[];
}

export interface BatchPredictionResponse {
  results: { id: string; prediction: MLPredictionResponse; error: string | null }[];
  totalProcessed: number;
  failedCount: number;
  processingMs: number;
}

// ─── Model Monitoring ─────────────────────────────────────────────────────────

export interface ModelAccuracyMetrics {
  modelVersion: string;
  evaluatedAt: ISODateTimeString;
  mae: number; // mean absolute error in INR
  rmse: number;
  mape: number; // mean absolute percentage error
  directionAccuracy: number; // % correct BUY/WAIT predictions
  sampleSize: number;
  routeBreakdown: {
    route: string;
    mae: number;
    sampleSize: number;
  }[];
}

export interface DriftDetectionResult {
  isDriftDetected: boolean;
  driftScore: number;
  affectedFeatures: string[];
  recommendation: 'retrain' | 'monitor' | 'ok';
  detectedAt: ISODateTimeString;
}

export interface RetrainRequestDTO {
  reason: string;
  forceFull?: boolean;
  hyperparamOverrides?: Record<string, number | string | boolean>;
}

export interface RetrainResponseDTO {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  estimatedMinutes: number;
  mlflowRunUrl: string | null;
}
