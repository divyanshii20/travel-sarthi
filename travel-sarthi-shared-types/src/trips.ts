// ─── Trip Types ───────────────────────────────────────────────────────────────

import type {
  UUID,
  ISODateString,
  ISODateTimeString,
  MoneyAmount,
  TravelerCount,
  ComfortLevel,
} from './common';
import type { FlightResult } from './flights';
import type { Hotel } from './hotels';
import type { Itinerary } from './itinerary';

export type TripStatus =
  | 'planning'
  | 'booked'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type TripVisibility = 'private' | 'link_share' | 'public';

export interface TripMember {
  userId: UUID;
  displayName: string;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'member';
  joinedAt: ISODateTimeString;
}

export interface TripFlightBooking {
  id: UUID;
  flightResult: FlightResult;
  platform: string;
  bookingReference: string | null;
  confirmedAt: ISODateTimeString | null;
  pnr: string | null;
  ticketUrl: string | null;
  totalPaid: MoneyAmount;
  couponsApplied: string[];
  savings: MoneyAmount;
}

export interface TripHotelBooking {
  id: UUID;
  hotel: Hotel;
  checkIn: ISODateString;
  checkOut: ISODateString;
  rooms: number;
  platform: string;
  bookingReference: string | null;
  confirmedAt: ISODateTimeString | null;
  totalPaid: MoneyAmount;
  couponsApplied: string[];
  savings: MoneyAmount;
}

export interface Trip {
  id: UUID;
  userId: UUID;
  title: string;
  destination: string;
  destinationCode: string | null;
  coverImageUrl: string | null;
  status: TripStatus;
  visibility: TripVisibility;
  shareToken: string | null;
  startDate: ISODateString;
  endDate: ISODateString;
  travelers: TravelerCount;
  comfortLevel: ComfortLevel;
  totalBudget: MoneyAmount;
  totalSpent: MoneyAmount;
  totalSavings: MoneyAmount;
  flightBookings: TripFlightBooking[];
  hotelBookings: TripHotelBooking[];
  itineraries: Itinerary[];
  activeItineraryId: UUID | null;
  members: TripMember[];
  isGroupTrip: boolean;
  notes: string | null;
  tags: string[];
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateTripRequestDTO {
  title: string;
  destination: string;
  startDate: ISODateString;
  endDate: ISODateString;
  travelers: TravelerCount;
  comfortLevel: ComfortLevel;
  totalBudget: number;
  currency: string;
  isGroupTrip?: boolean;
  notes?: string;
  tags?: string[];
}

export interface UpdateTripRequestDTO {
  title?: string;
  destination?: string;
  startDate?: ISODateString;
  endDate?: ISODateString;
  travelers?: TravelerCount;
  comfortLevel?: ComfortLevel;
  totalBudget?: number;
  status?: TripStatus;
  visibility?: TripVisibility;
  notes?: string;
  tags?: string[];
  coverImageUrl?: string;
}

export interface AddFlightBookingDTO {
  flightResultId: string;
  platform: string;
  bookingReference?: string;
  pnr?: string;
  totalPaid: number;
  currency: string;
  couponsApplied?: string[];
}

export interface AddHotelBookingDTO {
  hotelId: string;
  checkIn: ISODateString;
  checkOut: ISODateString;
  rooms: number;
  platform: string;
  bookingReference?: string;
  totalPaid: number;
  currency: string;
  couponsApplied?: string[];
}

export interface InviteMemberDTO {
  email: string;
  role: 'admin' | 'member';
}

export interface TripSummary {
  id: UUID;
  title: string;
  destination: string;
  coverImageUrl: string | null;
  status: TripStatus;
  startDate: ISODateString;
  endDate: ISODateString;
  travelers: TravelerCount;
  totalBudget: MoneyAmount;
  totalSavings: MoneyAmount;
  memberCount: number;
  isGroupTrip: boolean;
  hasItinerary: boolean;
  createdAt: ISODateTimeString;
}
