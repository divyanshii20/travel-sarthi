import { Router } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { validateQuery } from '../../middleware/validate';
import { sendSuccess } from '../../shared/response';
import { withCache, buildCacheKey } from '../../shared/cache';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

const weatherQuerySchema = z.object({
  location: z.string().min(2).max(255),
  forecastDays: z.coerce.number().int().min(1).max(14).default(7),
});

// GET /api/weather
router.get('/', validateQuery(weatherQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as z.infer<typeof weatherQuerySchema>;
    const cacheKey = buildCacheKey('weather', q.location.toLowerCase(), q.forecastDays);

    const result = await withCache(cacheKey, 3600, async () => {
      // Try Open-Meteo first (free, no API key)
      const forecast = await fetchOpenMeteo(q.location, q.forecastDays).catch(async () => {
        // Fallback to WeatherAPI
        return fetchWeatherApi(q.location, q.forecastDays);
      });

      return forecast;
    });

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

async function geocodeLocation(location: string): Promise<{ lat: number; lon: number; name: string }> {
  const res = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
    params: { name: location, count: 1, language: 'en', format: 'json' },
    timeout: 5000,
  });

  const data = res.data as { results?: { latitude: number; longitude: number; name: string; country: string }[] };
  if (!data.results?.length) throw new Error(`Location not found: ${location}`);

  const r = data.results[0]!;
  return { lat: r.latitude, lon: r.longitude, name: `${r.name}, ${r.country}` };
}

async function fetchOpenMeteo(location: string, days: number) {
  const { lat, lon, name } = await geocodeLocation(location);

  const res = await axios.get(`${env.OPEN_METEO_BASE}/forecast`, {
    params: {
      latitude: lat,
      longitude: lon,
      daily: [
        'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
        'windspeed_10m_max', 'weathercode', 'sunrise', 'sunset', 'uv_index_max',
      ].join(','),
      hourly: ['temperature_2m', 'apparent_temperature', 'precipitation_probability', 'weathercode', 'windspeed_10m'].join(','),
      current_weather: true,
      timezone: 'auto',
      forecast_days: days,
    },
    timeout: 10000,
  });

  const data = res.data as {
    current_weather: { temperature: number; weathercode: number; windspeed: number; time: string };
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      windspeed_10m_max: number[];
      weathercode: number[];
      sunrise: string[];
      sunset: string[];
      uv_index_max: number[];
    };
    hourly: {
      time: string[];
      temperature_2m: number[];
      apparent_temperature: number[];
      windspeed_10m: number[];
      weathercode: number[];
    };
  };

  const wmoToCondition = (code: number): string => {
    if (code === 0) return 'sunny';
    if (code <= 3) return 'partly_cloudy';
    if (code <= 49) return 'foggy';
    if (code <= 67) return 'rainy';
    if (code <= 79) return 'snowy';
    if (code <= 99) return 'stormy';
    return 'cloudy';
  };

  const current = data.current_weather;

  return {
    location: name,
    country: '',
    coordinates: { lat, lng: lon },
    timezone: 'auto',
    current: {
      condition: wmoToCondition(current.weathercode),
      tempMin: current.temperature - 3,
      tempMax: current.temperature + 3,
      humidity: 60,
      windSpeedKph: current.windspeed,
      precipitationMm: 0,
      uvIndex: 5,
      description: getWeatherDescription(current.weathercode),
      icon: getWeatherIcon(current.weathercode),
    },
    daily: data.daily.time.map((date, i) => ({
      date,
      snapshot: {
        condition: wmoToCondition(data.daily.weathercode[i] ?? 0),
        tempMin: data.daily.temperature_2m_min[i] ?? 0,
        tempMax: data.daily.temperature_2m_max[i] ?? 0,
        humidity: 60,
        windSpeedKph: data.daily.windspeed_10m_max[i] ?? 0,
        precipitationMm: data.daily.precipitation_sum[i] ?? 0,
        uvIndex: data.daily.uv_index_max[i] ?? 0,
        description: getWeatherDescription(data.daily.weathercode[i] ?? 0),
        icon: getWeatherIcon(data.daily.weathercode[i] ?? 0),
      },
      sunrise: (data.daily.sunrise[i] ?? '').split('T')[1] ?? '06:00',
      sunset: (data.daily.sunset[i] ?? '').split('T')[1] ?? '18:00',
      moonPhase: null,
      isGoodForTravel: (data.daily.weathercode[i] ?? 0) < 61,
      travelAdvice: (data.daily.weathercode[i] ?? 0) >= 61 ? 'Carry an umbrella and rain gear' : null,
    })),
    hourly: data.hourly.time.slice(0, 24).map((time, i) => ({
      time,
      temp: data.hourly.temperature_2m[i] ?? 0,
      feelsLike: data.hourly.apparent_temperature[i] ?? 0,
      condition: wmoToCondition(data.hourly.weathercode[i] ?? 0),
      precipitationMm: 0,
      windSpeedKph: data.hourly.windspeed_10m[i] ?? 0,
    })),
    source: 'open_meteo',
    cachedAt: new Date().toISOString(),
  };
}

