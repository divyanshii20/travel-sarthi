"""GRU (Gated Recurrent Unit) model for time-series price trend prediction."""
import numpy as np
import os
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

ARTIFACTS_PATH = Path(os.getenv("MODEL_ARTIFACTS_PATH", "./artifacts"))

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


if TORCH_AVAILABLE:
    class PriceGRU(nn.Module):  # type: ignore[misc]
        """GRU model for sequential price trend prediction."""

        def __init__(self, input_size: int = 44, hidden_size: int = 128, num_layers: int = 2, dropout: float = 0.2):
            super().__init__()
            self.hidden_size = hidden_size
            self.num_layers = num_layers

            self.gru = nn.GRU(
                input_size=input_size,
                hidden_size=hidden_size,
                num_layers=num_layers,
                batch_first=True,
                dropout=dropout if num_layers > 1 else 0,
            )
            self.batch_norm = nn.BatchNorm1d(hidden_size)
            self.dropout = nn.Dropout(dropout)
            self.fc_trend = nn.Linear(hidden_size, 3)    # up / stable / down
            self.fc_magnitude = nn.Linear(hidden_size, 1)  # price change %

        def forward(self, x: "torch.Tensor") -> tuple["torch.Tensor", "torch.Tensor"]:
            """
            x: (batch, seq_len, features) or (batch, features) — handles both
            """
            if x.ndim == 2:
                x = x.unsqueeze(1)  # add sequence dimension

            gru_out, _ = self.gru(x)
            last_hidden = gru_out[:, -1, :]  # last timestep
            normed = self.batch_norm(last_hidden)
            dropped = self.dropout(normed)

            trend_logits = self.fc_trend(dropped)
            magnitude = self.fc_magnitude(dropped)

            return trend_logits, magnitude


class GRUPriceModel:
    def __init__(self):
        self.model: Optional[object] = None
        self.is_loaded = False
        self.device = "cpu"

    def load(self) -> bool:
        if not TORCH_AVAILABLE:
            logger.warning("PyTorch not available")
            return False

        model_path = ARTIFACTS_PATH / "gru_model.pt"
        if not model_path.exists():
            logger.warning("GRU model artifact not found")
            return False

        try:
            self.model = PriceGRU()
            state = torch.load(model_path, map_location=self.device)  # type: ignore[arg-type]
            self.model.load_state_dict(state)  # type: ignore[union-attr]
            self.model.eval()  # type: ignore[union-attr]
            self.is_loaded = True
            logger.info("GRU model loaded")
            return True
        except Exception as e:
            logger.error(f"Failed to load GRU model: {e}")
            return False

    def predict(self, features: np.ndarray) -> dict:
        """Predict price trend using GRU."""
        if not self.is_loaded or not TORCH_AVAILABLE:
            return {"trend_proba": [0.33, 0.34, 0.33], "magnitude": 0.0}

        try:
            x = torch.FloatTensor(features).unsqueeze(0)  # type: ignore[attr-defined]
            with torch.no_grad():  # type: ignore[attr-defined]
                trend_logits, magnitude = self.model(x)  # type: ignore[misc]
                trend_proba = torch.softmax(trend_logits, dim=-1).numpy()[0]  # type: ignore[attr-defined]
                mag = float(magnitude.numpy()[0][0])

            return {
                "trend_proba": trend_proba.tolist(),
                "magnitude": round(mag, 4),
            }
        except Exception as e:
            logger.error(f"GRU prediction failed: {e}")
            return {"trend_proba": [0.33, 0.34, 0.33], "magnitude": 0.0}

    def save(self) -> None:
        if not self.is_loaded or not TORCH_AVAILABLE:
            return
        ARTIFACTS_PATH.mkdir(parents=True, exist_ok=True)
        torch.save(self.model.state_dict(), ARTIFACTS_PATH / "gru_model.pt")  # type: ignore[union-attr]
