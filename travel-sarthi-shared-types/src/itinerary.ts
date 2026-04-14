// ─── Itinerary Types ──────────────────────────────────────────────────────────

import type {
  UUID,
  ISODateString,
  ISODateTimeString,
  MoneyAmount,
  GeoCoordinates,
  WeatherSnapshot,
  ImageAsset,
} from './common';

export type ActivityCategory =
  | 'sightseeing'
  | 'adventure'
  | 'culture'
  | 'food'
  | 'shopping'
  | 'nightlife'
  | 'wellness'
  | 'transport'
  | 'accommodation'
  | 'nature'
  | 'beach'
  | 'religious';

export type ActivityTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'full_day';

export type TransportMode =
  | 'flight'
  | 'train'
  | 'bus'
  | 'car'
  | 'taxi'
  | 'auto'
  | 'metro'
  | 'ferry'
  | 'walk'
  | 'bicycle';

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  timeOfDay: ActivityTimeOfDay;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  location: {
    name: string;
    address: string;
    coordinates: GeoCoordinates;
    googlePlaceId: string | null;
    mapsUrl: string;
  };
  estimatedCost: MoneyAmount;
  image: ImageAsset | null;
  localTip: string | null;
  bookingRequired: boolean;
  bookingUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  tags: string[];
  isCompleted: boolean;
  isSkipped: boolean;
  customNote: string | null;
}

export interface TravelConnector {
  from: string;
  to: string;
  mode: TransportMode;
  duration: number; // minutes
  estimatedCost: MoneyAmount;
  distanceKm: number;
  description: string;
}

export interface ItinerarySlot {
  slotId: string;
  timeStart: string;
  timeEnd: string;
  durationMin: number;
  type: string;
  activity: string;
  location: string;
  transportMode?: string;
  transportDetail?: string;
  distanceKm?: number;
  costInrPerPerson?: number;
  costInrTotal?: number;
  notes?: string;
  tip?: string;
  bookingRequired?: boolean;
  bookingTip?: string;
  mapQuery?: string;
  highlights?: string[];
  photoSpot?: string;
  cuisine?: string;
  mustTry?: string[];
  vegetarianOptions?: boolean;
  whyNow?: string;
}

export interface ItineraryDayBudgetSummary {
  accommodationInr: number;
  foodInr: number;
  transportInr: number;
  activitiesInr: number;
  miscInr: number;
  dayTotalInr: number;
  dayTotalPerPersonInr: number;
}

export interface ItineraryDay {
  dayNumber: number;
  date: ISODateString;
  city: string;
  country: string;
  heroImage: ImageAsset;
  weather: WeatherSnapshot | null;
  activities: Activity[];
  connectors: TravelConnector[];
  totalEstimatedCost: MoneyAmount;
  notes: string | null;
  dayLabel?: string;
  theme?: string;
  neighborhoodFocus?: string;
  weatherExpected?: string;
  slots?: ItinerarySlot[];
  dayBudgetSummary?: ItineraryDayBudgetSummary;
  dayTips?: string[];
}

export interface ItineraryBudgetBreakdown {
  flights: MoneyAmount;
  accommodation: MoneyAmount;
  food: MoneyAmount;
  activities: MoneyAmount;
  transport: MoneyAmount;
  shopping: MoneyAmount;
  miscellaneous: MoneyAmount;
  total: MoneyAmount;
  totalWithCoupons: MoneyAmount;
  totalSavings: MoneyAmount;
  visaFee?: MoneyAmount;
  shoppingBuffer?: MoneyAmount;
  grandTotal?: MoneyAmount;
  perPerson?: MoneyAmount;
  vsBudget?: 'under' | 'within' | 'slightly over' | 'over';
  savingsTips?: string[];
}

export interface ItineraryTripSummary {
  totalDays: number;
  totalTravelers: number;
  budgetTier: 'Budget' | 'Mid-range' | 'Luxury';
  estimatedTotalInr: number;
  estimatedPerPersonInr: number;
  bestCurrency: string;
  exchangeRateNote: string;
  weatherDuringTrip: string;
  languageTip: string;
  emergencyNumber: string;
  indianEmbassy: string;
}