async function fetchWeatherApi(location: string, days: number) {
  const res = await axios.get('https://api.weatherapi.com/v1/forecast.json', {
    params: { key: env.WEATHERAPI_KEY, q: location, days, aqi: 'no', alerts: 'no' },
    timeout: 10000,
  });

  const data = res.data as {
    location: { name: string; country: string; lat: number; lon: number; tz_id: string };
    current: {
      temp_c: number;
      feelslike_c: number;
      humidity: number;
      wind_kph: number;
      precip_mm: number;
      uv: number;
      condition: { text: string; icon: string };
    };
    forecast: {
      forecastday: {
        date: string;
        day: {
          maxtemp_c: number;
          mintemp_c: number;
          avghumidity: number;
          maxwind_kph: number;
          totalprecip_mm: number;
          uv: number;
          condition: { text: string; icon: string };
        };
        astro: { sunrise: string; sunset: string; moon_phase: string };
      }[];
    };
  };

  return {
    location: `${data.location.name}, ${data.location.country}`,
    country: data.location.country,
    coordinates: { lat: data.location.lat, lng: data.location.lon },
    timezone: data.location.tz_id,
    current: {
      condition: mapWeatherApiCondition(data.current.condition.text),
      tempMin: data.current.temp_c - 3,
      tempMax: data.current.temp_c + 3,
      humidity: data.current.humidity,
      windSpeedKph: data.current.wind_kph,
      precipitationMm: data.current.precip_mm,
      uvIndex: data.current.uv,
      description: data.current.condition.text,
      icon: data.current.condition.icon,
    },
    daily: data.forecast.forecastday.map((day) => ({
      date: day.date,
      snapshot: {
        condition: mapWeatherApiCondition(day.day.condition.text),
        tempMin: day.day.mintemp_c,
        tempMax: day.day.maxtemp_c,
        humidity: day.day.avghumidity,
        windSpeedKph: day.day.maxwind_kph,
        precipitationMm: day.day.totalprecip_mm,
        uvIndex: day.day.uv,
        description: day.day.condition.text,
        icon: day.day.condition.icon,
      },
      sunrise: day.astro.sunrise,
      sunset: day.astro.sunset,
      moonPhase: day.astro.moon_phase,
      isGoodForTravel: day.day.totalprecip_mm < 10,
      travelAdvice: day.day.totalprecip_mm >= 10 ? 'Carry rain gear' : null,
    })),
    hourly: [],
    source: 'weatherapi',
    cachedAt: new Date().toISOString(),
  };
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 67) return 'Rainy';
  if (code <= 79) return 'Snowy';
  if (code <= 82) return 'Rain showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 79) return '❄️';
  if (code <= 82) return '🌦️';
  return '⛈️';
}

function mapWeatherApiCondition(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('sunny') || lower.includes('clear')) return 'sunny';
  if (lower.includes('partly')) return 'partly_cloudy';
  if (lower.includes('cloud') || lower.includes('overcast')) return 'cloudy';
  if (lower.includes('rain') || lower.includes('drizzle')) return 'rainy';
  if (lower.includes('thunder') || lower.includes('storm')) return 'stormy';
  if (lower.includes('snow') || lower.includes('blizzard')) return 'snowy';
  if (lower.includes('fog') || lower.includes('mist')) return 'foggy';
  if (lower.includes('wind')) return 'windy';
  return 'partly_cloudy';
}

export { router as weatherRouter };
