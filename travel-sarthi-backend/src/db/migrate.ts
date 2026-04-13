import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('🔄 Running migrations (push schema)...');

  const pool = new Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const db = drizzle(pool, { schema });

  // Drop all tables in reverse FK dependency order
  await db.execute(sql`
    DROP TABLE IF EXISTS "push_tokens" CASCADE;
    DROP TABLE IF EXISTS "notification_preferences" CASCADE;
    DROP TABLE IF EXISTS "notifications" CASCADE;
    DROP TABLE IF EXISTS "price_alerts" CASCADE;
    DROP TABLE IF EXISTS "group_expenses" CASCADE;
    DROP TABLE IF EXISTS "group_votes" CASCADE;
    DROP TABLE IF EXISTS "chat_messages" CASCADE;
    DROP TABLE IF EXISTS "chat_sessions" CASCADE;
    DROP TABLE IF EXISTS "disruption_events" CASCADE;
    DROP TABLE IF EXISTS "flash_deals" CASCADE;
    DROP TABLE IF EXISTS "coupons" CASCADE;
    DROP TABLE IF EXISTS "itinerary_generation_cache" CASCADE;
    DROP TABLE IF EXISTS "itineraries" CASCADE;
    DROP TABLE IF EXISTS "trip_members" CASCADE;
    DROP TABLE IF EXISTS "trips" CASCADE;
    DROP TABLE IF EXISTS "destinations" CASCADE;
    DROP TABLE IF EXISTS "hotel_search_cache" CASCADE;
    DROP TABLE IF EXISTS "fare_alerts" CASCADE;
    DROP TABLE IF EXISTS "price_prediction_cache" CASCADE;
    DROP TABLE IF EXISTS "flight_search_cache" CASCADE;
    DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
    DROP TABLE IF EXISTS "sessions" CASCADE;
    DROP TABLE IF EXISTS "voyage_coin_transactions" CASCADE;
    DROP TABLE IF EXISTS "users" CASCADE;
  `);

  // Drop and recreate enum types
  await db.execute(sql`
    DROP TYPE IF EXISTS "user_role" CASCADE;
    DROP TYPE IF EXISTS "auth_provider" CASCADE;
    DROP TYPE IF EXISTS "two_factor_method" CASCADE;
    CREATE TYPE "user_role" AS ENUM ('user', 'admin', 'support');
    CREATE TYPE "auth_provider" AS ENUM ('email', 'google');
    CREATE TYPE "two_factor_method" AS ENUM ('totp', 'sms', 'email');
  `);

  // Create all tables matching the actual Drizzle schema definitions
  await db.execute(sql`
    CREATE TABLE "users" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" varchar(255) NOT NULL UNIQUE,
      "password_hash" varchar(255),
      "display_name" varchar(100) NOT NULL,
      "avatar_url" text,
      "role" "user_role" NOT NULL DEFAULT 'user',
      "is_email_verified" boolean NOT NULL DEFAULT false,
      "email_verification_token" varchar(255),
      "email_verification_expires" timestamptz,
      "password_reset_token" varchar(255),
      "password_reset_expires" timestamptz,
      "is_two_factor_enabled" boolean NOT NULL DEFAULT false,
      "two_factor_method" "two_factor_method",
      "totp_secret" varchar(255),
      "totp_backup_codes" text[],
      "auth_provider" "auth_provider" NOT NULL DEFAULT 'email',
      "google_id" varchar(255) UNIQUE,
      "voyage_coin_balance" integer NOT NULL DEFAULT 0,
      "preferred_currency" varchar(3) NOT NULL DEFAULT 'INR',
      "preferred_language" varchar(10) NOT NULL DEFAULT 'en',
      "fcm_token" text,
      "last_login_at" timestamptz,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "voyage_coin_transactions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "amount" integer NOT NULL,
      "type" varchar(20) NOT NULL,
      "description" text NOT NULL,
      "reference_id" uuid,
      "reference_type" varchar(50),
      "balance_after" integer NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "sessions" (
      "id" varchar(255) PRIMARY KEY,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "expires_at" timestamptz NOT NULL,
      "ip_address" varchar(45),
      "user_agent" text,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "refresh_tokens" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "session_id" varchar(255) NOT NULL REFERENCES "sessions"("id") ON DELETE CASCADE,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "token_hash" varchar(255) NOT NULL UNIQUE,
      "expires_at" timestamptz NOT NULL,
      "revoked_at" timestamptz,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "flight_search_cache" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "cache_key" varchar(512) NOT NULL UNIQUE,
      "origin" varchar(3) NOT NULL,
      "destination" varchar(3) NOT NULL,
      "depart_date" varchar(10) NOT NULL,
      "return_date" varchar(10),
      "cabin_class" varchar(20) NOT NULL,
      "adults" integer NOT NULL,
      "children" integer NOT NULL DEFAULT 0,
      "infants" integer NOT NULL DEFAULT 0,
      "results_json" jsonb NOT NULL,
      "result_count" integer NOT NULL,
      "expires_at" timestamptz NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "price_prediction_cache" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "cache_key" varchar(512) NOT NULL UNIQUE,
      "origin" varchar(3) NOT NULL,
      "destination" varchar(3) NOT NULL,
      "depart_date" varchar(10) NOT NULL,
      "cabin_class" varchar(20) NOT NULL,
      "prediction_json" jsonb NOT NULL,
      "signal" varchar(20) NOT NULL,
      "confidence" real NOT NULL,
      "expires_at" timestamptz NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "fare_alerts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "origin" varchar(3) NOT NULL,
      "destination" varchar(3) NOT NULL,
      "depart_date_from" varchar(10) NOT NULL,
      "depart_date_to" varchar(10) NOT NULL,
      "target_price" integer NOT NULL,
      "currency" varchar(3) NOT NULL DEFAULT 'INR',
      "cabin_class" varchar(20) NOT NULL,
      "travelers_json" jsonb NOT NULL,
      "frequency" varchar(20) NOT NULL DEFAULT 'daily',
      "channels_json" jsonb NOT NULL,
      "is_active" boolean NOT NULL DEFAULT true,
      "last_checked_at" timestamptz,
      "last_alert_sent_at" timestamptz,
      "trigger_count" integer NOT NULL DEFAULT 0,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "hotel_search_cache" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "cache_key" varchar(512) NOT NULL UNIQUE,
      "destination" varchar(255) NOT NULL,
      "check_in" varchar(10) NOT NULL,
      "check_out" varchar(10) NOT NULL,
      "rooms" integer NOT NULL,
      "adults" integer NOT NULL,
      "children" integer NOT NULL DEFAULT 0,
      "results_json" jsonb NOT NULL,
      "result_count" integer NOT NULL,
      "expires_at" timestamptz NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "destinations" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "slug" varchar(100) NOT NULL UNIQUE,
      "name" varchar(150) NOT NULL,
      "country" varchar(100) NOT NULL,
      "country_code" varchar(2) NOT NULL,
      "continent" varchar(30) NOT NULL,
      "lat" varchar(20) NOT NULL,
      "lng" varchar(20) NOT NULL,
      "airport_codes" varchar(10)[] NOT NULL DEFAULT '{}',
      "hero_image_url" varchar(1000) NOT NULL,
      "images_json" jsonb NOT NULL DEFAULT '[]',
      "tagline" varchar(255) NOT NULL,
      "description" varchar(2000) NOT NULL,
      "moods_json" jsonb NOT NULL DEFAULT '[]',
      "score_json" jsonb NOT NULL,
      "budget_json" jsonb NOT NULL,
      "visa_json" jsonb NOT NULL,
      "highlights_json" jsonb NOT NULL DEFAULT '[]',
      "best_time_json" jsonb NOT NULL DEFAULT '[]',
      "popular_activities" varchar(200)[] NOT NULL DEFAULT '{}',
      "cuisine_highlights" varchar(100)[] NOT NULL DEFAULT '{}',
      "local_tips" varchar(500)[] NOT NULL DEFAULT '{}',
      "safety_rating" integer NOT NULL,
      "language_barrier" varchar(10) NOT NULL DEFAULT 'low',
      "currency" varchar(3) NOT NULL,
      "timezone_name" varchar(50) NOT NULL,
      "utc_offset" real NOT NULL,
      "is_popular" integer NOT NULL DEFAULT 0,
      "is_trending" integer NOT NULL DEFAULT 0,
      "is_hidden_gem" integer NOT NULL DEFAULT 0,
      "rank" integer NOT NULL DEFAULT 999,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "trips" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "title" varchar(255) NOT NULL,
      "destination" varchar(255) NOT NULL,
      "destination_code" varchar(3),
      "cover_image_url" text,
      "status" varchar(30) NOT NULL DEFAULT 'planning',
      "visibility" varchar(20) NOT NULL DEFAULT 'private',
      "share_token" varchar(64) UNIQUE,
      "start_date" varchar(10) NOT NULL,
      "end_date" varchar(10) NOT NULL,
      "travelers_json" jsonb NOT NULL,
      "comfort_level" varchar(20) NOT NULL DEFAULT 'comfort',
      "total_budget_amount" integer NOT NULL,
      "total_budget_currency" varchar(3) NOT NULL DEFAULT 'INR',
      "total_spent_amount" integer NOT NULL DEFAULT 0,
      "total_savings_amount" integer NOT NULL DEFAULT 0,
      "flight_bookings_json" jsonb NOT NULL DEFAULT '[]',
      "hotel_bookings_json" jsonb NOT NULL DEFAULT '[]',
      "active_itinerary_id" uuid,
      "is_group_trip" boolean NOT NULL DEFAULT false,
      "notes" text,
      "tags" varchar(50)[] NOT NULL DEFAULT '{}',
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "trip_members" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "role" varchar(20) NOT NULL DEFAULT 'member',
      "joined_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "itineraries" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "title" varchar(255) NOT NULL,
      "destination" varchar(255) NOT NULL,
      "start_date" varchar(10) NOT NULL,
      "end_date" varchar(10) NOT NULL,
      "duration_days" integer NOT NULL,
      "days_json" jsonb NOT NULL DEFAULT '[]',
      "budget_json" jsonb NOT NULL,
      "generated_by" varchar(10) NOT NULL DEFAULT 'ai',
      "version" integer NOT NULL DEFAULT 1,
      "is_public" boolean NOT NULL DEFAULT false,
      "share_token" varchar(64) UNIQUE,
      "generation_prompt" text,
      "tokens_used" integer,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "itinerary_generation_cache" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "cache_key" varchar(512) NOT NULL UNIQUE,
      "destination" varchar(255) NOT NULL,
      "start_date" varchar(10) NOT NULL,
      "end_date" varchar(10) NOT NULL,
      "itinerary_json" jsonb NOT NULL,
      "expires_at" timestamptz NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "coupons" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "code" varchar(50) NOT NULL UNIQUE,
      "title" varchar(255) NOT NULL,
      "description" text NOT NULL,
      "category" varchar(30) NOT NULL,
      "platform" varchar(30) NOT NULL DEFAULT 'all',
      "discount_type" varchar(20) NOT NULL,
      "discount_value" integer NOT NULL,
      "max_discount_amount" integer,
      "max_discount_currency" varchar(3) DEFAULT 'INR',
      "min_purchase_amount" integer,
      "min_purchase_currency" varchar(3) DEFAULT 'INR',
      "bank_name" varchar(100),
      "card_network" varchar(20),
      "card_type" varchar(10),
      "is_stackable" boolean NOT NULL DEFAULT false,
      "stackable_with" varchar(50)[] NOT NULL DEFAULT '{}',
      "usage_limit" integer,
      "used_count" integer NOT NULL DEFAULT 0,
      "per_user_limit" integer,
      "expires_at" timestamptz,
      "is_active" boolean NOT NULL DEFAULT true,
      "is_verified" boolean NOT NULL DEFAULT false,
      "success_rate" real,
      "last_verified_at" timestamptz,
      "terms_and_conditions" text NOT NULL DEFAULT '',
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "flash_deals" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" varchar(255) NOT NULL,
      "subtitle" varchar(255) NOT NULL,
      "origin" varchar(100) NOT NULL,
      "destination" varchar(100) NOT NULL,
      "image_url" text NOT NULL,
      "sale_price_amount" integer NOT NULL,
      "sale_price_currency" varchar(3) NOT NULL DEFAULT 'INR',
      "original_price_amount" integer NOT NULL,
      "platform" varchar(30) NOT NULL,
      "deeplink" text NOT NULL,
      "expires_at" timestamptz NOT NULL,
      "seats_left" integer,
      "is_live" boolean NOT NULL DEFAULT true,
      "deal_type" varchar(20) NOT NULL DEFAULT 'flash',
      "travel_window_from" varchar(10) NOT NULL,
      "travel_window_to" varchar(10) NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "disruption_events" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "trip_id" uuid REFERENCES "trips"("id") ON DELETE SET NULL,
      "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
      "flight_number" varchar(20) NOT NULL,
      "airline" varchar(100) NOT NULL,
      "origin" varchar(3) NOT NULL,
      "destination" varchar(3) NOT NULL,
      "scheduled_departure" timestamptz NOT NULL,
      "actual_departure" timestamptz,
      "scheduled_arrival" timestamptz NOT NULL,
      "estimated_arrival" timestamptz,
      "disruption_type" varchar(30) NOT NULL,
      "severity" varchar(20) NOT NULL,
      "delay_minutes" integer,
      "reason" text,
      "dgca_rights_json" jsonb NOT NULL,
      "recovery_options_json" jsonb NOT NULL DEFAULT '[]',
      "revised_itinerary_json" jsonb,
      "raw_webhook_json" jsonb,
      "notification_sent_at" timestamptz,
      "resolved_at" timestamptz,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "chat_sessions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "trip_id" uuid REFERENCES "trips"("id") ON DELETE SET NULL,
      "trip_context_json" jsonb,
      "mode" varchar(30) NOT NULL DEFAULT 'standalone',
      "is_active" boolean NOT NULL DEFAULT true,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "chat_messages" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "session_id" uuid NOT NULL REFERENCES "chat_sessions"("id") ON DELETE CASCADE,
      "role" varchar(20) NOT NULL,
      "content" text NOT NULL,
      "category" varchar(50),
      "action_cards_json" jsonb NOT NULL DEFAULT '[]',
      "places_map_card_json" jsonb,
      "quick_replies_json" jsonb NOT NULL DEFAULT '[]',
      "tokens_used" integer,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "group_votes" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
      "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "title" varchar(255) NOT NULL,
      "description" text,
      "type" varchar(30) NOT NULL,
      "options_json" jsonb NOT NULL DEFAULT '[]',
      "status" varchar(20) NOT NULL DEFAULT 'open',
      "decided_option_id" uuid,
      "deadline" timestamptz,
      "allow_multiple" boolean NOT NULL DEFAULT false,
      "anonymous_voting" boolean NOT NULL DEFAULT false,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "closed_at" timestamptz
    );

    CREATE TABLE "group_expenses" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
      "paid_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "title" varchar(255) NOT NULL,
      "description" text,
      "category" varchar(30) NOT NULL,
      "amount_value" integer NOT NULL,
      "amount_currency" varchar(3) NOT NULL DEFAULT 'INR',
      "splits_json" jsonb NOT NULL DEFAULT '[]',
      "split_method" varchar(20) NOT NULL DEFAULT 'equal',
      "receipt_url" text,
      "date" varchar(10) NOT NULL,
      "is_settled" boolean NOT NULL DEFAULT false,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "price_alerts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "origin" varchar(3) NOT NULL,
      "destination" varchar(3) NOT NULL,
      "depart_date_from" varchar(10) NOT NULL,
      "depart_date_to" varchar(10) NOT NULL,
      "target_price_amount" integer NOT NULL,
      "target_price_currency" varchar(3) NOT NULL DEFAULT 'INR',
      "cabin_class" varchar(20) NOT NULL,
      "travelers_json" jsonb NOT NULL,
      "frequency" varchar(20) NOT NULL DEFAULT 'daily',
      "channels_json" jsonb NOT NULL,
      "is_active" boolean NOT NULL DEFAULT true,
      "last_checked_at" timestamptz,
      "last_alert_sent_at" timestamptz,
      "trigger_count" integer NOT NULL DEFAULT 0,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "notifications" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "type" varchar(50) NOT NULL,
      "channel" varchar(20) NOT NULL,
      "title" varchar(255) NOT NULL,
      "body" text NOT NULL,
      "image_url" text,
      "deeplink" text,
      "metadata" jsonb NOT NULL DEFAULT '{}',
      "status" varchar(20) NOT NULL DEFAULT 'pending',
      "sent_at" timestamptz,
      "read_at" timestamptz,
      "expires_at" timestamptz,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "notification_preferences" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
      "fare_alerts" boolean NOT NULL DEFAULT true,
      "flight_disruptions" boolean NOT NULL DEFAULT true,
      "deals" boolean NOT NULL DEFAULT true,
      "trip_reminders" boolean NOT NULL DEFAULT true,
      "group_activity" boolean NOT NULL DEFAULT true,
      "system_announcements" boolean NOT NULL DEFAULT true,
      "email_enabled" boolean NOT NULL DEFAULT true,
      "push_enabled" boolean NOT NULL DEFAULT true,
      "whatsapp_enabled" boolean NOT NULL DEFAULT false,
      "quiet_hours_start" varchar(5),
      "quiet_hours_end" varchar(5),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE "push_tokens" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "token" text NOT NULL,
      "platform" varchar(10) NOT NULL,
      "device_id" varchar(255) NOT NULL,
      "is_active" boolean NOT NULL DEFAULT true,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
  `);

  console.log('✅ All tables created successfully');
  await pool.end();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
