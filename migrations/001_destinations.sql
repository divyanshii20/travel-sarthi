CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS safety_score INTEGER NOT NULL DEFAULT 75,
  ADD COLUMN IF NOT EXISTS weather_score INTEGER NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS infrastructure_score INTEGER NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS value_score INTEGER NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS budget_per_day INTEGER,
  ADD COLUMN IF NOT EXISTS budget_mid_per_day INTEGER,
  ADD COLUMN IF NOT EXISTS budget_luxury_per_day INTEGER,
  ADD COLUMN IF NOT EXISTS visa_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS visa_fee_inr INTEGER,
  ADD COLUMN IF NOT EXISTS visa_processing_days INTEGER,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS best_months INTEGER[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avoid_months INTEGER[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS peak_months INTEGER[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weather_summary VARCHAR(500),
  ADD COLUMN IF NOT EXISTS flight_hours_min REAL,
  ADD COLUMN IF NOT EXISTS flight_hours_max REAL,
  ADD COLUMN IF NOT EXISTS direct_flight_cities TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nearest_airport_code VARCHAR(5),
  ADD COLUMN IF NOT EXISTS is_domestic BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS state_province VARCHAR(100),
  ADD COLUMN IF NOT EXISTS trending_score INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS trending_change_pct INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flag_emoji VARCHAR(10),
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nearby_destinations TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS crowd_level VARCHAR(20) NOT NULL DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS ideal_duration_min INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS ideal_duration_max INTEGER NOT NULL DEFAULT 7;

CREATE INDEX IF NOT EXISTS dest_is_domestic_idx ON destinations(is_domestic);
CREATE INDEX IF NOT EXISTS dest_trending_score_idx ON destinations(trending_score DESC);
CREATE INDEX IF NOT EXISTS dest_budget_per_day_idx ON destinations(budget_per_day);
CREATE INDEX IF NOT EXISTS dest_budget_mid_per_day_idx ON destinations(budget_mid_per_day);
CREATE INDEX IF NOT EXISTS dest_safety_score_idx ON destinations(safety_score DESC);
CREATE INDEX IF NOT EXISTS dest_tags_gin_idx ON destinations USING GIN(tags);
CREATE INDEX IF NOT EXISTS dest_best_months_gin_idx ON destinations USING GIN(best_months);

ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(country, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(tagline, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS dest_search_vector_idx ON destinations USING GIN(search_vector);

CREATE TABLE IF NOT EXISTS destination_pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category VARCHAR(50),
  description TEXT,
  address TEXT,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  opening_hours JSONB,
  avg_visit_hours NUMERIC(3, 1),
  entry_fee_inr INTEGER,
  rating NUMERIC(3, 1),
  priority INTEGER NOT NULL DEFAULT 5,
  best_time_of_day VARCHAR(20),
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS destination_pois_destination_idx ON destination_pois(destination_id);
CREATE INDEX IF NOT EXISTS destination_pois_category_idx ON destination_pois(category);

CREATE TABLE IF NOT EXISTS destination_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  icon VARCHAR(10),
  gradient TEXT,
  destination_slugs TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_wishlists_user_destination_uidx
  ON user_wishlists(user_id, destination_id);

CREATE TABLE IF NOT EXISTS saved_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  title TEXT,
  duration_days INTEGER,
  travelers INTEGER,
  budget_inr INTEGER,
  itinerary_json JSONB NOT NULL,
  mode VARCHAR(5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_itineraries_user_idx ON saved_itineraries(user_id);

CREATE TABLE IF NOT EXISTS destination_image_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL DEFAULT 'hero',
  source_provider VARCHAR(40) NOT NULL DEFAULT 'database_seed',
  source_url TEXT,
  storage_path TEXT,
  public_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  blur_data_url TEXT,
  credit_name VARCHAR(200),
  credit_url TEXT,
  license VARCHAR(50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ready',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS destination_image_assets_destination_idx
  ON destination_image_assets(destination_id, asset_type, sort_order);
CREATE INDEX IF NOT EXISTS destination_image_assets_provider_idx
  ON destination_image_assets(source_provider, status);
