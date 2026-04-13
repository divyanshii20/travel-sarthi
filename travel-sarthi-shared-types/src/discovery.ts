// ─── Discovery & Destination Types ───────────────────────────────────────────

import type {
  UUID,
  ISODateString,
  ISODateTimeString,
  MoneyAmount,
  GeoCoordinates,
  ImageAsset,
  VisaInfo,
  WeatherSnapshot,
  CurrencyCode,
} from './common';

export type DestinationContinent =
  | 'asia'
  | 'europe'
  | 'north_america'
  | 'south_america'
  | 'africa'
  | 'oceania'
  | 'middle_east';

export type TravelMood =
  | 'beaches'
  | 'mountains'
  | 'culture'
  | 'adventure'
  | 'food'
  | 'shopping'
  | 'nightlife'
  | 'wildlife'
  | 'spiritual'
  | 'romance'
  | 'family'
  | 'budget';

// ─── 8-Dimension Destination Score ───────────────────────────────────────────

export interface DestinationScore {
  overall: number; // 0-100
  affordability: number;
  safety: number;
  weatherScore: number;
  touristInfrastructure: number;
  uniqueness: number;
  visaEase: number;
  travelTime: number; // from India
  communityRating: number;
  badge: 'trending' | 'hidden_gem' | 'budget_pick' | 'luxury' | 'family_friendly' | 'adventure' | null;
}

export interface BudgetEstimate {
  budget: MoneyAmount; // per person per day
  comfort: MoneyAmount;
  luxury: MoneyAmount;
  flightFrom: MoneyAmount; // from major Indian cities
  averageHotelPerNight: MoneyAmount;
  averageMealCost: MoneyAmount;
}

export interface DestinationHighlight {
  title: string;
  description: string;
  image: ImageAsset;
  category: string;
}

export interface BestTimeToVisit {
  months: number[]; // 1-12
  reason: string;
  weather: string;
  crowdLevel: 'low' | 'medium' | 'high';
  priceLevel: 'budget' | 'moderate' | 'peak';
}

export interface Destination {
  id: UUID;
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  continent: DestinationContinent;
  coordinates: GeoCoordinates;
  airportCodes: string[];
  heroImage: ImageAsset;
  images: ImageAsset[];
  tagline: string;
  description: string;
  moods: TravelMood[];
  score: DestinationScore;
  budget: BudgetEstimate;
  visa: VisaInfo;
  highlights: DestinationHighlight[];
  bestTimeToVisit: BestTimeToVisit[];
  currentWeather: WeatherSnapshot | null;
  popularActivities: string[];
  cuisineHighlights: string[];
  localTips: string[];
  safetyRating: number; // 1-10
  languageBarrier: 'none' | 'low' | 'medium' | 'high';
  currency: CurrencyCode;
  timezoneName: string;
  utcOffset: number;
  isPopular: boolean;
  isTrending: boolean;
  isHiddenGem: boolean;
  rank: number; // overall rank
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface DiscoverRequestDTO {
  budget?: number;
  currency?: CurrencyCode;
  budgetDays?: number;
  moods?: TravelMood[];
  continent?: DestinationContinent;
  departMonth?: number; // 1-12
  durationDays?: number;
  fromAirport?: string;
  visaTypes?: string[];
  minSafetyRating?: number;
  sortBy?: 'score' | 'price' | 'safety' | 'trending' | 'hidden_gem';
  page?: number;
  limit?: number;
}

export interface DiscoverResponseDTO {
  destinations: Destination[];
  totalResults: number;
  featured: Destination[];
  trending: Destination[];
  hiddenGems: Destination[];
}

export interface CompareDestinationsRequestDTO {
  destinationIds: UUID[];
}

export interface CompareDestinationsResponseDTO {
  destinations: Destination[];
  comparison: {
    winner: UUID;
    metrics: {
      metric: string;
      values: { destinationId: UUID; value: number | string; isBest: boolean }[];
    }[];
  };
}
