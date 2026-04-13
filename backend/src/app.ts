import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { defaultRateLimiter } from './middleware/rateLimiter';

// Routers
import { authRouter } from './modules/auth/auth.router';
import { usersRouter } from './modules/users/users.router';
import { flightsRouter } from './modules/flights/flights.router';
import { hotelsRouter } from './modules/hotels/hotels.router';
import { itineraryRouter } from './modules/itinerary/itinerary.router';
import { discoveryRouter } from './modules/discovery/discovery.router';
import { dealsRouter } from './modules/deals/deals.router';
import { disruptionRouter } from './modules/disruption/disruption.router';
import { chatRouter } from './modules/sarthi-chat/chat.router';
import { tripsRouter } from './modules/trips/trips.router';
import { alertsRouter } from './modules/alerts/alerts.router';
import { groupRouter } from './modules/group/group.router';
import { placesRouter } from './modules/places/places.router';
import { weatherRouter } from './modules/weather/weather.router';

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: env.NODE_ENV === 'production',
}));

app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api', defaultRateLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] ?? '1.0.0',
    environment: env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/itinerary', itineraryRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/disruption', disruptionRouter);
app.use('/api/chat', chatRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/group', groupRouter);
app.use('/api/places', placesRouter);
app.use('/api/weather', weatherRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    data: null,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// ─── Error Handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

export { app };
