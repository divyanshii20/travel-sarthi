"""
Ensemble model — combines XGBoost + LightGBM + GRU predictions.
Weighted voting: XGB 50%, LGB 30%, GRU 20%
"""
import numpy as np
from typing import Literal
import logging

from .xgboost_model import XGBoostPriceModel
from .lightgbm_model import LightGBMPriceModel
from .gru_model import GRUPriceModel

logger = logging.getLogger(__name__)

Signal = Literal["BUY_NOW", "WAIT", "FLEXIBLE", "WATCH", "STABLE"]

SIGNAL_SCORES: dict[Signal, float] = {
    "BUY_NOW": 1.0,
    "WATCH": 0.5,
    "FLEXIBLE": 0.3,
    "STABLE": 0.0,
    "WAIT": -1.0,
}

WEIGHTS = {"xgb": 0.50, "lgb": 0.30, "gru": 0.20}


class EnsembleModel:
    """Weighted ensemble of XGB + LGB + GRU."""

    def __init__(self):
        self.xgb = XGBoostPriceModel()
        self.lgb = LightGBMPriceModel()
        self.gru = GRUPriceModel()
        self.model_version = "1.0.0"

    def load_all(self) -> None:
        """Load all sub-models. Failures are non-fatal."""
        xgb_loaded = self.xgb.load()
        lgb_loaded = self.lgb.load()
        gru_loaded = self.gru.load()

        logger.info(
            f"Ensemble loaded — XGB: {xgb_loaded}, LGB: {lgb_loaded}, GRU: {gru_loaded}"
        )

        if not xgb_loaded:
            logger.warning("XGBoost not loaded — ensemble will use rule-based fallback for XGB component")

    def predict(self, features: np.ndarray, include_explanation: bool = False) -> dict:
        """
        Run ensemble prediction.
        Returns unified prediction dict.
        """
        start_time = __import__("time").time()

        # Get predictions from each model
        xgb_pred = self.xgb.predict(features)
        lgb_change = self.lgb.predict_price_change(features)
        gru_pred = self.gru.predict(features)

        # Ensemble: weighted average of signal scores
        xgb_score = SIGNAL_SCORES.get(xgb_pred["signal"], 0.0)  # type: ignore[arg-type]
        lgb_score = np.clip(lgb_change * 5, -1.0, 1.0)  # normalize to [-1, 1]
        gru_trend_arr = gru_pred["trend_proba"]  # [down, stable, up]
        gru_score = float(gru_trend_arr[2]) - float(gru_trend_arr[0])  # up - down

        ensemble_score = (
            WEIGHTS["xgb"] * xgb_score +
            WEIGHTS["lgb"] * lgb_score +
            WEIGHTS["gru"] * gru_score
        )

        # Convert ensemble score to signal
        signal = self._score_to_signal(ensemble_score, features)

        # Confidence: weighted average of individual confidences
        xgb_conf = xgb_pred.get("confidence", 0.6)
        lgb_conf = 0.6  # LGB doesn't output confidence directly
        gru_conf = float(max(gru_trend_arr)) if gru_trend_arr else 0.5
        ensemble_confidence = (
            WEIGHTS["xgb"] * xgb_conf +
            WEIGHTS["lgb"] * lgb_conf +
            WEIGHTS["gru"] * gru_conf
        )

        # Price predictions
        current_price = float(features[28]) if len(features) > 28 else 8000
        change_pct = (
            WEIGHTS["xgb"] * xgb_pred.get("predicted_change_pct", 0.0) +
            WEIGHTS["lgb"] * lgb_change +
            WEIGHTS["gru"] * gru_pred.get("magnitude", 0.0)
        )

        predicted_price = current_price * (1 + change_pct)
        predicted_low = current_price * 0.85
        predicted_high = current_price * 1.20

        inference_ms = int((time.time() - start_time) * 1000)

        result: dict = {
            "signal": signal,
            "confidence": round(ensemble_confidence, 4),
            "predictedPrice": round(predicted_price, 2),
            "predictedLow": round(predicted_low, 2),
            "predictedHigh": round(predicted_high, 2),
            "predictionIntervalDays": 30,
            "recommendedBuyWindowStart": self._get_buy_window_start(signal, features),
            "recommendedBuyWindowEnd": self._get_buy_window_end(signal, features),
            "priceHistory": [],
            "flexibleDates": [],
            "explanation": None,
            "modelVersion": self.model_version,
            "inferenceMs": inference_ms,
        }

        if include_explanation:
            result["explanation"] = self._generate_explanation(
                xgb_pred, lgb_change, gru_pred, features, signal
            )

        return result

    def _score_to_signal(self, score: float, features: np.ndarray) -> Signal:
        """Convert ensemble score to signal."""
        days_until = float(features[9]) if len(features) > 9 else 30

        if score > 0.5:
            return "BUY_NOW"
        elif score > 0.2:
            if days_until < 14:
                return "BUY_NOW"
            return "WATCH"
        elif score > -0.2:
            if days_until > 45:
                return "FLEXIBLE"
            return "STABLE"
        elif score > -0.5:
            if days_until > 30:
                return "WAIT"
            return "FLEXIBLE"
        else:
            if days_until > 14:
                return "WAIT"
            return "WATCH"

    def _get_buy_window_start(self, signal: Signal, features: np.ndarray) -> str | None:
        from datetime import date, timedelta
        if signal not in ["BUY_NOW", "WATCH"]:
            return None
        return date.today().isoformat()

    def _get_buy_window_end(self, signal: Signal, features: np.ndarray) -> str | None:
        from datetime import date, timedelta
        if signal not in ["BUY_NOW", "WATCH"]:
            return None
        days = 3 if signal == "BUY_NOW" else 7
        return (date.today() + timedelta(days=days)).isoformat()

    def _generate_explanation(self, xgb_pred: dict, lgb_change: float, gru_pred: dict, features: np.ndarray, signal: Signal) -> dict:
        days_until = float(features[9]) if len(features) > 9 else 30
        is_holiday = bool(features[13]) if len(features) > 13 else False

        top_features = []
        if days_until < 14:
            top_features.append({
                "feature": "days_until_departure",
                "importance": 0.35,
                "direction": "positive",
                "humanReadable": f"Only {int(days_until)} days until departure — prices typically rise as date approaches",
            })
        if is_holiday:
            top_features.append({
                "feature": "is_holiday",
                "importance": 0.25,
                "direction": "positive",
                "humanReadable": "Holiday period — demand surge driving prices up",
            })

        return {
            "topFeatures": top_features,
            "shapValues": {},
        }


import time

# Singleton
_ensemble: EnsembleModel | None = None


def get_ensemble() -> EnsembleModel:
    global _ensemble
    if _ensemble is None:
        _ensemble = EnsembleModel()
        _ensemble.load_all()
    return _ensemble
