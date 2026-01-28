import os
import json
import time
import asyncio
from typing import List, Optional
from google import genai
from google.genai import types

AI_INTEGRATIONS_GEMINI_API_KEY = os.environ.get("AI_INTEGRATIONS_GEMINI_API_KEY")
AI_INTEGRATIONS_GEMINI_BASE_URL = os.environ.get("AI_INTEGRATIONS_GEMINI_BASE_URL")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

USE_REPLIT_INTEGRATION = bool(AI_INTEGRATIONS_GEMINI_API_KEY and AI_INTEGRATIONS_GEMINI_BASE_URL)

if USE_REPLIT_INTEGRATION:
    client = genai.Client(
        api_key=AI_INTEGRATIONS_GEMINI_API_KEY,
        http_options={
            'api_version': '',
            'base_url': AI_INTEGRATIONS_GEMINI_BASE_URL
        }
    )
    MODEL_NAME = "gemini-2.5-flash"
elif GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
    MODEL_NAME = "gemini-2.0-flash"
else:
    client = None
    MODEL_NAME = None

SYSTEM_PROMPT = """You are an AI Counsellor for a guided study-abroad platform.

You are NOT a chatbot. You ARE a decision-making counsellor, stage-aware guide, and execution-oriented agent.

## Context You Have
You always know:
- User profile (academics, goals, budget, exams)
- Profile completeness status
- Current stage
- Shortlisted universities
- Locked universities (if any)
- To-do list & task status

## Strict Stage Model

### Stage 1 — ONBOARDING (Building Profile)
Allowed: Ask onboarding questions, explain missing data, explain why data matters
Blocked: University recommendations, shortlisting, application guidance
If user asks for universities: Say NO, explain why, guide onboarding completion

### Stage 2 — DISCOVERY (Discovering Universities)
Allowed: Explain profile strengths & gaps, recommend universities (Dream/Target/Safe), explain why universities fit and risks, shortlist universities
Blocked: Application guidance, document timelines

### Stage 3 — LOCKED (Finalizing Universities)
Allowed: Compare shortlisted universities, explain trade-offs, lock universities (with confirmation), warn before unlocking
Blocked: SOP or application execution before locking

### Stage 4 — APPLICATION (Preparing Applications)
Allowed: Generate document checklists, create timelines, generate and update to-do tasks, guide SOP, exams, and forms

## Action-Based Responses
You must respond with JSON containing both a message and actions array. 

CRITICAL: When user asks to perform an action, you MUST include the action in your response.
- If user says "add X to shortlist" → include shortlist_university action
- If user says "lock X" or "I want to apply to X" → include lock_university action
- If user says "unlock X" → include unlock_university action
- If user says "create task" → include create_task action

Available actions (include in "actions" array):
- shortlist_university: {"type": "shortlist_university", "params": {"university_id": <int>, "category": "DREAM|TARGET|SAFE"}}
- lock_university: {"type": "lock_university", "params": {"university_id": <int>}}
- unlock_university: {"type": "unlock_university", "params": {"university_id": <int>}}
- create_task: {"type": "create_task", "params": {"title": "...", "description": "...", "priority": 1-3}}
- update_task: {"type": "update_task", "params": {"task_id": <int>, "status": "PENDING|IN_PROGRESS|COMPLETED"}}

IMPORTANT: 
- Always include university_id as an INTEGER from the Available Universities list
- If action is blocked by stage rules, still include it - backend will handle the error
- Never skip including an action if user explicitly requests it

## University Recommendation Logic
- Dream: University Min GPA > User GPA + 0.3 OR Tuition > User Budget
- Target: University Min GPA ≈ User GPA (within 0.2 range) AND Tuition <= Budget
- Safe: University Min GPA < User GPA - 0.2 AND Tuition <= Budget

## Response Format
Always respond with valid JSON:
{
    "message": "Your response to the user",
    "actions": [
        {"type": "action_type", "params": {...}}
    ],
    "suggested_universities": [
        {"university_id": 1, "category": "TARGET", "fit_reason": "...", "risk_reason": "..."}
    ]
}

## Tone
- Calm, confident, honest about risks
- Supportive but firm
- Never vague, never salesy
- If user tries to skip steps: Say NO, explain why, guide correct next step
"""

def analyze_profile_strength(profile: dict) -> dict:
    gpa = profile.get('gpa') or 0
    ielts_status = profile.get('ielts_toefl_status', 'NOT_STARTED')
    gre_status = profile.get('gre_gmat_status', 'NOT_STARTED')
    sop_status = profile.get('sop_status', 'NOT_STARTED')
    
    if gpa >= 3.5 and ielts_status == 'COMPLETED' and gre_status == 'COMPLETED':
        academic_strength = 'Strong'
    elif gpa < 2.5:
        academic_strength = 'Weak'
    else:
        academic_strength = 'Average'
    
    exam_strength = 'Completed' if ielts_status == 'COMPLETED' and gre_status == 'COMPLETED' else (
        'In Progress' if ielts_status == 'IN_PROGRESS' or gre_status == 'IN_PROGRESS' else 'Not Started'
    )
    
    return {
        'academics': academic_strength,
        'exams': exam_strength,
        'sop': sop_status.replace('_', ' ').title() if sop_status else 'Not Started',
        'overall': academic_strength
    }

