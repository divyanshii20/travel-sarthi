# Travel Sarthi

> **The World's Most Intelligent AI-Powered Travel Platform for India**

<div align="center">
  <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=80" alt="Travel Sarthi Banner" width="100%" style="border-radius:12px"/>
  <br/><br/>

  ![License](https://img.shields.io/badge/license-Proprietary-red?style=for-the-badge)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
  ![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis&logoColor=white)

  <br/>

  **Copyright © 2026 Divyanshi Mishra. All Rights Reserved.**

  *Unauthorized use, reproduction, or distribution is strictly prohibited.*
</div>

---

## What is Travel Sarthi?

**Travel Sarthi** (सारथी — *the one who guides you*) is a full-stack, AI-native travel intelligence platform built exclusively for the Indian traveller. It combines real-time flight & hotel aggregation, AI-generated personalized itineraries, predictive price analytics, live travel disruption alerts, and a conversational AI travel assistant — all within a single premium product experience.

This is not a booking redirect engine. Travel Sarthi is an **intelligent travel operating system** — it thinks, plans, compares, and advises, so travellers can explore India and the world with complete confidence.

---

## Feature Overview

### AI Trip Planner
- Generate complete multi-day itineraries with a single prompt
- Inputs: destination, dates, budget, travel style, pace, custom preferences
- Output: structured day-by-day plan with activities, dining, transport, budget breakdown
- Powered by large language models with travel-domain grounding

### Smart Flight Search
- Aggregated fare search across MakeMyTrip, GoIbibo, Cleartrip, EaseMyTrip, IndiGo
- Real-time seat availability and price trend graphs
- AI-powered price prediction: "Will this fare drop in the next 7 days?"
- One-click deeplinks to booking platforms

### Hotel Intelligence
- Curated hotel results with amenity scoring and review sentiment
- Price-per-night normalisation across platforms
- AI summary of pros/cons from thousands of reviews

### Discover Destinations
- AI-ranked destination catalogue with 120+ global destinations
- Multi-dimensional score: affordability, safety, weather, tourist infrastructure, uniqueness, visa ease
- Filters by continent, mood, budget, travel style
- Real-time trending and hidden gem badges

### Coupon & Deal Intelligence
- Curated database of 20+ verified promo codes across all major Indian booking platforms
- Bank card-specific offers (HDFC, ICICI, SBI, Axis, Kotak, RuPay)
- Flash deal ticker with countdown timers and live seat counters
- Stacking logic: find which offers can be combined

### Travel Disruption Alerts
- Live disruption monitoring: delays, cancellations, gate changes, weather warnings
- Push notification system (email + in-app)
- Configurable alert thresholds per trip

### Sarthi AI Chat
- Natural language travel assistant embedded in every page
- Answers queries about visas, destinations, packing, budgets, local tips
- Context-aware: knows your saved trips and past searches

### Group Travel Management
- Create group trips, invite members, vote on destinations and dates
- Shared budget tracker and expense split
- Real-time collaborative itinerary editing

### Trip Journal
- Save, organise and annotate personal trips
- Timeline view with photos, notes and memories
- Export to PDF trip summary

### Price Prediction (ML)
- Dedicated Python/FastAPI microservice
- Regression models trained on historical airfare data
- Predictions served via REST API consumed by the Node.js backend

### Authentication & Security
- JWT access + refresh token rotation
- Google OAuth 2.0 via Firebase
- Two-factor authentication (TOTP)
- Bcrypt password hashing, rate limiting, CORS, Helmet CSP

---

## Architecture

```
travel_sarthi/
├── travel-sarthi-frontend/        # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── pages/                 # Route-level page components
│   │   ├── components/            # Reusable UI components
│   │   ├── hooks/                 # TanStack Query custom hooks
│   │   ├── services/              # Axios API service layer
│   │   ├── stores/                # Zustand global state
│   │   ├── styles/                # Global CSS design system
│   │   └── lib/                   # Utilities & animation configs
│
├── travel-sarthi-backend/         # Node.js + Express 5 + TypeScript
│   ├── src/
│   │   ├── modules/               # Feature modules (auth, flights, hotels…)
│   │   │   ├── auth/
│   │   │   ├── flights/
│   │   │   ├── hotels/
│   │   │   ├── itinerary/
│   │   │   ├── discovery/
│   │   │   ├── deals/
│   │   │   ├── disruption/
│   │   │   ├── sarthi-chat/
│   │   │   ├── trips/
│   │   │   ├── alerts/
│   │   │   ├── group/
│   │   │   ├── places/
│   │   │   ├── weather/
│   │   │   └── workers/
│   │   ├── db/                    # Drizzle ORM schema + migrations + seed
│   │   ├── config/                # Env validation, DB, Redis, Firebase
│   │   ├── middleware/            # Auth, validation, rate limiting, error handling
│   │   └── shared/                # Response helpers, cache, logger, errors
│
├── travel-sarthi-shared-types/    # Shared TypeScript DTOs and types
│   └── src/                       # auth, flights, hotels, itinerary, deals…
│
└── travel-sarthi-ml/              # Python FastAPI price prediction service
    ├── app/                       # FastAPI routes and ML model inference
    └── requirements.txt
```

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 + custom CSS design system |
| UI animation | Framer Motion |
| State management | Zustand + TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Maps | Leaflet + React Leaflet |
| Backend framework | Node.js 22 + Express 5 + TypeScript |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 (Supabase) |
| Cache / Queue | Redis (Upstash) + BullMQ |
| Authentication | JWT + Firebase Admin + TOTP |
| Email | Resend |
| File handling | Multer + Sharp |
| ML microservice | Python + FastAPI |
| Deployment (frontend) | Vercel |
| Deployment (backend) | Node.js server |

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- PostgreSQL database (Supabase recommended)
- Redis instance (Upstash recommended)
- Python 3.11+ (for ML service only)

### 1. Clone the Repository

```bash
git clone https://github.com/divyanshii20/travel-sarthi.git
cd travel-sarthi
```

### 2. Backend Setup

```bash
cd travel-sarthi-backend
npm install
```

Create `.env` in `travel-sarthi-backend/`:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=rediss://default:password@host:port
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
CORS_ORIGIN=http://localhost:5173
RESEND_API_KEY=re_your_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GEMINI_API_KEY=your_gemini_key
GOOGLE_MAPS_API_KEY=your_maps_key
OPENWEATHER_API_KEY=your_weather_key
ML_SERVICE_URL=http://localhost:8000
```

Run database migration and seed:

```bash
npm run db:migrate
npm run db:seed
```

Start the backend server:

```bash
npm run dev
# Server running on http://localhost:4000
```

### 3. Frontend Setup

```bash
cd travel-sarthi-frontend
npm install
npm run dev
# App running on http://localhost:5173
```

### 4. ML Service Setup (optional)

```bash
cd travel-sarthi-ml
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 5. Shared Types

The shared types package is referenced locally — no separate install step required. It is resolved automatically via the `vite.config.ts` alias.

---

## API Reference

All endpoints are prefixed with `/api`. The server runs on port `4000` by default.

| Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout` |
| Users | `/api/users` | `GET /me`, `PATCH /me`, `POST /avatar` |
| Flights | `/api/flights` | `GET /search`, `GET /price-history/:route` |
| Hotels | `/api/hotels` | `GET /search`, `GET /:id` |
| Itinerary | `/api/itinerary` | `POST /generate`, `GET /`, `GET /:id` |
| Discovery | `/api/discovery` | `GET /destinations`, `GET /destinations/:slug`, `POST /compare` |
| Deals | `/api/deals` | `GET /coupons`, `GET /flash-deals` |
| Trips | `/api/trips` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` |
| Alerts | `/api/alerts` | `GET /`, `POST /`, `DELETE /:id` |
| Chat | `/api/chat` | `POST /message`, `GET /history` |
| Weather | `/api/weather` | `GET /?city=` |
| Places | `/api/places` | `GET /search`, `GET /:placeId` |
| Group | `/api/group` | `POST /`, `POST /:id/invite`, `GET /:id` |
| Disruption | `/api/disruption` | `GET /`, `GET /:flightNumber` |

All responses follow the envelope format:

```json
{
  "data": { ... },
  "error": null,
  "meta": { "page": 1, "limit": 12, "total": 8, "totalPages": 1 }
}
```

---

## Design System

Travel Sarthi uses a bespoke premium design system:

- **Primary colour** — Saffron `#E8622A` (inspired by the Indian flag and sacred fire)
- **Typography** — DM Sans (body), Playfair Display italic (display headings), Cormorant Garamond (luxury accents)
- **Glassmorphism** — `backdrop-filter: blur(20px) saturate(180%)` cards throughout
- **Fluid typography** — CSS `clamp()` for all heading sizes
- **Motion** — Framer Motion page transitions and micro-interactions
- **Scrollbar** — Custom styled, hair-thin premium scrollbar

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string (use `rediss://` for TLS) |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens (min 32 chars) |
| `CORS_ORIGIN` | Yes | Allowed frontend origin(s), comma-separated |
| `RESEND_API_KEY` | Yes | Resend email API key |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID for Google OAuth |
| `FIREBASE_CLIENT_EMAIL` | Yes | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Firebase service account private key |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI itinerary generation |
| `GOOGLE_MAPS_API_KEY` | No | Google Maps API key for places |
| `OPENWEATHER_API_KEY` | No | OpenWeatherMap key for weather data |
| `ML_SERVICE_URL` | No | URL of the Python ML microservice |

---

## License

**PROPRIETARY — ALL RIGHTS RESERVED**

Copyright © 2026 Divyanshi Mishra. All rights reserved.

This software and its source code, documentation, design assets, and all associated intellectual property are the exclusive property of **Divyanshi Mishra**.

**No part of this repository may be:**
- Copied, cloned, forked, or downloaded for any purpose other than personal review
- Used, executed, or deployed in any environment — commercial or non-commercial
- Modified, adapted, translated, or built upon
- Distributed, sublicensed, sold, or transferred to any third party
- Reverse-engineered, decompiled, or disassembled

Any unauthorised use constitutes copyright infringement and may result in civil and criminal penalties under applicable law.

See the [LICENSE](./LICENSE) file for full terms.

---

## Author

**Divyanshi Mishra**
GitHub: [@divyanshii20](https://github.com/divyanshii20)

---

<div align="center">
  <sub>Copyright © 2026 Divyanshi Mishra — All Rights Reserved</sub>
</div>
