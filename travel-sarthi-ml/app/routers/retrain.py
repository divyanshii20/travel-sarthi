"""Model retraining endpoint."""
import asyncio
import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Header
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

# Simple job tracker
JOBS: dict[str, dict] = {}


def verify_api_key(x_api_key: Optional[str] = Header(default=None)) -> str:
    import os
    expected = os.getenv("ML_SERVICE_API_KEY", "")
    if expected and x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key or ""


class RetrainRequest(BaseModel):
    reason: str
    forceFull: bool = False
    hyperparamOverrides: dict = {}


@router.post("/retrain")
async def retrain(
    request: RetrainRequest,
    background_tasks: BackgroundTasks,
    _: str = Depends(verify_api_key),
) -> dict:
    """Trigger model retraining in background."""
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {
        "jobId": job_id,
        "status": "queued",
        "reason": request.reason,
        "createdAt": datetime.utcnow().isoformat(),
    }

    background_tasks.add_task(_run_retrain, job_id, request)

    return {
        "jobId": job_id,
        "status": "queued",
        "estimatedMinutes": 30,
        "mlflowRunUrl": None,
    }


@router.get("/retrain/{job_id}")
async def get_retrain_status(job_id: str) -> dict:
    """Get retraining job status."""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


async def _run_retrain(job_id: str, request: RetrainRequest) -> None:
    """Background retraining task."""
    try:
        JOBS[job_id]["status"] = "running"
        JOBS[job_id]["startedAt"] = datetime.utcnow().isoformat()

        logger.info(f"Retraining started for job {job_id}: {request.reason}")

        # In production: would fetch data from PostgreSQL, train models, log to MLflow
        await asyncio.sleep(2)  # Simulate training time

        # Reload ensemble after training
        from app.models.ensemble import get_ensemble, _ensemble
        if _ensemble:
            _ensemble.xgb.load()
            _ensemble.lgb.load()
            _ensemble.gru.load()

        JOBS[job_id]["status"] = "completed"
        JOBS[job_id]["completedAt"] = datetime.utcnow().isoformat()
        logger.info(f"Retraining completed for job {job_id}")

    except Exception as e:
        logger.error(f"Retraining failed for job {job_id}: {e}", exc_info=True)
        JOBS[job_id]["status"] = "failed"
        JOBS[job_id]["error"] = str(e)
