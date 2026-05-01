// Set required env vars BEFORE any module imports happen.
// This file is referenced from vitest.config.ts via setupFiles.

process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.API_BASE_URL = 'http://localhost:4001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-must-be-at-least-32-characters-long';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.SESSION_SECRET = 'test-session-secret-must-be-at-least-32-characters';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
