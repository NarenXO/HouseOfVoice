"""
Dashboard service for aggregating and formatting progress metrics.
"""
from app.models.docs import DashboardResponse, DashboardMetric
from app.services.docs.synthetic_data import generate_dashboard_timeseries


def get_dashboard(case_id: str) -> DashboardResponse:
    """
    Get dashboard data for a given case_id.
    
    Calls the synthetic data generator to produce time-series metrics,
    then formats them into the DashboardResponse structure.
    """
    # Generate synthetic time-series data
    timeseries_data = generate_dashboard_timeseries(case_id)
    
    # Map each metric to DashboardMetric with human-readable labels
    speech_clarity = DashboardMetric(
        label="Speech Clarity",
        data=timeseries_data["speech_clarity"]
    )
    
    fluency = DashboardMetric(
        label="Fluency",
        data=timeseries_data["fluency"]
    )
    
    pronunciation = DashboardMetric(
        label="Pronunciation",
        data=timeseries_data["pronunciation"]
    )
    
    voice_stability = DashboardMetric(
        label="Voice Stability",
        data=timeseries_data["voice_stability"]
    )
    
    attendance = DashboardMetric(
        label="Attendance",
        data=timeseries_data["attendance"]
    )
    
    milestone_progress = DashboardMetric(
        label="Milestone Progress",
        data=timeseries_data["milestone_progress"]
    )
    
    # Get generalization rate (already in the correct format)
    generalization_rate = timeseries_data["generalization_rate"]
    
    # Set alert message if isolation forest detected an anomaly
    isolation_forest_alert = timeseries_data["isolation_forest_alert"]
    alert_message = None
    
    if isolation_forest_alert:
        alert_message = (
            "⚠ Progress plateau detected. Speech clarity and practice "
            "frequency show an anomalous pattern in the most recent week. "
            "Consider reassessment or therapy plan adjustment."
        )
    
    return DashboardResponse(
        case_id=case_id,
        speech_clarity=speech_clarity,
        fluency=fluency,
        pronunciation=pronunciation,
        voice_stability=voice_stability,
        attendance=attendance,
        milestone_progress=milestone_progress,
        generalization_rate=generalization_rate,
        isolation_forest_alert=isolation_forest_alert,
        alert_message=alert_message
    )
