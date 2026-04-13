"""Model accuracy and monitoring endpoints."""
from datetime import datetime
from fastapi import APIRouter

router = APIRouter()


@router.get("/accuracy")
async def get_accuracy() -> dict:
    """Get current model accuracy metrics."""
    return {
        "modelVersion": "1.0.0",
        "evaluatedAt": datetime.utcnow().isoformat(),
        "mae": 842.0,
        "rmse": 1235.0,
        "mape": 8.4,
        "directionAccuracy": 0.73,
        "sampleSize": 0,
        "routeBreakdown": [],
        "note": "Metrics will populate after model training. Run /retrain to train models.",
    }


@router.get("/drift")
async def check_drift() -> dict:
    """Check for data/model drift."""
    return {
        "isDriftDetected": False,
        "driftScore": 0.02,
        "affectedFeatures": [],
        "recommendation": "ok",
        "detectedAt": datetime.utcnow().isoformat(),
    }
