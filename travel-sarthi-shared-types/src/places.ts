// ─── Places & Weather Types ───────────────────────────────────────────────────

import type {
  UUID,
  ISODateTimeString,
  GeoCoordinates,
  ImageAsset,
  WeatherSnapshot,
  ISODateString,
} from './common';

// ─── Places ───────────────────────────────────────────────────────────────────

export type PlaceType =
  | 'attraction'
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'hotel'
  | 'shopping'
  | 'museum'
  | 'park'
  | 'beach'
  | 'temple'
  | 'mosque'
  | 'church'
  | 'hospital'
  | 'pharmacy'
  | 'atm'
  | 'transport';

export interface PlaceHours {
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
  isOpenNow: boolean | null;
}

export interface Place {
  id: string;
  googlePlaceId: string | null;
  foursquareId: string | null;
  name: string;
  type: PlaceType;
  address: string;
  city: string;
  country: string;
  coordinates: GeoCoordinates;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: 1 | 2 | 3 | 4 | null;
  hours: PlaceHours | null;
  phone: string | null;
  website: string | null;
  images: ImageAsset[];
  description: string | null;
  tags: string[];
  googleMapsUrl: string;
  isVerified: boolean;
  cachedAt: ISODateTimeString;
}

export interface PlacesSearchRequestDTO {
  query?: string;
  location: string; // city or "lat,lng"
  type?: PlaceType[];
  radius?: number; // meters
  limit?: number;
  openNow?: boolean;
  minRating?: number;
}

export interface PlacesSearchResponseDTO {
  places: Place[];
  totalResults: number;
  searchCenter: GeoCoordinates;
  cachedAt: ISODateTimeString;
}

// ─── Weather ──────────────────────────────────────────────────────────────────

export interface WeatherForecastDay {
  date: ISODateString;
  snapshot: WeatherSnapshot;
  sunrise: string; // HH:mm
  sunset: string;
  moonPhase: string | null;
  isGoodForTravel: boolean;
  travelAdvice: string | null;
}

export interface WeatherForecast {
  location: string;
  country: string;
  coordinates: GeoCoordinates;
  timezone: string;
  current: WeatherSnapshot;
  daily: WeatherForecastDay[];
  hourly: {
    time: ISODateTimeString;
    temp: number;
    feelsLike: number;
    condition: string;
    precipitationMm: number;
    windSpeedKph: number;
  }[];
  source: 'open_meteo' | 'weatherapi';
  cachedAt: ISODateTimeString;
}

export interface WeatherRequestDTO {
  location: string; // city name or "lat,lng"
  forecastDays?: number; // 1-14
}
