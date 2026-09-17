import os
import json
from pathlib import Path
from datetime import datetime, timedelta
from app.models.docs import DashboardResponse, DashboardMetric
from app.services.docs.session_notes import get_notes_by_case

def find_mock_file(filename: str) -> Path:
    curr = Path(__file__).resolve()
    for _ in range(6):
        candidate = curr / "shared" / "mocks" / filename
        if candidate.exists():
            return candidate
        curr = curr.parent
    return Path("shared/mocks") / filename

def get_dashboard(case_id: str) -> DashboardResponse:
    screening_file = find_mock_file("screening_result.mock.json")
    baseline = {"clarityScore": 62.0, "fluencyScore": 55.0, "pronunciationScore": 58.0, "voiceStabilityScore": 70.0}
    if screening_file.exists():
        try:
            with open(screening_file, "r") as f:
                data = json.load(f)
                baseline["clarityScore"] = float(data.get("clarityScore", 62))
                baseline["fluencyScore"] = float(data.get("fluencyScore", 55))
                baseline["pronunciationScore"] = float(data.get("pronunciationScore", 58))
                baseline["voiceStabilityScore"] = float(data.get("voiceStabilityScore", 70))
        except Exception:
            pass

    notes = get_notes_by_case(case_id)
    now = datetime.utcnow()
    dates = [(now - timedelta(weeks=11-i)).strftime("%Y-%m-%d") for i in range(12)]
    
    clarity_pts, fluency_pts, pron_pts, voice_pts = [], [], [], []
    c_base = baseline["clarityScore"]
    f_base = baseline["fluencyScore"]
    p_base = baseline["pronunciationScore"]
    v_base = baseline["voiceStabilityScore"]
    
    for i, d in enumerate(dates):
        progress = i / 11.0
        c_val = min(100.0, round(c_base - (1 - progress) * 20.0 + (i % 3) * 1.5, 1))
        f_val = min(100.0, round(f_base - (1 - progress) * 18.0 + (i % 2) * 1.2, 1))
        p_val = min(100.0, round(p_base - (1 - progress) * 22.0 + (i % 4) * 1.1, 1))
        v_val = min(100.0, round(v_base - (1 - progress) * 15.0 + (i % 2) * 1.0, 1))
        
        if notes and i >= (12 - len(notes)):
            c_val = min(100.0, c_val + 3.0)
            f_val = min(100.0, f_val + 2.5)
            
        clarity_pts.append({"date": d, "value": c_val})
        fluency_pts.append({"date": d, "value": f_val})
        pron_pts.append({"date": d, "value": p_val})
        voice_pts.append({"date": d, "value": v_val})

    attendance_pts = [{"date": d, "value": 1 if i % 6 != 2 else 0} for i, d in enumerate(dates)]
    milestone_pts = [{"date": d, "value": min(10, (i // 2) + 1)} for i, d in enumerate(dates)]
    
    phonemes = ["r", "s", "th", "l"]
    gen_data = {}
    for p in phonemes:
        # Values scaled to 0.0 - 1.0 ratio so UI formats as 89.8% instead of 8980%
        gen_data[f"/{p}/"] = [
            {"date": d, "value": min(1.0, round((35.0 + (i * 4.8) + (len(p) * 2)) / 100.0, 3))}
            for i, d in enumerate(dates)
        ]

    alert = False
    alert_msg = None
    try:
        from sklearn.ensemble import IsolationForest
        import numpy as np
        X = np.array([[pt["value"], attendance_pts[i]["value"] * 30] for i, pt in enumerate(clarity_pts)])
        clf = IsolationForest(contamination=0.15, random_state=42)
        clf.fit(X)
        preds = clf.predict(X)
        if preds[-1] == -1:
            alert = True
            alert_msg = "⚠ Progress plateau detected. Speech clarity and practice frequency show an anomalous pattern in recent sessions. Consider reassessment or plan adjustment."
    except Exception:
        pass

    return DashboardResponse(
        case_id=case_id,
        speech_clarity=DashboardMetric(label="Speech Clarity", data=clarity_pts),
        fluency=DashboardMetric(label="Fluency", data=fluency_pts),
        pronunciation=DashboardMetric(label="Pronunciation", data=pron_pts),
        voice_stability=DashboardMetric(label="Voice Stability", data=voice_pts),
        attendance=DashboardMetric(label="Attendance Rate", data=attendance_pts),
        milestone_progress=DashboardMetric(label="Milestones Achieved", data=milestone_pts),
        generalization_rate=gen_data,
        isolation_forest_alert=alert,
        alert_message=alert_msg
    )
