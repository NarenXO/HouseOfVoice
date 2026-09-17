import os
import json
import logging
from typing import Dict, Any, List
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Try to configure Gemini API if key is present
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

async def generate_gemini_therapy_plan(
    case_id: str,
    therapist_id: str,
    goals: List[str],
    session_mode: str,
    screening_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generates a structured 6-week speech therapy plan using Gemini Pro.
    Provides a clean fallback JSON if the API call fails or key is missing.
    """
    fallback_plan = {
        "week_1_2": "Establish baseline and build rapport. Introduce basic target sounds.",
        "week_3_4": "Focus on flagged errors (e.g., s-end of words). Practice with simple words.",
        "week_5_6": "Generalize sounds to short sentences. Review progress."
    }

    if not GEMINI_API_KEY:
        logger.warning("No GEMINI_API_KEY provided. Using fallback therapy plan.")
        return fallback_plan
        
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        You are an expert speech-language pathologist. Based on the following information, 
        draft a structured 6-week speech therapy plan.

        Case ID: {case_id}
        Therapist ID: {therapist_id}
        Session Mode: {session_mode}
        
        Therapy Goals:
        {', '.join(goals)}
        
        Screening Result Data:
        - Plain Language Summary: {screening_result.get('plainLanguageSummary', '')}
        - Flagged Errors: {', '.join(screening_result.get('flaggedErrors', []))}
        - Pronunciation Score: {screening_result.get('pronunciationScore', 'N/A')}
        - Fluency Score: {screening_result.get('fluencyScore', 'N/A')}
        
        Provide the 6-week plan in a structured JSON format with three keys:
        'week_1_2', 'week_3_4', and 'week_5_6'. Keep descriptions practical and concise.
        Do not include Markdown formatting, only the JSON object.
        """
        
        # We use generate_content instead of async since standard genai client is sync for generate_content
        # Or we use generate_content_async if available
        if hasattr(model, 'generate_content_async'):
            response = await model.generate_content_async(prompt)
        else:
            response = model.generate_content(prompt)
            
        text_response = response.text.strip()
        
        # Clean up markdown code blocks if the model included them despite instructions
        if text_response.startswith('```json'):
            text_response = text_response[7:]
        if text_response.startswith('```'):
            text_response = text_response[3:]
        if text_response.endswith('```'):
            text_response = text_response[:-3]
            
        draft_json = json.loads(text_response.strip())
        return draft_json
        
    except Exception as e:
        logger.error(f"Failed to generate Gemini plan: {str(e)}")
        return fallback_plan
