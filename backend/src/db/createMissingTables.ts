/**
 * Safe migration: creates tables that are missing from the live DB
 * without dropping any existing data.
 * Run with: npx tsx src/db/createMissingTables.ts
 */
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL']!,
  ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
});

async function createMissingTables() {
  console.log('Creating missing tables (safe — no existing data dropped)...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "destination_pois" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "destination_id" uuid NOT NULL REFERENCES "destinations"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "category" varchar(50),
      "description" text,
      "address" text,
      "latitude" numeric(9,6),
      "longitude" numeric(9,6),
      "opening_hours" jsonb,
      "avg_visit_hours" numeric(3,1),
      "entry_fee_inr" integer,
      "rating" numeric(3,1),
      "priority" integer NOT NULL DEFAULT 5,
      "best_time_of_day" varchar(20),
      "image_url" text,
      "tags" text[] NOT NULL DEFAULT '{}',
      "is_active" boolean NOT NULL DEFAULT true
    );
  `);
  console.log('✓ destination_pois');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "destination_collections" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "slug" varchar(100) NOT NULL UNIQUE,
      "title" text NOT NULL,
      "subtitle" text,
      "description" text,
      "icon" varchar(10),
      "gradient" text,
      "destination_slugs" text[] NOT NULL DEFAULT '{}',
      "is_active" boolean NOT NULL DEFAULT true,
      "sort_order" integer NOT NULL DEFAULT 0
    );
  `);
  console.log('✓ destination_collections');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "destination_image_assets" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "destination_id" uuid NOT NULL REFERENCES "destinations"("id") ON DELETE CASCADE,
      "asset_type" varchar(20) NOT NULL DEFAULT 'hero',
      "source_provider" varchar(40) NOT NULL DEFAULT 'database_seed',
      "source_url" text,
      "storage_path" text,
      "public_url" text NOT NULL,
      "alt_text" text NOT NULL,
      "width" integer,
      "height" integer,
      "blur_data_url" text,
      "credit_name" varchar(200),
      "credit_url" text,
      "license" varchar(50),
      "sort_order" integer NOT NULL DEFAULT 0,
      "status" varchar(20) NOT NULL DEFAULT 'ready',
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log('✓ destination_image_assets');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "user_wishlists" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL,
      "destination_id" uuid NOT NULL REFERENCES "destinations"("id") ON DELETE CASCADE,
      "added_at" timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log('✓ user_wishlists');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "saved_itineraries" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL,
      "destination_id" uuid REFERENCES "destinations"("id") ON DELETE SET NULL,
      "title" text,
      "duration_days" integer,
      "travelers" integer,
      "budget_inr" integer,
      "itinerary_json" jsonb NOT NULL,
      "mode" varchar(5),
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log('✓ saved_itineraries');

  // Indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "destination_pois_destination_idx" ON "destination_pois"("destination_id");
    CREATE INDEX IF NOT EXISTS "destination_pois_category_idx" ON "destination_pois"("category");
    CREATE INDEX IF NOT EXISTS "destination_pois_priority_idx" ON "destination_pois"("priority");
    CREATE INDEX IF NOT EXISTS "destination_collections_slug_idx" ON "destination_collections"("slug");
    CREATE INDEX IF NOT EXISTS "destination_collections_sort_order_idx" ON "destination_collections"("sort_order");
    CREATE INDEX IF NOT EXISTS "destination_image_assets_destination_idx" ON "destination_image_assets"("destination_id", "asset_type", "sort_order");
    CREATE INDEX IF NOT EXISTS "destination_image_assets_provider_idx" ON "destination_image_assets"("source_provider", "status");
    CREATE INDEX IF NOT EXISTS "user_wishlists_user_destination_idx" ON "user_wishlists"("user_id", "destination_id");
    CREATE INDEX IF NOT EXISTS "user_wishlists_destination_idx" ON "user_wishlists"("destination_id");
    CREATE INDEX IF NOT EXISTS "saved_itineraries_user_idx" ON "saved_itineraries"("user_id");
    CREATE INDEX IF NOT EXISTS "saved_itineraries_destination_idx" ON "saved_itineraries"("destination_id");
  `);
  console.log('✓ indexes');

  console.log('\nAll missing tables created. Existing data untouched.');
}

createMissingTables()
  .catch((err) => {
    console.error('Failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
