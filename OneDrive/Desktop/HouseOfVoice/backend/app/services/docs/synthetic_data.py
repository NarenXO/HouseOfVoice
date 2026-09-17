"""
Synthetic time-series data generator for dashboard documentation.
Generates 12 weekly data points ending today.
"""
import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any
from sklearn.ensemble import IsolationForest


def generate_dashboard_timeseries(case_id: str) -> Dict[str, Any]:
    """
    Generate synthetic dashboard time-series data for a given case_id.
    
    Returns a dict with metrics spanning 12 weekly data points ending today:
    - speech_clarity, fluency, pronunciation, voice_stability
    - attendance (binary 0/1, ~85% rate)
    - milestone_progress (cumulative completed milestones)
    - generalization_rate (per-phoneme array trending upward)
    - isolation_forest_alert (bool, based on anomaly detection)
    """
    # Base path to shared mocks
    base_path = Path(__file__).parent.parent.parent.parent.parent / "shared" / "mocks"
    
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
    # Note: using available fields from the actual mock data
    phoneme_scores = screening_result.get("phoneme_scores", {})
    fluency_baseline = screening_result.get("fluency_score", 0.65)
    language_baseline = screening_result.get("language_score", 0.72)
    
    # Derive metrics from available data
    speech_clarity_baseline = sum(phoneme_scores.values()) / len(phoneme_scores) if phoneme_scores else 0.5
    pronunciation_baseline = language_baseline
    voice_stability_baseline = (speech_clarity_baseline + fluency_baseline) / 2
    
    # Generate time series with random walk (earlier = worse, trending toward baseline)
    def generate_metric_series(baseline: float, num_points: int = 12) -> List[Dict[str, Any]]:
        series = []
        current = baseline * 0.7  # Start 30% worse than baseline
        
        for i in range(num_points):
            # Random walk toward baseline
            change = (baseline - current) * 0.1 + random.uniform(-0.02, 0.02)
            current = max(0, min(1, current + change))
            
            # Last point should be close to baseline ± 2%
            if i == num_points - 1:
                current = baseline + random.uniform(-0.02, 0.02)
                current = max(0, min(1, current))
            
            series.append({
                "date": dates[i],
                "value": round(current, 3)
            })
        
        return series
    
    # Generate speech metrics
    speech_clarity = generate_metric_series(speech_clarity_baseline)
    fluency = generate_metric_series(fluency_baseline)
    pronunciation = generate_metric_series(pronunciation_baseline)
    voice_stability = generate_metric_series(voice_stability_baseline)
    
    # Generate attendance (binary 0/1, ~85% rate)
    attendance = []
    for date in dates:
        attended = 1 if random.random() < 0.85 else 0
        attendance.append({"date": date, "value": attended})
    
    # Generate milestone progress (cumulative completed milestones)
    milestones = learning_path.get("milestones", [])
    total_milestones = len(milestones)
    milestone_progress = []
    completed_count = 0
    
    for i, date in enumerate(dates):
        # Gradually complete milestones over time
        if i > 0 and random.random() < 0.3 and completed_count < total_milestones:
            completed_count += 1
        milestone_progress.append({"date": date, "value": completed_count})
    
    # Generate generalization rate per phoneme
    generalization_rate = {}
    gen_phoneme = generalization_score.get("phoneme", "s")
    gen_baseline = generalization_score.get("overall", 0.77)
    
    gen_series = []
    current_gen = 0.4  # Start at 40%
    
    for i, date in enumerate(dates):
        # Trend upward from 40% to baseline
        change = (gen_baseline - current_gen) * 0.15 + random.uniform(-0.01, 0.01)
        current_gen = max(0, min(1, current_gen + change))
        
        # Last point should be close to the mock's current score
        if i == len(dates) - 1:
            current_gen = gen_baseline + random.uniform(-0.02, 0.02)
            current_gen = max(0, min(1, current_gen))
        
        gen_series.append({"date": date, "value": round(current_gen, 3)})
    
    generalization_rate[gen_phoneme] = gen_series
    
    # Generate practice minutes for isolation forest
    practice_minutes = [random.randint(10, 40) for _ in range(12)]
    
    # Run IsolationForest on [speech_clarity, practice_minutes]
    features = []
    for i in range(12):
        features.append([
            speech_clarity[i]["value"],
            practice_minutes[i]
        ])
    
    iso_forest = IsolationForest(contamination=0.1, random_state=42)
    iso_forest.fit(features)
    
    # Predict on the last point
    last_point_features = [[speech_clarity[-1]["value"], practice_minutes[-1]]]
    prediction = iso_forest.predict(last_point_features)
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
