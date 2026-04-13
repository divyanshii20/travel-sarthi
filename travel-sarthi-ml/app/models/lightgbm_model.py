"""LightGBM model — used as ensemble member alongside XGBoost."""
import numpy as np
import joblib
import os
from pathlib import Path
from typing import Optional
import logging

try:
    import lightgbm as lgb
    LGB_AVAILABLE = True
except ImportError:
    LGB_AVAILABLE = False

logger = logging.getLogger(__name__)

ARTIFACTS_PATH = Path(os.getenv("MODEL_ARTIFACTS_PATH", "./artifacts"))


class LightGBMPriceModel:
    def __init__(self):
        self.model: Optional[object] = None
        self.is_loaded = False

    def load(self) -> bool:
        if not LGB_AVAILABLE:
            return False

        model_path = ARTIFACTS_PATH / "lgb_model.joblib"
        if model_path.exists():
            try:
                self.model = joblib.load(model_path)
                self.is_loaded = True
                logger.info("LightGBM model loaded")
                return True
            except Exception as e:
                logger.error(f"Failed to load LightGBM: {e}")
                return False

        return False

    def predict_price_change(self, features: np.ndarray) -> float:
        """Predict price change percentage."""
        if not self.is_loaded or not LGB_AVAILABLE:
            return 0.0

        features_2d = features.reshape(1, -1) if features.ndim == 1 else features
        try:
            return float(self.model.predict(features_2d)[0])  # type: ignore[union-attr]
        except Exception as e:
            logger.error(f"LightGBM prediction failed: {e}")
            return 0.0

    def save(self) -> None:
        if not self.is_loaded:
            return
        ARTIFACTS_PATH.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, ARTIFACTS_PATH / "lgb_model.joblib")