export interface ItineraryHotelRecommendation {
  name: string;
  area: string;
  tier: 'Budget' | 'Mid' | 'Luxury';
  whyHere: string;
  priceInrPerNight: number;
  bookingPlatform: string;
  checkInDay: number;
  checkOutDay: number;
  nights: number;
  bookingUrl?: string | null;
}

export interface ItineraryTransportSummaryItem {
  mode: string;
  costInr: number;
  durationMin?: number;
  departTime?: string;
}

export interface ItineraryTransportSummary {
  airportTransferIn?: ItineraryTransportSummaryItem;
  airportTransferOut?: ItineraryTransportSummaryItem;
  dayPasses: string[];
  appDownloads: string[];
}

export interface ItineraryExperienceBuckets {
  mustDo: string[];
  foodTrail: string[];
  offBeatenPath: string[];
  splurgeIfPossible: string[];
  skip: string[];
}

export interface ItineraryDayTrip {
  name: string;
  distanceKm: number;
  durationHours: number;
  transport: string;
  bestDay: string;
  costInrPerPerson: number;
  highlights: string[];
}

export interface ItineraryCulturalGuide {
  dos: string[];
  donts: string[];
  scamsToAvoid: string[];
  indianSpecific: string[];
}

export interface ItineraryPackingList {
  essentials: string[];
  clothing: string[];
  health: string[];
  tech: string[];
}

export interface Itinerary {
  id: UUID;
  tripId: UUID;
  title: string;
  destination: string;
  startDate: ISODateString;
  endDate: ISODateString;
  durationDays: number;
  days: ItineraryDay[];
  budgetBreakdown: ItineraryBudgetBreakdown;
  generatedAt: ISODateTimeString;
  generatedBy: 'ai' | 'user';
  version: number;
  isPublic: boolean;
  shareToken: string | null;
  country?: string;
  flag?: string;
  mode?: 'A' | 'B';
  heroImage?: string | null;
  tripSummary?: ItineraryTripSummary;
  preTripChecklist?: string[];
  hotels?: ItineraryHotelRecommendation[];
  transportSummary?: ItineraryTransportSummary;
  experiencesByCategory?: ItineraryExperienceBuckets;
  dayTrips?: ItineraryDayTrip[];
  culturalGuide?: ItineraryCulturalGuide;
  packingList?: ItineraryPackingList;
}

// ─── Generation DTOs ──────────────────────────────────────────────────────────

export type ItineraryStyle = 'adventure' | 'cultural' | 'relaxation' | 'foodie' | 'romantic' | 'family' | 'budget';
export type PacePreference = 'slow' | 'moderate' | 'packed';

export interface GenerateItineraryRequestDTO {
  destination: string;
  startDate: ISODateString;
  endDate: ISODateString;
  travelers: { adults: number; children: number; infants: number };
  budgetTotal: number;
  currency: string;
  style: ItineraryStyle[];
  pace: PacePreference;
  avoidCategories?: ActivityCategory[];
  mustInclude?: string[];
  flightInfo?: {
    origin: string;
    flightNumber?: string;
  };
  hotelName?: string;
  existingTripId?: UUID;
}

export interface GenerateItineraryResponseDTO {
  itinerary: Itinerary;
  generationTokensUsed: number;
  cachedAt: ISODateTimeString | null;
}

export interface SwapActivityRequestDTO {
  itineraryId: UUID;
  dayNumber: number;
  activityId: string;
  reason?: string;
}

export interface SwapActivityResponseDTO {
  replacement: Activity;
  reason: string;
}

export interface UpdateActivityStatusDTO {
  isCompleted?: boolean;
  isSkipped?: boolean;
  customNote?: string;
}

export interface ExportItineraryRequestDTO {
  format: 'pdf' | 'notion' | 'google_calendar' | 'email';
  includeMap?: boolean;
  includeBudget?: boolean;
  includeWeather?: boolean;
}
