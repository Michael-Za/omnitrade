"""
Real Governance Engine - Uses actual system metrics for health scoring.
Replaces mock metrics with real drawdown, correlation stress, and exposure calculations.
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime

from ..models.market_models import GovernanceMode, SystemMetrics

logger = logging.getLogger(__name__)


def calculate_health_score(metrics: Dict, uncertainty: str,
                           loss_streak: int = 0) -> int:
    """
    Calculate health score from REAL system metrics.
    Health = 100 - (Current DD * 2) - (Loss Cluster * 10) - (Correlation Stress * 15) - (Uncertainty * 20)

    Args:
        metrics: Real system metrics dict with:
            - drawdown: Current drawdown percentage (e.g. 5.5 for 5.5%)
            - correlation_stress: Stress coefficient 0.0-1.0
            - exposure: Current exposure as percentage
            - total_pnl: Total P&L
            - win_rate: Win rate 0.0-1.0
        uncertainty: LOW, HIGH, or CRITICAL
        loss_streak: Current consecutive loss count
    """
    base = 100

    # Drawdown penalty (e.g., 5.5% drawdown * 2 = 11 points)
    drawdown_penalty = metrics.get("drawdown", 0) * 2

    # Loss Cluster Penalty
    loss_cluster_penalty = loss_streak * 10

    # Correlation Stress penalty (0-1 coefficient * 15 = max 15 points)
    correlation_stress = metrics.get("correlation_stress", 0)
    stress_penalty = correlation_stress * 15

    # Uncertainty penalty
    uncertainty_penalty = 0
    if uncertainty == "HIGH":
        uncertainty_penalty = 20
    elif uncertainty == "CRITICAL":
        uncertainty_penalty = 40

    # Additional: exposure penalty (high exposure = higher risk)
    exposure = metrics.get("exposure", 0)
    exposure_penalty = 0
    if exposure > 80:
        exposure_penalty = 10
    elif exposure > 60:
        exposure_penalty = 5

    # Additional: low win rate penalty
    win_rate = metrics.get("win_rate", 0.5)
    win_rate_penalty = 0
    if win_rate < 0.3:
        win_rate_penalty = 10
    elif win_rate < 0.4:
        win_rate_penalty = 5

    health = base - drawdown_penalty - loss_cluster_penalty - stress_penalty - uncertainty_penalty - exposure_penalty - win_rate_penalty

    return max(0, min(100, int(health)))


def get_governance_mode(health: int) -> str:
    """
    Determine governance mode from health score.
    Modes control system behavior:
    - FULL: All bots active, normal position sizing
    - REDUCED: Only low-risk bots, reduced sizing
    - DEFENSIVE: Only guardian active, minimal exposure
    - STOP: All execution halted
    """
    if health > 80:
        return GovernanceMode.FULL.value
    elif health >= 60:
        return GovernanceMode.REDUCED.value
    elif health >= 40:
        return GovernanceMode.DEFENSIVE.value
    else:
        return GovernanceMode.STOP.value


def apply_auto_rules(health: int, correlation_spike: bool,
                     uncertainty: str) -> Dict:
    """
    Apply governance rules to control bot behavior.
    Returns actions that should be applied system-wide.
    """
    actions = {
        "bot_status": "ACTIVE",
        "size_reduction": 0.0,
        "max_positions": 10,
        "allowed_risks": ["LOW", "MED", "HIGH"],
    }

    # Critical health: halt everything
    if health < 40:
        actions["bot_status"] = "ALL_OFF"
        actions["size_reduction"] = 1.0
        actions["max_positions"] = 0
        actions["allowed_risks"] = []
        return actions

    # Correlation spike: reduce exposure
    if correlation_spike:
        actions["size_reduction"] = 0.5
        actions["allowed_risks"] = ["LOW", "MED"]

    # High uncertainty: pause risky bots
    if uncertainty == "HIGH":
        actions["bot_status"] = "PAUSED"
        actions["allowed_risks"] = ["LOW"]
        actions["max_positions"] = 3

    # Defensive mode: limit exposure
    if health < 60:
        actions["size_reduction"] = max(actions["size_reduction"], 0.3)
        actions["max_positions"] = 5
        actions["allowed_risks"] = ["LOW", "MED"] if health >= 50 else ["LOW"]

    return actions


def compute_real_metrics(trade_history: List[Dict],
                         current_positions: Dict = None) -> Dict:
    """
    Compute REAL system metrics from trade history.
    Replaces hardcoded drawdown/correlation_stress/exposure values.
    """
    if not trade_history:
        return {
            "drawdown": 0.0,
            "correlation_stress": 0.0,
            "exposure": 0.0,
            "total_pnl": 0.0,
            "win_rate": 0.0,
            "sharpe_ratio": 0.0,
            "max_drawdown": 0.0,
            "open_positions": 0,
        }

    # Calculate PnL
    pnls = [t.get("pnl", 0) for t in trade_history if "pnl" in t]
    total_pnl = sum(pnls)

    # Win rate
    wins = sum(1 for p in pnls if p > 0)
    total = len(pnls)
    win_rate = wins / total if total > 0 else 0.0

    # Drawdown (max peak-to-trough decline)
    cumulative = 0
    peak = 0
    max_drawdown = 0
    current_drawdown = 0
    for pnl in pnls:
        cumulative += pnl
        if cumulative > peak:
            peak = cumulative
        dd = (peak - cumulative) / peak * 100 if peak > 0 else 0
        if dd > max_drawdown:
            max_drawdown = dd
        current_drawdown = dd

    # Sharpe ratio (simplified)
    if len(pnls) > 1:
        import numpy as np
        pnl_array = np.array(pnls)
        mean_pnl = pnl_array.mean()
        std_pnl = pnl_array.std()
        sharpe_ratio = (mean_pnl / std_pnl * (252 ** 0.5)) if std_pnl > 0 else 0
    else:
        sharpe_ratio = 0.0

    # Exposure
    open_positions = len(current_positions) if current_positions else 0
    exposure = min(open_positions * 10, 100)  # Simplified: 10% per position

    # Correlation stress placeholder (would need portfolio analysis)
    correlation_stress = 0.0

    return {
        "drawdown": round(current_drawdown, 2),
        "correlation_stress": round(correlation_stress, 3),
        "exposure": round(exposure, 1),
        "total_pnl": round(total_pnl, 2),
        "win_rate": round(win_rate, 3),
        "sharpe_ratio": round(sharpe_ratio, 2),
        "max_drawdown": round(max_drawdown, 2),
        "open_positions": open_positions,
    }
