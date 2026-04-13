"""
Feature Engineering — all 44 features for price prediction.
Input: raw request data
Output: numpy array ready for model inference
"""
import numpy as np
import pandas as pd
from datetime import datetime, date
from typing import Any

from .holiday_calendar import (
    is_holiday,
    get_holiday_name,
    is_holiday_adjacent,
    get_season,
    is_summer_peak,
    is_winter_peak,
    is_monsoon,
    get_departure_time_slot,
)

# ─── Known Low-Cost Carriers ──────────────────────────────────────────────────

LCC_AIRLINES = {
    "6E", "SG", "IX", "G8",    # IndiGo, SpiceJet, AirAsia India, GoAir/Go First
    "QP", "I5", "FZ", "G9",    # Akasa, Air India Express, flydubai, Air Arabia
    "FR", "U2", "W6", "VY",    # Ryanair, easyJet, Wizz Air, Vueling
    "AK", "FD", "D7", "QZ",    # AirAsia, AirAsia Thailand, AirAsia X, Indonesia AirAsia
}

# ─── Popular Routes (high demand base) ───────────────────────────────────────

POPULAR_ROUTES = {
    ("DEL", "BOM"), ("BOM", "DEL"),
    ("DEL", "BLR"), ("BLR", "DEL"),
    ("BOM", "BLR"), ("BLR", "BOM"),
    ("DEL", "CCU"), ("CCU", "DEL"),
    ("DEL", "MAA"), ("MAA", "DEL"),
    ("DEL", "HYD"), ("HYD", "DEL"),
    ("BOM", "GOI"), ("GOI", "BOM"),
    ("DEL", "DXB"), ("DXB", "DEL"),
    ("BOM", "DXB"), ("DXB", "BOM"),
    ("DEL", "SIN"), ("SIN", "DEL"),
    ("BLR", "SIN"), ("SIN", "BLR"),
    ("DEL", "BKK"), ("BKK", "DEL"),
}

# ─── Approximate Route Distances (km) ────────────────────────────────────────

ROUTE_DISTANCES: dict[tuple[str, str], int] = {
    ("DEL", "BOM"): 1148, ("BOM", "DEL"): 1148,
    ("DEL", "BLR"): 1746, ("BLR", "DEL"): 1746,
    ("BOM", "BLR"): 845, ("BLR", "BOM"): 845,
    ("DEL", "DXB"): 2183, ("DXB", "DEL"): 2183,
    ("BOM", "DXB"): 1933, ("DXB", "BOM"): 1933,
    ("DEL", "SIN"): 4151, ("SIN", "DEL"): 4151,
    ("DEL", "BKK"): 2909, ("BKK", "DEL"): 2909,
    ("DEL", "LHR"): 6715, ("LHR", "DEL"): 6715,
}

# ─── Cabin Class Encoding ─────────────────────────────────────────────────────

CABIN_ENCODING = {
    "economy": 0,
    "premium_economy": 1,
    "business": 2,
    "first": 3,
}


