"""XGBoost price direction classifier + regression."""
import numpy as np
import joblib
import os
from pathlib import Path
from typing import Optional
import logging

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

logger = logging.getLogger(__name__)

ARTIFACTS_PATH = Path(os.getenv("MODEL_ARTIFACTS_PATH", "./artifacts"))


class XGBoostPriceModel:
    """
    XGBoost ensemble:
    - Classifier: predicts price direction (up/down/stable)
    - Regressor: predicts price change percentage
    """

    def __init__(self):
        self.classifier: Optional[object] = None
        self.regressor: Optional[object] = None
        self.is_loaded = False
        self.model_version = "0.0.0"

    def load(self) -> bool:
        """Load model from artifacts directory."""
        if not XGB_AVAILABLE:
            logger.warning("XGBoost not available — using fallback")
            return False

        clf_path = ARTIFACTS_PATH / "xgb_classifier.joblib"
        reg_path = ARTIFACTS_PATH / "xgb_regressor.joblib"

        if clf_path.exists() and reg_path.exists():
            try:
                self.classifier = joblib.load(clf_path)
                self.regressor = joblib.load(reg_path)
                self.is_loaded = True
                logger.info("XGBoost models loaded from disk")
                return True
            except Exception as e:
                logger.error(f"Failed to load XGBoost models: {e}")
                return False

        logger.warning("XGBoost model artifacts not found — train first with /retrain")
        return False

    def predict(self, features: np.ndarray) -> dict:
        """
        Predict price direction and magnitude.
        Returns: {signal, confidence, predicted_change_pct}
        """
        if not self.is_loaded or not XGB_AVAILABLE:
            return self._rule_based_fallback(features)

        features_2d = features.reshape(1, -1) if features.ndim == 1 else features

        try:
            # Direction prediction (0=down, 1=stable, 2=up)
            direction_proba = self.classifier.predict_proba(features_2d)[0]  # type: ignore[union-attr]
            direction = int(np.argmax(direction_proba))
            confidence = float(direction_proba[direction])

            # Price change magnitude
            change_pct = float(self.regressor.predict(features_2d)[0])  # type: ignore[union-attr]

            signal = self._direction_to_signal(direction, confidence, features)

            return {
                "signal": signal,
                "confidence": round(confidence, 4),
                "predicted_change_pct": round(change_pct, 4),
                "direction": ["down", "stable", "up"][direction],
            }
        except Exception as e:
            logger.error(f"XGBoost prediction failed: {e}")
            return self._rule_based_fallback(features)

    def _direction_to_signal(self, direction: int, confidence: float, features: np.ndarray) -> str:
        """Convert direction + context to trading signal."""
        days_until = float(features[9]) if len(features) > 9 else 30

        if direction == 0:  # price going down
            if days_until > 30:
                return "WAIT"
            elif days_until > 14:
                return "WATCH"
            else:
                return "FLEXIBLE"
        elif direction == 2:  # price going up
            if confidence > 0.75:
                return "BUY_NOW"
            else:
                return "WATCH"
        else:  # stable
            return "STABLE"

    def _rule_based_fallback(self, features: np.ndarray) -> dict:
        """Simple rule-based prediction when model isn't available."""
        days_until = float(features[9]) if len(features) > 9 else 30
        is_holiday = bool(features[13]) if len(features) > 13 else False
        is_holiday_adj = bool(features[14]) if len(features) > 14 else False

        if days_until <= 3:
            signal, confidence = "BUY_NOW", 0.80
        elif days_until <= 7:
            signal, confidence = "BUY_NOW" if is_holiday or is_holiday_adj else "WATCH", 0.65
        elif days_until <= 21:
            signal, confidence = "WATCH", 0.60
        elif days_until <= 45:
            signal, confidence = "FLEXIBLE", 0.55
        else:
            signal, confidence = "WAIT", 0.58

        return {
            "signal": signal,
            "confidence": confidence,
            "predicted_change_pct": 0.0,
            "direction": "up" if signal == "BUY_NOW" else "down" if signal == "WAIT" else "stable",
        }

    def save(self) -> None:
        """Save trained models to artifacts."""
        if not self.is_loaded:
            return
        ARTIFACTS_PATH.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.classifier, ARTIFACTS_PATH / "xgb_classifier.joblib")
        joblib.dump(self.regressor, ARTIFACTS_PATH / "xgb_regressor.joblib")
        logger.info("XGBoost models saved")
