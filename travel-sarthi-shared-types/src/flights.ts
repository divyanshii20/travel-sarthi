// ─── Flight Types ─────────────────────────────────────────────────────────────

import type {
  UUID,
  ISODateString,
  ISODateTimeString,
  CurrencyCode,
  AirportCode,
  TravelClass,
  TripType,
  TravelerCount,
  MoneyAmount,
} from './common';

export type BookingPlatform =
  | 'makemytrip'
  | 'cleartrip'
  | 'goibibo'
  | 'easemytrip'
  | 'ixigo'
  | 'paytm_travel'
  | 'yatra';

export type FlightStatus =
  | 'scheduled'
  | 'delayed'
  | 'cancelled'
  | 'diverted'
  | 'landed'
  | 'airborne'
  | 'unknown';

export type AircraftType = string;

export interface Airline {
  iataCode: string;
  name: string;
  logoUrl: string;
  country: string;
}

export interface Airport {
  iataCode: AirportCode;
  name: string;
  city: string;
  country: string;
  timezone: string;
  lat: number;
  lng: number;
}

export interface FlightSegment {
  departureAirport: Airport;
  arrivalAirport: Airport;
  departureTime: ISODateTimeString;
  arrivalTime: ISODateTimeString;
  flightNumber: string;
  airline: Airline;
  operatingAirline: Airline | null;
  aircraft: AircraftType | null;
  cabinClass: TravelClass;
  duration: number; // minutes
  baggage: BaggageAllowance;
  terminal: {
    departure: string | null;
    arrival: string | null;
  };
}

export interface Layover {
  airport: Airport;
  duration: number; // minutes
  isOvernight: boolean;
}

export interface BaggageAllowance {
  cabin: {
    weightKg: number;
    pieces: number;
  };
  checkin: {
    weightKg: number;
    pieces: number;
  };
}

export interface PlatformPrice {
  platform: BookingPlatform;
  price: MoneyAmount;
  deeplink: string;
  isCheapest: boolean;
  taxes: MoneyAmount;
  discount: MoneyAmount | null;
  availableSeats: number | null;
  fareType: string | null; // e.g. "SAVER", "FLEXI"
}

export interface CouponOffer {
  code: string;
  platform: BookingPlatform | 'bank' | 'wallet';
  discount: MoneyAmount;
  maxDiscount: MoneyAmount | null;
  minPurchase: MoneyAmount | null;
  description: string;
  expiresAt: ISODateTimeString | null;
  isStackable: boolean;
  bankName: string | null;
  cardType: string | null;
}

export interface BankOffer {
  bankName: string;
  cardType: string;
  discountPercent: number;
  maxDiscountAmount: MoneyAmount;
  minTransactionAmount: MoneyAmount;
  platforms: BookingPlatform[];
  validUntil: ISODateTimeString | null;
}

// ─── VoyageScore 5-Dimension ──────────────────────────────────────────────────

export interface VoyageScore {
  overall: number; // 0-100
  price: number;
  speed: number;
  comfort: number;
  reliability: number;
  convenience: number;
  badge: 'best_value' | 'fastest' | 'most_comfortable' | 'most_reliable' | 'recommended' | null;
}

// ─── Full Flight Result ───────────────────────────────────────────────────────

export interface FlightResult {
  id: string; // composite key
  segments: FlightSegment[];
  layovers: Layover[];
  totalDuration: number; // minutes
  stops: number;
  prices: PlatformPrice[];
  bestPrice: MoneyAmount;
  coupons: CouponOffer[];
  bankOffers: BankOffer[];
  voyageScore: VoyageScore;
  pricePerKm: number;
  isRefundable: boolean;
  isSeatSelectable: boolean;
  co2EmissionsKg: number | null;
  farePrediction: FarePrediction | null;
}

// ─── Search DTOs ──────────────────────────────────────────────────────────────

export interface FlightSearchRequestDTO {
  mode: 'A' | 'B';
  // Mode A: know where you want to go
  origin?: AirportCode;
  destination?: AirportCode;
  // Mode B: flexible, discover destinations
  originCity?: string;
  maxBudget?: number;
  currency?: CurrencyCode;
  // Common
  departDate: ISODateString;
  returnDate?: ISODateString;
  tripType: TripType;
  travelers: TravelerCount;
  cabinClass: TravelClass;
  directOnly?: boolean;
  preferredAirlines?: string[];
  maxLayoverMinutes?: number;
}

export interface FlightSearchResponseDTO {
  results: FlightResult[];
  searchId: string;
  searchedAt: ISODateTimeString;
  currency: CurrencyCode;
  totalResults: number;
  filters: FlightFilterOptions;
}

export interface FlightFilterOptions {
  airlines: { code: string; name: string; count: number }[];
  stops: { value: number; count: number }[];
  priceRange: { min: number; max: number };
  durationRange: { min: number; max: number };
  departureTimeSlots: { label: string; from: string; to: string; count: number }[];
  arrivalTimeSlots: { label: string; from: string; to: string; count: number }[];
}

// ─── Price Prediction ─────────────────────────────────────────────────────────

export type PricePredictionSignal = 'BUY_NOW' | 'WAIT' | 'FLEXIBLE' | 'WATCH' | 'STABLE';

export interface FarePrediction {
  signal: PricePredictionSignal;
  confidence: number; // 0-1
  currentPrice: MoneyAmount;
  predictedLow: MoneyAmount;
  predictedHigh: MoneyAmount;
  recommendedBuyWindow: DateRange | null;
  priceHistory: PriceHistoryPoint[];
  flexibleDates: FlexibleDateOption[];
  explanation: string;
}

export interface PriceHistoryPoint {
  date: ISODateString;
  price: number;
  currency: CurrencyCode;
}

export interface FlexibleDateOption {
  departDate: ISODateString;
  returnDate: ISODateString | null;
  price: MoneyAmount;
  delta: MoneyAmount; // vs base date
  signal: PricePredictionSignal;
}

import type { DateRange } from './common';

export interface FarePredictionRequestDTO {
  origin: AirportCode;
  destination: AirportCode;
  departDate: ISODateString;
  returnDate?: ISODateString;
  cabinClass: TravelClass;
  travelers: TravelerCount;
}

export interface FarePredictionResponseDTO {
  prediction: FarePrediction;
  cachedAt: ISODateTimeString;
}

// ─── Fare Alert ───────────────────────────────────────────────────────────────

export type AlertFrequency = 'instant' | 'daily' | 'weekly';
export type AlertChannel = 'email' | 'push' | 'whatsapp';

export interface FareAlert {
  id: UUID;
  userId: UUID;
  origin: AirportCode;
  destination: AirportCode;
  departDateFrom: ISODateString;
  departDateTo: ISODateString;
  targetPrice: MoneyAmount;
  cabinClass: TravelClass;
  travelers: TravelerCount;
  frequency: AlertFrequency;
  channels: AlertChannel[];
  isActive: boolean;
  lastCheckedAt: ISODateTimeString | null;
  lastAlertSentAt: ISODateTimeString | null;
  triggerCount: number;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface CreateFareAlertDTO {
  origin: AirportCode;
  destination: AirportCode;
  departDateFrom: ISODateString;
  departDateTo: ISODateString;
  targetPrice: number;
  currency: CurrencyCode;
  cabinClass: TravelClass;
  travelers: TravelerCount;
  frequency: AlertFrequency;
  channels: AlertChannel[];
}
