"""Health and readiness endpoints."""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "travel-sarthi-ml",
        "version": "1.0.0",
    }


@router.get("/ready")
async def ready() -> dict:
    from app.models.ensemble import get_ensemble
    ensemble = get_ensemble()

    models_status = {
        "xgb": ensemble.xgb.is_loaded,
        "lgb": ensemble.lgb.is_loaded,
        "gru": ensemble.gru.is_loaded,
    }

    ready = any(models_status.values())

    return {
        "ready": ready,
        "models": models_status,
        "usingFallback": not any([ensemble.xgb.is_loaded, ensemble.lgb.is_loaded, ensemble.gru.is_loaded]),
    }
