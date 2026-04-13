// ─── Notifications & Push Types ───────────────────────────────────────────────

import type { UUID, ISODateTimeString } from './common';

export type NotificationType =
  | 'fare_alert'
  | 'price_drop'
  | 'flight_disruption'
  | 'booking_confirmed'
  | 'trip_reminder'
  | 'deal_flash'
  | 'group_invite'
  | 'group_vote'
  | 'expense_added'
  | 'settlement_request'
  | 'voyagecoin_earned'
  | 'system_announcement';

export type NotificationChannel = 'push' | 'email' | 'in_app' | 'whatsapp';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Notification {
  id: UUID;
  userId: UUID;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  imageUrl: string | null;
  deeplink: string | null;
  metadata: Record<string, unknown>;
  status: NotificationStatus;
  sentAt: ISODateTimeString | null;
  readAt: ISODateTimeString | null;
  expiresAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
}

export interface NotificationPreferences {
  userId: UUID;
  fareAlerts: boolean;
  flightDisruptions: boolean;
  deals: boolean;
  tripReminders: boolean;
  groupActivity: boolean;
  systemAnnouncements: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  whatsappEnabled: boolean;
  quietHoursStart: string | null; // HH:mm
  quietHoursEnd: string | null;
  updatedAt: ISODateTimeString;
}

export interface PushTokenRegistrationDTO {
  token: string;
  platform: 'android' | 'ios' | 'web';
  deviceId: string;
}

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  templateId: string;
  variables: Record<string, string | number | boolean>;
}

export interface MarkNotificationReadDTO {
  notificationIds: UUID[];
}

export interface UpdateNotificationPreferencesDTO {
  fareAlerts?: boolean;
  flightDisruptions?: boolean;
  deals?: boolean;
  tripReminders?: boolean;
  groupActivity?: boolean;
  systemAnnouncements?: boolean;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  whatsappEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}
