"""
Synthetic time-series data generator for dashboard documentation.
Generates 12 weekly data points ending today for various metrics.
"""
import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any
from sklearn.ensemble import IsolationForest


def generate_dashboard_timeseries(case_id: str) -> dict:
    """
    Generate synthetic time-series data for dashboard visualization.
    
    Args:
        case_id: The case ID to generate data for
        
    Returns:
        dict with keys for each metric containing list of {date, value} dicts
    """
    # Get the base path for mock files
    # Navigate from backend/app/services/docs/synthetic_data.py to shared/mocks
    base_path = Path(__file__).parent.parent.parent.parent.parent.parent / "shared" / "mocks"
    
    # Load mock data
    with open(base_path / "screening_result.mock.json", "r") as f:
        screening_result = json.load(f)
    
    with open(base_path / "learning_path.mock.json", "r") as f:
        learning_path = json.load(f)
    
    with open(base_path / "generalization_score.mock.json", "r") as f:
        generalization_score = json.load(f)
    
    # Generate 12 weekly dates ending today
    end_date = datetime.now()
    dates = [(end_date - timedelta(weeks=i)).strftime("%Y-%m-%d") for i in range(11, -1, -1)]
    
    # Extract baseline scores from screening result
    # Note: Using available fields from actual mock data
    fluency_baseline = screening_result.get("fluency_score", 0.65)
    language_score = screening_result.get("language_score", 0.72)
    
    # Derive other metrics from available data
    # Speech clarity: derived from overall severity and phoneme scores
    phoneme_avg = sum(screening_result.get("phoneme_scores", {}).values()) / max(len(screening_result.get("phoneme_scores", {})), 1)
    clarity_baseline = phoneme_avg * 0.9  # Slightly lower than average phoneme score
    
    # Pronunciation: derived from language score
    pronunciation_baseline = language_score * 0.85
    
    # Voice stability: synthetic based on overall metrics
    voice_stability_baseline = (fluency_baseline + language_score) / 2 * 0.8
    
    # Generate speech clarity time-series (random walk down from baseline)
    speech_clarity = _generate_random_walk_series(
        dates, 
        clarity_baseline, 
        direction="down", 
        variance=0.03
    )
    
    # Generate fluency time-series
    fluency = _generate_random_walk_series(
        dates,
        fluency_baseline,
        direction="down",
        variance=0.02
    )
    
    # Generate pronunciation time-series
    pronunciation = _generate_random_walk_series(
        dates,
        pronunciation_baseline,
        direction="down",
        variance=0.025
    )
    
    # Generate voice stability time-series
    voice_stability = _generate_random_walk_series(
        dates,
        voice_stability_baseline,
        direction="down",
        variance=0.02
    )
    
    # Generate attendance (binary 0/1, ~85% attendance)
    attendance = [
        {"date": date, "value": 1 if random.random() < 0.85 else 0}
        for date in dates
    ]
    
    # Generate milestone progress (cumulative count of completed milestones)
    milestones = learning_path.get("milestones", [])
    total_milestones = len(milestones)
    milestone_progress = []
    completed_count = 0
    for i, date in enumerate(dates):
        # Simulate milestones being completed over time
        if i > 0 and random.random() < 0.3:  # 30% chance each week to complete one
            completed_count = min(completed_count + 1, total_milestones)
        milestone_progress.append({"date": date, "value": completed_count})
    
    # Generate generalization rate per phoneme
    generalization_rate = {}
    current_gen_score = generalization_score.get("overall", 0.77)
    for phoneme in screening_result.get("phoneme_scores", {}).keys():
        # Generate 12 points trending upward from ~40% to current score
        phoneme_series = []
        start_score = 0.4
        for i, date in enumerate(dates):
            # Linear interpolation with some noise
            progress = i / 11  # 0 to 1
            base_value = start_score + (current_gen_score - start_score) * progress
            noise = random.uniform(-0.05, 0.05)
            value = max(0, min(1, base_value + noise))
            phoneme_series.append({"date": date, "value": round(value, 3)})
        generalization_rate[phoneme] = phoneme_series
    
    # Generate practice minutes for isolation forest
    practice_minutes = [random.randint(10, 40) for _ in range(12)]
    
    # Run IsolationForest on [speech_clarity, practice_minutes]
    # Use the actual speech_clarity values
    clarity_values = [point["value"] for point in speech_clarity]
    X = [[clarity_values[i], practice_minutes[i]] for i in range(12)]
    
    iso_forest = IsolationForest(contamination=0.1, random_state=42)
    iso_forest.fit(X)
    prediction = iso_forest.predict([X[-1]])  # Predict on last point
    isolation_forest_alert = prediction[0] == -1
    
    return {
        "speech_clarity": speech_clarity,
        "fluency": fluency,
        "pronunciation": pronunciation,
        "voice_stability": voice_stability,
        "attendance": attendance,
        "milestone_progress": milestone_progress,
        "generalization_rate": generalization_rate,
        "isolation_forest_alert": isolation_forest_alert
    }


def _generate_random_walk_series(
    dates: List[str], 
    baseline: float, 
    direction: str = "down",
    variance: float = 0.02
) -> List[Dict[str, Any]]:
    """
    Generate a random walk time series.
    
    Args:
        dates: List of date strings
        baseline: The final value (most recent)
        direction: "down" for earlier values being worse, "up" for better
        variance: Random variance per step
        
    Returns:
        List of {date, value} dicts
    """
    series = []
    current_value = baseline
    
    # Start from the past and work forward
    for i, date in enumerate(reversed(dates)):
        if direction == "down":
            # Earlier values are worse (lower)
            current_value = baseline - (len(dates) - 1 - i) * variance * baseline
        else:
            # Earlier values are better (higher)
            current_value = baseline + (len(dates) - 1 - i) * variance * baseline
        
        # Add some random noise
        noise = random.uniform(-variance * baseline, variance * baseline)
        current_value = max(0, min(1, current_value + noise))
        
        series.append({"date": date, "value": round(current_value, 3)})
    
    # Reverse to get chronological order
    series.reverse()
    
    # Ensure the last value is close to baseline ± 2%
    series[-1]["value"] = round(baseline + random.uniform(-0.02 * baseline, 0.02 * baseline), 3)
    
    return series
