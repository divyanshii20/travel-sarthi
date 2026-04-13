"""Prediction endpoints — single and batch."""
import time
import logging
from typing import Any, Optional
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field

from app.features.engineer import engineer_features, engineer_batch_features
from app.models.ensemble import get_ensemble

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Auth Dependency ──────────────────────────────────────────────────────────

import os

def verify_api_key(x_api_key: Optional[str] = Header(default=None)) -> str:
    expected = os.getenv("ML_SERVICE_API_KEY", "")
    if not expected:
        return "no-key-configured"
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


# ─── Schemas ─────────────────────────────────────────────────────────────────

class PredictionFeatures(BaseModel):
    origin: str = "DEL"
    destination: str = "BOM"
    departDate: str
    returnDate: Optional[str] = None
    cabinClass: str = "economy"
    totalTravelers: int = 1
    stops: int = 0
    airline: str = "6E"
    flightDurationMinutes: int = 120
    currentPrice: float = 8000.0
    priceVsRouteAvg: float = 1.0
    priceVsSeasonAvg: float = 1.0
    priceTrend7d: float = 0.0
    priceTrend30d: float = 0.0
    priceVolatility: float = 0.1
    lowestPriceInWindow: Optional[float] = None
    historicalAvgPrice: Optional[float] = None
    searchVolume7d: float = 100.0
    bookingVelocity: float = 0.5
    availableSeatsPercent: float = 0.5
    competitorRouteCount: int = 5
    airportCongestionScore: float = 0.5
    fuelPriceIndex: float = 100.0
    exchangeRateUsdInr: float = 83.5
    departHour: int = 10
    arriveHour: int = 12


class PredictionRequest(BaseModel):
    features: PredictionFeatures
    includeFlexibleDates: bool = False
    flexibleDaysWindow: int = Field(default=7, ge=1, le=30)
    includeExplanation: bool = False


class BatchItem(BaseModel):
    id: str
    features: PredictionFeatures


class BatchPredictionRequest(BaseModel):
    items: list[BatchItem]


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/predict")
async def predict(request: PredictionRequest, _: str = Depends(verify_api_key)) -> dict[str, Any]:
    """Single fare prediction."""
    try:
        features_dict = request.features.model_dump()
        features_array = engineer_features(features_dict)

        ensemble = get_ensemble()
        result = ensemble.predict(features_array, include_explanation=request.includeExplanation)

        if request.includeFlexibleDates:
            result["flexibleDates"] = _generate_flexible_dates(
                request.features.departDate,
                request.features.currentPrice,
                request.flexibleDaysWindow,
                ensemble,
                features_dict,
            )

        return result

    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/batch_predict")
async def batch_predict(request: BatchPredictionRequest, _: str = Depends(verify_api_key)) -> dict[str, Any]:
    """Batch fare prediction."""
    start = time.time()
    results = []
    failed = 0

    ensemble = get_ensemble()

    for item in request.items:
        try:
            features_array = engineer_features(item.features.model_dump())
            prediction = ensemble.predict(features_array)
            results.append({"id": item.id, "prediction": prediction, "error": None})
        except Exception as e:
            logger.error(f"Batch item {item.id} failed: {e}")
            results.append({"id": item.id, "prediction": None, "error": str(e)})
            failed += 1

    return {
        "results": results,
        "totalProcessed": len(request.items),
        "failedCount": failed,
        "processingMs": int((time.time() - start) * 1000),
    }


def _generate_flexible_dates(
    base_date: str,
    base_price: float,
    window_days: int,
    ensemble: Any,
    base_features: dict,
) -> list[dict]:
    """Generate predictions for ±window_days around base date."""
    try:
        dep_date = date.fromisoformat(base_date)
    except ValueError:
        return []

    flexible = []

    for delta in range(-window_days, window_days + 1):
        if delta == 0:
            continue

        try:
            flex_date = dep_date + timedelta(days=delta)
            features_dict = {**base_features, "departDate": flex_date.isoformat()}
            features_array = engineer_features(features_dict)
            pred = ensemble.predict(features_array)

            # Simulate price variation based on prediction
            price_factor = 1.0 + (pred.get("predictedPrice", base_price) - base_price) / base_price * 0.3
            flex_price = base_price * price_factor
            delta_amount = flex_price - base_price

            flexible.append({
                "departDate": flex_date.isoformat(),
                "returnDate": None,
                "price": {
                    "amount": round(flex_price),
                    "currency": "INR",
                    "formatted": f"₹{round(flex_price):,}",
                },
                "delta": {
                    "amount": round(abs(delta_amount)),
                    "currency": "INR",
                    "formatted": f"{'+'if delta_amount > 0 else '-'}₹{round(abs(delta_amount)):,}",
                },
                "signal": pred.get("signal", "STABLE"),
            })
        except Exception:
            continue

    return sorted(flexible, key=lambda x: x["price"]["amount"])
