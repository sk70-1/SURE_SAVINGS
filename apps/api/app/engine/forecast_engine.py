"""
Forecasting Engine for Smart Income Buffer.
Implements robust statistical time-series forecasting with trend weighting,
empirical variance confidence bands, and fallback algorithms.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
import statistics


class ForecastEngine:
    @staticmethod
    def forecast_next_period(
        weekly_incomes: List[float],
        base_date: datetime = None
    ) -> Dict[str, Any]:
        """
        Calculates expected next-cycle income along with upper/lower bounds and confidence.
        Uses weighted recency with momentum trend and variance bounds.
        """
        if base_date is None:
            base_date = datetime.now(timezone.utc)

        weekly_incomes = [float(x) for x in weekly_incomes if x is not None] if weekly_incomes else []

        if not weekly_incomes:
            return {
                "prediction_date": (base_date + timedelta(days=7)).strftime("%Y-%m-%d"),
                "expected_income": 0.0,
                "lower_bound": 0.0,
                "upper_bound": 0.0,
                "confidence": 0.50,
                "model_name": "zero_history_fallback",
                "forecast_points": []
            }

        n = len(weekly_incomes)

        # Fallback for small history (< 3 data points)
        if n < 3:
            avg_val = float(statistics.mean(weekly_incomes))
            return {
                "prediction_date": (base_date + timedelta(days=7)).strftime("%Y-%m-%d"),
                "expected_income": round(avg_val, 2),
                "lower_bound": round(avg_val * 0.80, 2),
                "upper_bound": round(avg_val * 1.20, 2),
                "confidence": 0.65,
                "model_name": "simple_average_fallback",
                "forecast_points": [
                    {
                        "date": (base_date + timedelta(days=7 * (i + 1))).strftime("%Y-%m-%d"),
                        "predicted": round(avg_val, 2),
                        "lower": round(avg_val * 0.80, 2),
                        "upper": round(avg_val * 1.20, 2)
                    }
                    for i in range(4)
                ]
            }

        # Use recent window (up to 12 weeks)
        window = weekly_incomes[-12:]
        w_len = len(window)

        # Weights: linearly increasing to give higher weight to recent payouts
        weights = [i + 1 for i in range(w_len)]
        total_weight = sum(weights)
        weighted_avg = sum(w * x for w, x in zip(weights, window)) / total_weight

        # Linear trend calculation
        # Simple slope estimate: comparing second half vs first half
        mid = w_len // 2
        first_half = window[:mid]
        second_half = window[mid:]
        mean_first = statistics.mean(first_half)
        mean_second = statistics.mean(second_half)
        trend_slope = (mean_second - mean_first) / max(1, (w_len - mid))

        # Moderate slope dampening to avoid runaway extrapolation
        damped_slope = trend_slope * 0.5
        expected = max(0.0, weighted_avg + damped_slope)

        # Standard deviation for confidence interval
        stdev = statistics.stdev(window) if w_len > 1 else (weighted_avg * 0.15)
        z_score = 1.645  # ~90% confidence interval

        lower = max(0.0, expected - (z_score * stdev))
        upper = expected + (z_score * stdev)

        # Confidence metric: higher sample size and lower coefficient of variation -> higher confidence
        cv = (stdev / weighted_avg) if weighted_avg > 0 else 1.0
        confidence = max(0.50, min(0.95, 0.95 - (cv * 0.35) + min(0.1, n * 0.01)))

        # Generate 4-week forecast trajectory
        forecast_points = []
        for week_idx in range(1, 5):
            proj_date = (base_date + timedelta(days=7 * week_idx)).strftime("%Y-%m-%d")
            proj_expected = max(0.0, expected + (damped_slope * (week_idx - 1) * 0.5))
            # Uncertainty widens slightly over time
            width_mult = 1.0 + (week_idx - 1) * 0.15
            proj_lower = max(0.0, proj_expected - (z_score * stdev * width_mult))
            proj_upper = proj_expected + (z_score * stdev * width_mult)

            forecast_points.append({
                "date": proj_date,
                "predicted": round(proj_expected, 2),
                "lower": round(proj_lower, 2),
                "upper": round(proj_upper, 2)
            })

        return {
            "prediction_date": (base_date + timedelta(days=7)).strftime("%Y-%m-%d"),
            "expected_income": round(expected, 2),
            "lower_bound": round(lower, 2),
            "upper_bound": round(upper, 2),
            "confidence": round(confidence, 2),
            "model_name": "adaptive_weighted_momentum",
            "forecast_points": forecast_points
        }
