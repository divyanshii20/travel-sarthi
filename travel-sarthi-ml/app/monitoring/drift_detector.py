"""
Data drift detection using Evidently.
Monitors feature distributions to detect when retraining is needed.
"""
import logging
import numpy as np
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from evidently.report import Report
    from evidently.metric_preset import DataDriftPreset
    from evidently import ColumnMapping
    import pandas as pd
    EVIDENTLY_AVAILABLE = True
except ImportError:
    EVIDENTLY_AVAILABLE = False

from app.features.engineer import FEATURE_NAMES


class DriftDetector:
    """Monitors prediction request distributions for drift."""

    def __init__(self, window_size: int = 1000, drift_threshold: float = 0.15):
        self.window_size = window_size
        self.drift_threshold = drift_threshold
        self.reference_data: Optional[np.ndarray] = None
        self.current_window: list[np.ndarray] = []
        self.last_check: Optional[datetime] = None

    def set_reference(self, data: np.ndarray) -> None:
        """Set reference dataset for drift comparison."""
        self.reference_data = data
        logger.info(f"Drift reference set with {len(data)} samples")

    def add_prediction(self, features: np.ndarray) -> None:
        """Add incoming prediction features to drift window."""
        self.current_window.append(features)
        if len(self.current_window) > self.window_size:
            self.current_window.pop(0)

    def check_drift(self) -> dict:
        """Check if drift is detected in current window."""
        self.last_check = datetime.utcnow()

        if not EVIDENTLY_AVAILABLE:
            return {
                "isDriftDetected": False,
                "driftScore": 0.0,
                "affectedFeatures": [],
                "recommendation": "ok",
                "detectedAt": self.last_check.isoformat(),
                "note": "Evidently not available",
            }

        if self.reference_data is None or len(self.current_window) < 100:
            return {
                "isDriftDetected": False,
                "driftScore": 0.0,
                "affectedFeatures": [],
                "recommendation": "ok",
                "detectedAt": self.last_check.isoformat(),
                "note": "Insufficient data for drift detection",
            }

        try:
            ref_df = pd.DataFrame(self.reference_data[:self.window_size], columns=FEATURE_NAMES)
            cur_df = pd.DataFrame(np.array(self.current_window), columns=FEATURE_NAMES)

            report = Report(metrics=[DataDriftPreset()])
            report.run(reference_data=ref_df, current_data=cur_df)

            result = report.as_dict()
            drift_metrics = result.get("metrics", [{}])[0].get("result", {})

            share_drifted = drift_metrics.get("share_of_drifted_columns", 0.0)
            drifted_features = drift_metrics.get("drift_by_columns", {})
            affected = [col for col, stats in drifted_features.items() if stats.get("drift_detected", False)]

            is_drifted = share_drifted > self.drift_threshold
            recommendation = "retrain" if is_drifted else ("monitor" if share_drifted > 0.05 else "ok")

            return {
                "isDriftDetected": is_drifted,
                "driftScore": round(share_drifted, 4),
                "affectedFeatures": affected,
                "recommendation": recommendation,
                "detectedAt": self.last_check.isoformat(),
            }
        except Exception as e:
            logger.error(f"Drift detection failed: {e}")
            return {
                "isDriftDetected": False,
                "driftScore": 0.0,
                "affectedFeatures": [],
                "recommendation": "ok",
                "detectedAt": self.last_check.isoformat(),
                "error": str(e),
            }


# Singleton
_detector: Optional[DriftDetector] = None


def get_drift_detector() -> DriftDetector:
    global _detector
    if _detector is None:
        _detector = DriftDetector()
    return _detector