def categorize_university(university: dict, user_profile: dict) -> tuple:
    user_gpa = user_profile.get('gpa') or 3.0
    user_budget = user_profile.get('budget_per_year') or 50000
    
    uni_min_gpa = university.get('min_gpa') or 3.0
    uni_tuition = university.get('tuition_per_year') or 30000
    
    if uni_min_gpa > user_gpa + 0.3 or uni_tuition > user_budget:
        category = 'DREAM'
        if uni_min_gpa > user_gpa + 0.3:
            risk = f"GPA requirement ({uni_min_gpa}) is higher than your current GPA ({user_gpa})"
        else:
            risk = f"Tuition (${uni_tuition:,}) exceeds your budget (${user_budget:,})"
        fit = "Prestigious program aligned with your goals"
    elif uni_min_gpa < user_gpa - 0.2 and uni_tuition <= user_budget:
        category = 'SAFE'
        risk = "Lower competition may mean less networking opportunities"
        fit = f"Your GPA ({user_gpa}) exceeds requirements ({uni_min_gpa}) and fits budget"
    else:
        category = 'TARGET'
        risk = "Competitive admission with moderate acceptance chances"
        fit = f"Good match - your profile meets requirements and budget"
    
    acceptance_rate = university.get('acceptance_rate', 0.5)
    if acceptance_rate < 0.1:
        acceptance_chance = 'Low'
    elif acceptance_rate < 0.4:
        acceptance_chance = 'Medium'
    else:
        acceptance_chance = 'High'
    
    if uni_tuition < 15000:
        cost_level = 'Low'
    elif uni_tuition < 40000:
        cost_level = 'Medium'
    else:
        cost_level = 'High'
    
    return category, fit, risk, acceptance_chance, cost_level

def build_context(user_data: dict, profile: dict, universities: list, shortlisted: list, tasks: list) -> str:
    profile_strength = analyze_profile_strength(profile) if profile else {}
    
    budget = profile.get('budget_per_year')
    budget_str = f"${budget:,}/year" if budget else "Not specified"
    countries = profile.get('preferred_countries', []) or []
    countries_str = ', '.join(countries) if countries else 'Not specified'
    
    context = f"""
## Current User Context

### User Info
- Name: {user_data.get('full_name', 'Unknown')}
- Current Stage: {user_data.get('current_stage', 'ONBOARDING')}
- Onboarding Completed: {user_data.get('onboarding_completed', False)}

### Profile
- Education: {profile.get('current_education_level') or 'Not provided'} in {profile.get('degree_major') or 'Not provided'}
- GPA: {profile.get('gpa') or 'Not provided'}
- Target Degree: {profile.get('intended_degree') or 'Not provided'} in {profile.get('field_of_study') or 'Not provided'}
- Target Countries: {countries_str}
- Budget: {budget_str}
- Funding: {profile.get('funding_plan') or 'Not specified'}
- IELTS/TOEFL: {profile.get('ielts_toefl_status') or 'NOT_STARTED'}
- GRE/GMAT: {profile.get('gre_gmat_status') or 'NOT_STARTED'}
- SOP Status: {profile.get('sop_status') or 'NOT_STARTED'}

### Profile Strength
- Academics: {profile_strength.get('academics', 'Unknown')}
- Exams: {profile_strength.get('exams', 'Unknown')}
- SOP: {profile_strength.get('sop', 'Unknown')}

### Shortlisted Universities ({len(shortlisted)})
"""
    for s in shortlisted:
        uni = s.get('university', {})
        context += f"- {uni.get('name', 'Unknown')} ({s.get('category', 'Unknown')}) - {'LOCKED' if s.get('is_locked') else 'Not Locked'}\n"
    
    context += f"\n### Pending Tasks ({len([t for t in tasks if t.get('status') == 'PENDING'])})\n"
    for t in tasks[:5]:
        context += f"- {t.get('title', 'Unknown')} ({t.get('status', 'Unknown')})\n"
    
    context += f"\n### Available Universities for Recommendation\n"
    for uni in universities[:10]:
        cat, fit, risk, acc, cost = categorize_university(uni, profile)
        context += f"- ID {uni['id']}: {uni['name']} ({uni['country']}) - ${uni['tuition_per_year']:,}/year, Min GPA: {uni['min_gpa']}, Category: {cat}\n"
    
    return context

async def get_counsellor_response(
    message: str,
    user_data: dict,
    profile: dict,
    universities: list,
    shortlisted: list,
    tasks: list
) -> dict:
    if client is None:
        return {
            "message": "AI Counsellor is not configured. Please set GEMINI_API_KEY environment variable.",
            "actions": [],
            "suggested_universities": []
        }
    
    context = build_context(user_data, profile or {}, universities, shortlisted, tasks)
    
    full_prompt = f"""{SYSTEM_PROMPT}

{context}

## User Message
{message}

Respond with valid JSON only. Include a helpful message and any actions to take based on the user's stage and request.
"""
    
    max_retries = 3
    retry_delay = 5  # Start with 5 seconds
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            response_text = response.text or "{}"
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                result = {
                    "message": response_text,
                    "actions": [],
                    "suggested_universities": []
                }
            
            if "message" not in result:
                result["message"] = "I'm here to help you with your study abroad journey."
            if "actions" not in result:
                result["actions"] = []
            if "suggested_universities" not in result:
                result["suggested_universities"] = []
                
            return result
            
        except Exception as e:
            error_str = str(e)
            # Check if it's a rate limit error (429)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
                if attempt < max_retries - 1:
                    # Wait with exponential backoff before retrying
                    wait_time = retry_delay * (2 ** attempt)
                    await asyncio.sleep(wait_time)
                    continue
            # For non-rate-limit errors or final attempt, return error
            return {
                "message": f"I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
                "actions": [],
                "suggested_universities": []
            }
    
    return {
        "message": "I'm experiencing high demand right now. Please try again in about 30 seconds.",
        "actions": [],
        "suggested_universities": []
    }
