import json
import logging
import hashlib
from typing import List, Dict, Any
from enum import Enum
from gemini_key_manager import key_manager
from google.genai import types

logger = logging.getLogger(__name__)

class IntentType(str, Enum):
    PROFILE_ANALYSIS = "PROFILE_ANALYSIS"
    UNIVERSITY_DISCOVERY = "UNIVERSITY_DISCOVERY"
    PROGRAM_SPECIFIC_QUERY = "PROGRAM_SPECIFIC_QUERY"
    FIELD_SWITCH = "FIELD_SWITCH"
    EXAM_STRATEGY = "EXAM_STRATEGY"
    COMPARISON = "COMPARISON"
    NEXT_STEPS = "NEXT_STEPS"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"

STRICT_INTENT_PROMPT = """
You are an Intent Detection Router for a study-abroad counsellor.
Classify the user's message into exactly ONE of these intents:

1. **PROFILE_ANALYSIS**: "Am I good enough?", "What are my chances?"
2. **UNIVERSITY_DISCOVERY**: "Suggest universities", "Where should I apply?" (General)
3. **PROGRAM_SPECIFIC_QUERY**: "MS Data Science programs", "MBA in UK" (Specific)
4. **FIELD_SWITCH**: "What about Data Science instead?", "Switch to CS" (Explicit change)
5. **EXAM_STRATEGY**: "GRE score for this?", "Do I need IELTS?"
6. **COMPARISON**: "Compare standard vs premium", "Is X better than Y?"
7. **NEXT_STEPS**: "What do I do now?", "How to apply?"
8. **OUT_OF_SCOPE**: "Write me a poem", "Who is the president?"

Also extract strict search constraints.

## Output Format (Strict JSON)
{
    "intent": "INTENT_TYPE",
    "target_discipline": "string or null",
    "target_degree": "string or null", 
    "max_budget_usd": "integer or null",
    "target_countries": ["string"],
    "category_preference": "DREAM|TARGET|SAFE or null",
    "explicit_university_mentions": ["string"]
}
"""

async def detect_intent(message: str, user_profile: dict) -> Dict[str, Any]:
    """
    Uses LLM to classify intent and extract constraints.
    """
    if not key_manager.has_keys():
        return {"intent": IntentType.OUT_OF_SCOPE}

    full_prompt = f"{STRICT_INTENT_PROMPT}\n\nUser Message: {message}\nUser Profile Context: {str(user_profile)}"

    client, _ = key_manager.create_client()
    if not client:
        return {"intent": IntentType.OUT_OF_SCOPE}

    try:
        response = client.models.generate_content(
            model=key_manager.get_model_name(),
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        data = json.loads(response.text)
        
        # Sanitize data types
        if data.get("max_budget_usd") == "null":
            data["max_budget_usd"] = None
        if data.get("target_discipline") == "null":
            data["target_discipline"] = None
        if data.get("target_degree") == "null":
            data["target_degree"] = None
        
        # Ensure max_budget is int if present
        if data.get("max_budget_usd"):
            try:
                data["max_budget_usd"] = int(data["max_budget_usd"])
            except (ValueError, TypeError):
                data["max_budget_usd"] = None
                
        # Validate intent
        if data.get("intent") not in IntentType.__members__:
            data["intent"] = IntentType.UNIVERSITY_DISCOVERY # Fallback
        return data
    except Exception as e:
        logger.error(f"Intent detection failed: {e}")
        return {"intent": IntentType.UNIVERSITY_DISCOVERY}

def check_query_delta(current_intent: Dict, history: List[Dict]) -> Dict:
    """
    Compares current intent with history to detect repetition or field switches.
    Returns a 'delta_context' dict explaining what changed.
    """
    if not history:
        return {"is_new_session": True, "change_summary": "Initial Query"}
        
    last_user_msg = None
    for msg in reversed(history):
        if msg.get("role") == "user":
            last_user_msg = msg
            break
            
    if not last_user_msg:
         return {"is_new_session": True, "change_summary": "Initial Query"}

    # In a real system, we'd store the parsed intent of the last message.
    # Here we have to infer or rely on the visible text comparison if intent wasn't stored.
    # ideally we store intent in 'actions_taken' or metadata.
    
    delta = {
        "is_repetition": False,
        "is_field_switch": False,
        "change_summary": "Follow-up query"
    }
    
    # 1. Check Field Switch
    current_disc = current_intent.get("target_discipline")
    # This is a weak check without stored history intent, but better than nothing.
    if current_intent.get("intent") == IntentType.FIELD_SWITCH:
        delta["is_field_switch"] = True
        delta["change_summary"] = f"User switched focus to {current_disc}"

    return delta

def normalize_string(s: str) -> str:
    return s.lower().strip() if s else ""

def filter_programs(universities: List[Dict], intent: Dict, user_profile: Dict) -> List[Dict]:
    """
    Strictly filters university list based on Intent AND User Profile.
    """
    filtered_universities = []
    
    # Intent Logic
    target_discipline = normalize_string(intent.get("target_discipline"))
    target_degree = normalize_string(intent.get("target_degree"))
    max_budget = intent.get("max_budget_usd")
    countries = [normalize_string(c) for c in intent.get("target_countries", [])]
    
    # Fallback/Persistence Logic
    if not target_discipline and intent.get("intent") not in [IntentType.FIELD_SWITCH, IntentType.PROGRAM_SPECIFIC_QUERY]:
         target_discipline = normalize_string(user_profile.get("field_of_study"))
    
    # If explicit field switch, STRICTLY enforce it
    is_strict_discipline = intent.get("intent") in [IntentType.FIELD_SWITCH, IntentType.PROGRAM_SPECIFIC_QUERY]

    logger.info(f"Filtering -> Discipline: {target_discipline} (Strict: {is_strict_discipline})")

    for uni in universities:
        # 1. Country Filter
        if countries and normalize_string(uni.get("country")) not in countries:
            continue
            
        # 2. Program Level Filter
        valid_programs = []
        original_programs = uni.get("programs", [])
        
        for prog in original_programs:
            prog_name = normalize_string(prog.get("name"))
            prog_disc = normalize_string(prog.get("program_discipline"))
            
            # Discipline Check
            if target_discipline:
                match = target_discipline in prog_name or target_discipline in prog_disc
                
                if is_strict_discipline:
                    if not match:
                        continue # Strict rejection
                else:
                    # Soft preference? For now, let's stick to strict if we have a target
                    if not match:
                        continue

            # Degree Level Match
            if target_degree:
                prog_level = normalize_string(prog.get("degree_level"))
                if "master" in target_degree or "ms" in target_degree:
                    if "master" not in prog_level and "ms" not in prog_level and "m.sc" not in prog_level:
                        continue
            
            # Budget Match
            if max_budget and prog.get("tuition_per_year_usd", 999999) > max_budget:
                continue
                
            valid_programs.append(prog)
            
        if valid_programs:
            uni_copy = uni.copy()
            uni_copy["programs"] = valid_programs
            filtered_universities.append(uni_copy)

    return filtered_universities

def compute_response_fingerprint(response_text: str) -> str:
    """hashes response to detect exact duplicates"""
    return hashlib.md5(response_text.encode()).hexdigest()
