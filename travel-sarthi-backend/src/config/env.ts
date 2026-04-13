import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_BASE_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // JWT / Session
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().default('placeholder'),
  GOOGLE_CLIENT_SECRET: z.string().default('placeholder'),
  GOOGLE_REDIRECT_URI: z.string().url().default('http://localhost:4000/api/auth/google/callback'),

  // Email
  RESEND_API_KEY: z.string().default('placeholder'),
  EMAIL_FROM: z.string().default('noreply@travelsarthi.com'),
  EMAIL_FROM_NAME: z.string().default('Travel Sarthi'),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().default('placeholder'),
  FIREBASE_PRIVATE_KEY: z.string().default('placeholder'),
  FIREBASE_CLIENT_EMAIL: z.string().default('firebase@placeholder.iam.gserviceaccount.com'),

  // Kiwi
  KIWI_API_KEY: z.string().default('placeholder'),
  KIWI_API_BASE: z.string().url().default('https://api.tequila.kiwi.com'),

  // Amadeus
  AMADEUS_CLIENT_ID: z.string().default('placeholder'),
  AMADEUS_CLIENT_SECRET: z.string().default('placeholder'),
  AMADEUS_BASE_URL: z.string().url().default('https://test.api.amadeus.com'),

  // Xotelo
  XOTELO_API_KEY: z.string().default('placeholder'),

  // Gemini
  GEMINI_API_KEY: z.string().default('placeholder'),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

  // Google Places
  GOOGLE_PLACES_API_KEY: z.string().default('placeholder'),

  // Foursquare
  FOURSQUARE_API_KEY: z.string().default('placeholder'),

  // Weather
  OPEN_METEO_BASE: z.string().url().default('https://api.open-meteo.com/v1'),
  WEATHERAPI_KEY: z.string().default('placeholder'),

  // AeroDataBox
  AERODATABOX_API_KEY: z.string().default('placeholder'),
  AERODATABOX_WEBHOOK_SECRET: z.string().default('placeholder'),

  // Aviation Stack
  AVIATIONSTACK_API_KEY: z.string().default('placeholder'),
  AVIATIONSTACK_BASE_URL: z.string().url().default('http://api.aviationstack.com/v1'),

  // ML Service
  ML_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  ML_SERVICE_API_KEY: z.string().default('placeholder'),

  // Storage
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  STORAGE_BUCKET_AVATARS: z.string().default('avatars'),
  STORAGE_BUCKET_RECEIPTS: z.string().default('receipts'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `  ✗ ${path}: ${issue.message}`;
    });

    console.error('\n❌ Environment validation failed. Missing or invalid variables:\n');
    console.error(missing.join('\n'));
    console.error('\nPlease check your .env file against .env.example\n');
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
