"""
Travel Sarthi ML Service — FastAPI Application
Price prediction using XGBoost + LightGBM + GRU ensemble.
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.ensemble import get_ensemble
from app.routers import predict, health, retrain, accuracy

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup, clean up on shutdown."""
    logger.info("🚀 Travel Sarthi ML Service starting up...")

    # Load ensemble — non-fatal if models aren't trained yet
    try:
        ensemble = get_ensemble()
        logger.info(
            f"Models loaded — XGB: {ensemble.xgb.is_loaded}, "
            f"LGB: {ensemble.lgb.is_loaded}, GRU: {ensemble.gru.is_loaded}"
        )
        if not any([ensemble.xgb.is_loaded, ensemble.lgb.is_loaded, ensemble.gru.is_loaded]):
            logger.warning(
                "No trained models found. Service will use rule-based fallback. "
                "Call POST /retrain to train models."
            )
    except Exception as e:
        logger.error(f"Model loading failed: {e} — using rule-based fallback")

    logger.info("✅ ML Service ready")
    yield

    logger.info("ML Service shutting down...")


app = FastAPI(
    title="Travel Sarthi ML Service",
    description="AI-powered flight price prediction for Travel Sarthi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", os.getenv("BACKEND_URL", "")],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health.router, tags=["Health"])
app.include_router(predict.router, tags=["Prediction"])
app.include_router(retrain.router, tags=["Training"])
app.include_router(accuracy.router, tags=["Monitoring"])
