import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL']!,
  ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
});

async function extend() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS safety_score integer NOT NULL DEFAULT 75`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS weather_score integer NOT NULL DEFAULT 70`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS infrastructure_score integer NOT NULL DEFAULT 70`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS value_score integer NOT NULL DEFAULT 70`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS budget_per_day integer`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS budget_mid_per_day integer`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS budget_luxury_per_day integer`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS visa_status varchar(30)`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS visa_fee_inr integer`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS visa_processing_days integer`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS best_months integer[] NOT NULL DEFAULT '{}'`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS avoid_months integer[] NOT NULL DEFAULT '{}'`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS peak_months integer[] NOT NULL DEFAULT '{}'`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS weather_summary varchar(500)`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS flight_hours_min real`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS flight_hours_max real`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS direct_flight_cities text[] NOT NULL DEFAULT '{}'`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS nearest_airport_code varchar(5)`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS is_domestic boolean NOT NULL DEFAULT false`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS state_province varchar(100)`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS trending_score integer NOT NULL DEFAULT 50`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS trending_change_pct integer NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS flag_emoji varchar(10)`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}'`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS nearby_destinations text[] NOT NULL DEFAULT '{}'`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS crowd_level varchar(20) NOT NULL DEFAULT 'Medium'`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS ideal_duration_min integer NOT NULL DEFAULT 3`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS ideal_duration_max integer NOT NULL DEFAULT 7`);

    // Add new indexes if they don't exist
    await client.query(`CREATE INDEX IF NOT EXISTS dest_is_domestic_idx ON destinations(is_domestic)`);
    await client.query(`CREATE INDEX IF NOT EXISTS dest_trending_score_idx ON destinations(trending_score)`);

    await client.query('COMMIT');
    console.log('✅ Destinations table extended successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to extend destinations table:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

extend().catch(console.error);
