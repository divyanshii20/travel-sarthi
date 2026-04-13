// ─── Sarthi AI Chat Types ─────────────────────────────────────────────────────

import type { UUID, ISODateTimeString, GeoCoordinates } from './common';

// ─── 8 Query Categories ───────────────────────────────────────────────────────

export type SarthiQueryCategory =
  | 'flight_advice'
  | 'hotel_recommendation'
  | 'itinerary_question'
  | 'local_tips'
  | 'budget_advice'
  | 'disruption_help'
  | 'visa_info'
  | 'general_travel';

export type MessageRole = 'user' | 'assistant' | 'system';

export type ActionCardType =
  | 'search_flights'
  | 'view_itinerary'
  | 'show_hotels'
  | 'view_deals'
  | 'show_map'
  | 'view_disruption'
  | 'check_visa'
  | 'contact_support';

export interface ActionCard {
  type: ActionCardType;
  label: string;
  payload: Record<string, unknown>;
  icon: string;
}

export interface PlacesMapCard {
  title: string;
  places: {
    name: string;
    description: string;
    coordinates: GeoCoordinates;
    rating: number | null;
    category: string;
    imageUrl: string | null;
  }[];
  mapCenter: GeoCoordinates;
  zoom: number;
}

export interface ChatMessage {
  id: UUID;
  sessionId: UUID;
  role: MessageRole;
  content: string;
  category: SarthiQueryCategory | null;
  actionCards: ActionCard[];
  placesMapCard: PlacesMapCard | null;
  quickReplies: string[];
  isTyping: boolean;
  tokensUsed: number | null;
  createdAt: ISODateTimeString;
}

// ─── Trip Context Object ──────────────────────────────────────────────────────

export interface TripContext {
  tripId: UUID;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: { adults: number; children: number; infants: number };
  currentDay: number | null;
  activeItineraryId: UUID | null;
  flightDetails: {
    flightNumber: string | null;
    airline: string | null;
    nextFlight: string | null;
  } | null;
  hotelDetails: {
    name: string | null;
    checkIn: string | null;
    checkOut: string | null;
  } | null;
  disruption: {
    type: string;
    severity: string;
  } | null;
}

export interface ChatSession {
  id: UUID;
  userId: UUID;
  tripContext: TripContext | null;
  messages: ChatMessage[];
  isActive: boolean;
  mode: 'standalone' | 'trip_mode' | 'disruption_mode';
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface SendMessageRequestDTO {
  sessionId: UUID | null; // null = new session
  message: string;
  tripId?: UUID;
}

export interface SendMessageResponseDTO {
  session: ChatSession;
  message: ChatMessage;
  responseMessage: ChatMessage;
}

export interface StartSessionRequestDTO {
  tripId?: UUID;
  mode?: 'standalone' | 'trip_mode' | 'disruption_mode';
}
