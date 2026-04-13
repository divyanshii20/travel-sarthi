// ─── Hotel Types ──────────────────────────────────────────────────────────────

import type {
  UUID,
  ISODateString,
  ISODateTimeString,
  CurrencyCode,
  MoneyAmount,
  GeoCoordinates,
  ImageAsset,
} from './common';
import type { BookingPlatform, CouponOffer, BankOffer } from './flights';

export type HotelStarRating = 1 | 2 | 3 | 4 | 5;
export type HotelPropertyType =
  | 'hotel'
  | 'resort'
  | 'villa'
  | 'hostel'
  | 'apartment'
  | 'guesthouse'
  | 'boutique';

export type MealPlanType = 'room_only' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive';

export type HotelBookingPlatform =
  | 'makemytrip'
  | 'goibibo'
  | 'cleartrip'
  | 'booking_com'
  | 'agoda'
  | 'hotels_com'
  | 'expedia'
  | 'airbnb';

export interface HotelAmenity {
  id: string;
  name: string;
  icon: string;
  category: 'basic' | 'wellness' | 'dining' | 'business' | 'family' | 'transport';
}

export interface HotelReview {
  platform: string;
  rating: number;
  reviewCount: number;
  breakdown: {
    cleanliness: number;
    location: number;
    service: number;
    valueForMoney: number;
    facilities: number;
  };
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  maxOccupancy: number;
  bedConfiguration: string;
  sizeSqm: number | null;
  amenities: string[];
  images: ImageAsset[];
  refundable: boolean;
  mealPlan: MealPlanType;
}

export interface HotelPlatformPrice {
  platform: HotelBookingPlatform;
  pricePerNight: MoneyAmount;
  totalPrice: MoneyAmount;
  deeplink: string;
  isCheapest: boolean;
  taxes: MoneyAmount;
  discount: MoneyAmount | null;
  availableRooms: number | null;
  roomType: string;
  mealPlan: MealPlanType;
}

export interface HotelScore {
  overall: number; // 0-100
  location: number;
  valueForMoney: number;
  amenities: number;
  guestRating: number;
  travelSarthiPick: boolean;
  badge: 'best_value' | 'top_rated' | 'best_location' | 'hidden_gem' | null;
}

export interface Hotel {
  id: string;
  name: string;
  propertyType: HotelPropertyType;
  starRating: HotelStarRating;
  address: string;
  city: string;
  country: string;
  coordinates: GeoCoordinates;
  images: ImageAsset[];
  description: string;
  amenities: HotelAmenity[];
  roomTypes: RoomType[];
  reviews: HotelReview[];
  checkInTime: string; // HH:mm
  checkOutTime: string; // HH:mm
  prices: HotelPlatformPrice[];
  bestPrice: MoneyAmount;
  coupons: CouponOffer[];
  bankOffers: BankOffer[];
  score: HotelScore;
  distanceFromCenterKm: number;
  distanceFromAirportKm: number | null;
  nearbyPlaces: NearbyPlace[];
  policies: HotelPolicies;
}

export interface NearbyPlace {
  name: string;
  type: string;
  distanceKm: number;
  walkingMinutes: number | null;
}

export interface HotelPolicies {
  checkIn: string;
  checkOut: string;
  cancellation: string;
  children: string;
  pets: string;
  smoking: boolean;
}

// ─── Search DTOs ──────────────────────────────────────────────────────────────

export interface HotelSearchRequestDTO {
  destination: string;
  checkIn: ISODateString;
  checkOut: ISODateString;
  rooms: number;
  adults: number;
  children: number;
  currency?: CurrencyCode;
  starRating?: HotelStarRating[];
  propertyType?: HotelPropertyType[];
  maxPricePerNight?: number;
  amenities?: string[];
  mealPlan?: MealPlanType;
  guestRatingMin?: number;
  sortBy?: 'price' | 'rating' | 'score' | 'distance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface HotelSearchResponseDTO {
  results: Hotel[];
  searchId: string;
  searchedAt: ISODateTimeString;
  totalResults: number;
  currency: CurrencyCode;
  nightsCount: number;
  filters: HotelFilterOptions;
}

export interface HotelFilterOptions {
  starRatings: { value: HotelStarRating; count: number }[];
  propertyTypes: { value: HotelPropertyType; label: string; count: number }[];
  amenities: { id: string; name: string; count: number }[];
  priceRange: { min: number; max: number };
  guestRatingRange: { min: number; max: number };
  mealPlans: { value: MealPlanType; label: string; count: number }[];
}