def engineer_features(raw: dict[str, Any]) -> np.ndarray:
    """
    Transform raw prediction request into 44-feature vector.

    Features (in order):
    Route: [distance, is_international, is_domestic, is_popular_route, origin_enc, dest_enc]
    Temporal: [dow, month, day, days_until, booking_dow, booking_month, is_weekend, is_holiday, is_holiday_adj]
    Seasonal: [is_summer_peak, is_winter_peak, is_monsoon, season_enc, is_ipo_week]
    Flight: [cabin_enc, total_travelers, duration_min, stops, airline_enc, is_lcc, depart_slot, arrive_slot]
    Price: [current_price, vs_route_avg, vs_season_avg, trend_7d, trend_30d, volatility, lowest_in_window, hist_avg]
    Demand: [search_vol_7d, booking_velocity, seat_pct, competitor_routes, airport_congestion]
    External: [fuel_idx, usd_inr_rate]
    """
    origin: str = raw.get("origin", "DEL")
    destination: str = raw.get("destination", "BOM")
    depart_date_str: str = raw.get("departDate", raw.get("depart_date", ""))
    cabin: str = raw.get("cabinClass", raw.get("cabin_class", "economy"))
    total_travelers: int = raw.get("totalTravelers", raw.get("total_travelers", 1))
    stops: int = raw.get("stops", 0)
    airline: str = raw.get("airline", "6E")
    flight_duration: int = raw.get("flightDurationMinutes", raw.get("flight_duration_minutes", 120))
    current_price: float = raw.get("currentPrice", raw.get("current_price", 8000))
    depart_hour: int = raw.get("departHour", 10)
    arrive_hour: int = raw.get("arriveHour", 12)

    # Parse date
    try:
        depart_date = datetime.strptime(depart_date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        depart_date = date.today()

    booking_date = date.today()
    days_until = max(0, (depart_date - booking_date).days)

    # Route features
    route_key = (origin, destination)
    route_distance = ROUTE_DISTANCES.get(route_key, 1000)
    is_intl = destination not in {"DEL", "BOM", "BLR", "MAA", "HYD", "CCU", "GOI", "AMD", "PNQ", "JAI", "COK", "TRV", "CCJ", "IXC", "SXR", "VTZ", "BDQ", "BBI", "IXB", "GAU", "DIB"}
    is_domestic = not is_intl
    is_popular = route_key in POPULAR_ROUTES

    # Simple integer encoding for route
    origin_enc = hash(origin) % 1000
    dest_enc = hash(destination) % 1000

    # Temporal
    dow = depart_date.weekday()  # 0=Monday
    month = depart_date.month
    day = depart_date.day
    booking_dow = booking_date.weekday()
    booking_month = booking_date.month
    is_weekend = dow in [5, 6]
    _is_holiday = is_holiday(depart_date)
    holiday_name = get_holiday_name(depart_date)
    _is_holiday_adj = is_holiday_adjacent(depart_date)

    # Seasonal
    _is_summer = is_summer_peak(month)
    _is_winter = is_winter_peak(month)
    _is_monsoon = is_monsoon(month)
    season = get_season(month)
    season_enc = {"peak": 2, "shoulder": 1, "off": 0}.get(season, 1)
    is_ipo_week = False  # placeholder — would come from market calendar

    # Flight
    cabin_enc = CABIN_ENCODING.get(cabin, 0)
    airline_enc = hash(airline) % 500
    _is_lcc = airline in LCC_AIRLINES
    depart_slot = get_departure_time_slot(depart_hour)
    arrive_slot = get_departure_time_slot(arrive_hour)
    depart_slot_enc = ["early_morning", "morning", "afternoon", "evening", "night"].index(depart_slot) if depart_slot in ["early_morning", "morning", "afternoon", "evening", "night"] else 2
    arrive_slot_enc = ["early_morning", "morning", "afternoon", "evening", "night"].index(arrive_slot) if arrive_slot in ["early_morning", "morning", "afternoon", "evening", "night"] else 2

    # Price features (from raw data or defaults)
    vs_route_avg: float = raw.get("priceVsRouteAvg", 1.0)
    vs_season_avg: float = raw.get("priceVsSeasonAvg", 1.0)
    trend_7d: float = raw.get("priceTrend7d", 0.0)
    trend_30d: float = raw.get("priceTrend30d", 0.0)
    volatility: float = raw.get("priceVolatility", 0.1)
    lowest_in_window: float = raw.get("lowestPriceInWindow", current_price * 0.85)
    hist_avg: float = raw.get("historicalAvgPrice", current_price)

    # Demand features
    search_vol_7d: float = raw.get("searchVolume7d", 100.0)
    booking_velocity: float = raw.get("bookingVelocity", 0.5)
    seat_pct: float = raw.get("availableSeatsPercent", 0.5)
    competitor_routes: int = raw.get("competitorRouteCount", 5)
    airport_congestion: float = raw.get("airportCongestionScore", 0.5)

    # External
    fuel_idx: float = raw.get("fuelPriceIndex", 100.0)
    usd_inr: float = raw.get("exchangeRateUsdInr", 83.5)

    # ─── Assemble 44-feature vector ───────────────────────────────────────

    features = np.array([
        # Route (6)
        route_distance,
        float(is_intl),
        float(is_domestic),
        float(is_popular),
        float(origin_enc),
        float(dest_enc),

        # Temporal (9)
        float(dow),
        float(month),
        float(day),
        float(days_until),
        float(booking_dow),
        float(booking_month),
        float(is_weekend),
        float(_is_holiday),
        float(_is_holiday_adj),

        # Seasonal (5)
        float(_is_summer),
        float(_is_winter),
        float(_is_monsoon),
        float(season_enc),
        float(is_ipo_week),

        # Flight (8)
        float(cabin_enc),
        float(total_travelers),
        float(flight_duration),
        float(stops),
        float(airline_enc),
        float(_is_lcc),
        float(depart_slot_enc),
        float(arrive_slot_enc),

        # Price (8)
        float(current_price),
        float(vs_route_avg),
        float(vs_season_avg),
        float(trend_7d),
        float(trend_30d),
        float(volatility),
        float(lowest_in_window),
        float(hist_avg),

        # Demand (5)
        float(search_vol_7d),
        float(booking_velocity),
        float(seat_pct),
        float(competitor_routes),
        float(airport_congestion),

        # External (2)
        float(fuel_idx),
        float(usd_inr),
    ], dtype=np.float32)

    assert len(features) == 44, f"Expected 44 features, got {len(features)}"
    return features


def engineer_batch_features(batch: list[dict[str, Any]]) -> np.ndarray:
    """Engineer features for a batch of requests."""
    return np.vstack([engineer_features(item) for item in batch])


FEATURE_NAMES = [
    # Route
    "route_distance", "is_international", "is_domestic", "is_popular_route", "origin_enc", "dest_enc",
    # Temporal
    "depart_dow", "depart_month", "depart_day", "days_until_departure",
    "booking_dow", "booking_month", "is_weekend", "is_holiday", "is_holiday_adjacent",
    # Seasonal
    "is_summer_peak", "is_winter_peak", "is_monsoon", "season_enc", "is_ipo_week",
    # Flight
    "cabin_class", "total_travelers", "flight_duration_min", "stops",
    "airline_enc", "is_lcc", "depart_time_slot", "arrive_time_slot",
    # Price
    "current_price", "price_vs_route_avg", "price_vs_season_avg",
    "price_trend_7d", "price_trend_30d", "price_volatility", "lowest_in_window", "historical_avg",
    # Demand
    "search_volume_7d", "booking_velocity", "available_seats_pct", "competitor_routes", "airport_congestion",
    # External
    "fuel_price_index", "usd_inr_rate",
]
