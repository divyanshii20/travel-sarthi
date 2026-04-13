// ─── Common / Shared Primitives ───────────────────────────────────────────────

export type UUID = string;
export type ISODateString = string; // YYYY-MM-DD
export type ISODateTimeString = string; // ISO 8601 full datetime
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD' | 'THB' | 'MYR' | 'LKR' | 'NPR';
export type CountryCode = string; // ISO 3166-1 alpha-2
export type AirportCode = string; // IATA 3-letter code
export type LanguageCode = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn' | 'gu' | 'kn' | 'ml' | 'pa';

export type SortOrder = 'asc' | 'desc';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface MoneyAmount {
  amount: number;
  currency: CurrencyCode;
  formatted: string; // pre-formatted e.g. "₹12,450"
}

export interface DateRange {
  from: ISODateString;
  to: ISODateString;
}

export interface ApiSuccess<T> {
  data: T;
  error: null;
  meta?: PaginationMeta;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface ImageAsset {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  blurHash?: string;
}

export type TravelClass = 'economy' | 'premium_economy' | 'business' | 'first';

export type TripType = 'one_way' | 'round_trip' | 'multi_city';

export type ComfortLevel = 'budget' | 'comfort' | 'luxury';

export interface TravelerCount {
  adults: number;
  children: number;
  infants: number;
}

export type WeatherCondition =
  | 'sunny'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'snowy'
  | 'foggy'
  | 'windy';

export interface WeatherSnapshot {
  condition: WeatherCondition;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeedKph: number;
  precipitationMm: number;
  uvIndex: number;
  description: string;
  icon: string;
}

export type VisaType = 'visa_free' | 'visa_on_arrival' | 'e_visa' | 'visa_required';

export interface VisaInfo {
  type: VisaType;
  durationDays?: number;
  feeUsd?: number;
  processingDays?: number;
  notes?: string;
}
