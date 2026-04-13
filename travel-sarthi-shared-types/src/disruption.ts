// ─── Flight Disruption Types ──────────────────────────────────────────────────

import type { UUID, ISODateTimeString, MoneyAmount } from './common';
import type { FlightSegment } from './flights';
import type { TransportMode } from './itinerary';

export type DisruptionType = 'delay' | 'cancellation' | 'diversion' | 'gate_change' | 'crew_change';

export type DisruptionSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RecoveryOptionType = 'fastest' | 'cheapest' | 'comfortable';

// ─── DGCA Rights ──────────────────────────────────────────────────────────────

export interface DGCARights {
  compensationAmount: MoneyAmount | null;
  mealEntitlement: boolean;
  hotelEntitlement: boolean;
  refundEntitlement: boolean;
  reroutingEntitlement: boolean;
  explanation: string;
  claimInstructions: string[];
  isApplicable: boolean;
  condition: string;
  delayThresholdHours: number;
}

// ─── Recovery Options ─────────────────────────────────────────────────────────

export interface RecoverySegment {
  mode: TransportMode;
  carrier: string;
  origin: string;
  destination: string;
  departureTime: ISODateTimeString;
  arrivalTime: ISODateTimeString;
  duration: number; // minutes
  bookingUrl: string | null;
  estimatedCost: MoneyAmount;
}

export interface RecoveryOption {
  type: RecoveryOptionType;
  label: string;
  totalDuration: number; // minutes vs original
  deltaMinutes: number; // vs original arrival
  estimatedCost: MoneyAmount;
  segments: RecoverySegment[];
  explanation: string;
  confidence: number; // 0-1
}

// ─── Disruption Event ─────────────────────────────────────────────────────────

export interface DisruptionEvent {
  id: UUID;
  tripId: UUID | null;
  userId: UUID | null;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  scheduledDeparture: ISODateTimeString;
  actualDeparture: ISODateTimeString | null;
  scheduledArrival: ISODateTimeString;
  estimatedArrival: ISODateTimeString | null;
  disruptionType: DisruptionType;
  severity: DisruptionSeverity;
  delayMinutes: number | null;
  reason: string | null;
  dgcaRights: DGCARights;
  recoveryOptions: RecoveryOption[];
  revisedItinerary: RevisedItinerary | null;
  notificationSentAt: ISODateTimeString | null;
  resolvedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface RevisedItinerary {
  affectedDays: number[];
  changes: ItineraryChange[];
  summary: string;
  generatedAt: ISODateTimeString;
}

export interface ItineraryChange {
  dayNumber: number;
  type: 'reschedule' | 'replace' | 'remove' | 'add';
  activityId: string | null;
  description: string;
  newTime: string | null;
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export interface AeroDataBoxWebhookPayload {
  flightNumber: string;
  date: string;
  status: string;
  departure: {
    scheduledTime: string;
    actualTime: string | null;
    terminal: string | null;
    gate: string | null;
  };
  arrival: {
    scheduledTime: string;
    estimatedTime: string | null;
    actualTime: string | null;
    terminal: string | null;
    gate: string | null;
    baggage: string | null;
  };
  delay: number | null;
  aircraftRegistration: string | null;
}
