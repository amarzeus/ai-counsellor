import json
import logging
import asyncio
from typing import List, Optional
from google.genai import types

from gemini_key_manager import key_manager

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an AI Counsellor for a guided study-abroad platform.

You are NOT a chatbot. You ARE a decision-making counsellor, stage-aware guide, and execution-oriented agent.

## CRITICAL: READ-ONLY DATA POLICY
1. **NO HALLUCINATIONS**: You must ONLY recommend universities provided in the "Available Universities" context.
2. **NO INVENTED FACTS**: Do not make up rankings, tuition fees, or admission requirements. If data is missing (e.g., "Unknown"), say "I don't have that information verified yet."
3. **STRICT CITATION**: When recommending, cite the "Data Source" field (e.g., "According to QS 2024...").

## Persona Instructions
1. **Be Proactive**: Guide the user based on their stage.
2. **Be Strict but Mentor-like**: If a user tries to jump ahead, refuse politey and explain why.
3. **Be Data-Driven**: Use "Fit Reason" and "Risk Reason" heavily.
4. **Be Feature-Gated**: Respect the user's subscription plan.
   - If FREE plan: You CANNOT recommend [PREMIUM_LOCKED] programs. Explain they are available on Premium.
   - If FREE plan: You CANNOT lock universities (Response: "Locking is a Premium feature.").
   - If FREE plan: You limit Shortlists to 3 (but the API enforces this, you just warn).

## Context You Have
- **User Profile**: Academics, goals, budget, exams.
- **Current Stage**: ONBOARDING -> DISCOVERY -> LOCKED -> APPLICATION.
- **Shortlist**: Current user selection.
- **Available Universities**: THE ONLY universities you know.

## Strict Stage Model

### Stage 1 — ONBOARDING
Allowed: Ask questions to complete profile.
Blocked: Recommending universities (Say: "I need your profile first to find the best fit.").

### Stage 2 — DISCOVERY
Allowed: Recommend universities, Shortlist actions.
Blocked: SOP writing, Application guidance.

### Stage 3 — LOCKED
Allowed: Compare/Rank shortlisted universities, Lock actions.
Blocked: SOP writing before locking.

### Stage 4 — APPLICATION
Allowed: SOP Review, Document checklists, Tasks.

## Action-Based Responses
You must respond with JSON containing both a message and actions array.

Available actions:
- shortlist_university: {"type": "shortlist_university", "params": {"university_id": <int>, "category": "DREAM|TARGET|SAFE"}}
- lock_university: {"type": "lock_university", "params": {"university_id": <int>}}
- unlock_university: {"type": "unlock_university", "params": {"university_id": <int>}}
- create_task: {"type": "create_task", "params": {"title": "...", "description": "...", "priority": 1-3}}

## Response Format (Strict JSON)
{
    "message": "Your helpful response...",
    "actions": [{"type": "action_type", "params": {...}}],
    "suggested_universities": [
        {
            "university_id": 1,
            "category": "TARGET",
            "fit_reason": "Your GPA (3.6) > Min Requirement (3.0).",
            "risk_reason": "Tuition ($58k) > Budget ($50k)."
        }
    ],
    "suggested_next_questions": ["What are the deadlines?", "Do I need GRE?"]
}
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
    
    if uni_min_gpa > user_gpa + 0.3 or uni_tuition > user_budget * 1.2:
        category = 'DREAM'
        if uni_min_gpa > user_gpa + 0.3:
            risk = f"GPA requirement ({uni_min_gpa}) is higher than your current GPA ({user_gpa})"
        else:
            risk = f"Tuition (${uni_tuition:,}) exceeds your budget (${user_budget:,})"
        fit = "Prestigious program aligned with your goals"
    elif uni_min_gpa <= user_gpa - 0.2 and uni_tuition <= user_budget:
        category = 'SAFE'
        risk = "Lower competition may mean less networking opportunities"
        fit = f"Your GPA ({user_gpa}) exceeds requirements ({uni_min_gpa}) and fits budget"
    else:
        category = 'TARGET'
        risk = "Competitive admission with moderate acceptance chances"
        fit = f"Good match - your profile meets requirements and budget"
    
    acceptance_rate = university.get('acceptance_rate') or 0.5  # Default to 0.5 if None
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
- Subscription Plan: {user_data.get('subscription_plan', 'FREE')}
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
    
    context += f"\n### Available Universities (READ-ONLY SOURCE)\n"
    
    # Calculate user specs
    user_work_exp = profile.get('work_experience_years', 0)
    user_gmat = profile.get('gre_gmat_status') == 'COMPLETED' # Simple check from status
    
    for uni in universities[:15]:  # Increased context window
        cat, fit, risk, acc, cost = categorize_university(uni, profile)
        
        # Format programs with eligibility check
        programs_str = ""
        programs = uni.get('programs', [])
        
        eligible_programs = []
        for p in programs[:3]: # Top 3 programs
            # Eligibility Validation
            reasons = []
            if p.get('requires_work_experience') and user_work_exp < p.get('min_work_experience_years', 0):
                reasons.append(f"Requires {p.get('min_work_experience_years')}y Work Exp (User: {user_work_exp}y)")
            
            if p.get('gmat_required') and not user_gmat:
                reasons.append("Requires GMAT")
            
            tags = f"Category: {p.get('program_category', 'STEM')}"
            
            # Premium Gating Logic
            user_plan = user_data.get('subscription_plan', 'FREE')
            is_tier_2 = p.get('program_category') in ['BUSINESS', 'MBA', 'MANAGEMENT'] or p.get('program_discipline') in ['MBA', 'Management']

            if is_tier_2 and user_plan == 'FREE':
                programs_str += f"\n  - [PREMIUM_LOCKED] {p.get('name')} (Tier 2)"
                continue
            
            if reasons:
                programs_str += f"\n  - [INELIGIBLE] {p.get('name')} ({p.get('degree_level')}): {', '.join(reasons)}"
            else:
                programs_str += f"\n  - {p.get('name')} ({p.get('degree_level')}): ${p.get('tuition_per_year_usd', 0):,}/yr, Min GPA: {p.get('min_gpa', 'N/A')}, {tags}"
        
        context += f"- [ID: {uni['id']}] {uni['name']} ({uni['country']}, {uni.get('city', 'Unknown')})\n"
        context += f"  Rank: #{uni.get('qs_ranking', 'NR')} (QS), Status: {'Public' if uni.get('is_public') else 'Private'}\n"
        context += f"  Category: {cat} | Acceptance: {acc} | Cost: {cost}\n"
        context += f"  Programs:{programs_str}\n"
        context += f"  Source: {uni.get('data_source', 'Verified Internal DB')}\n"
    
    return context

async def get_counsellor_response(
    message: str,
    user_data: dict,
    profile: dict,
    universities: list,
    shortlisted: list,
    tasks: list
) -> dict:
    """Get AI counsellor response with automatic API key rotation."""
    
    # Check if any keys are available
    if not key_manager.has_keys():
        return {
            "message": "AI Counsellor is not configured. Please set GEMINI_API_KEY or GEMINI_API_KEYS environment variable.",
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
    
    # Track which keys we've tried (for retry with different key)
    tried_key_indices = []
    max_attempts = len(key_manager.keys)  # Try ALL available keys
    
    for attempt in range(max_attempts):
        # Get a client with a key we haven't tried yet
        client, key_index = key_manager.create_client(exclude_indices=tried_key_indices)
        
        if client is None:
            # No more keys available
            break
        
        tried_key_indices.append(key_index)
        
        try:
            response = client.models.generate_content(
                model=key_manager.get_model_name(),
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
            if "suggested_next_questions" not in result:
                result["suggested_next_questions"] = []
                
            return result
            
        except Exception as e:
            error_str = str(e)
            # Check if it's a rate limit / quota error
            is_quota_error = "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower()
            
            if is_quota_error:
                logger.warning(f"Quota error on key #{key_index + 1}: {error_str[:100]}")
                
                # If we have more keys to try, continue to next iteration
                if attempt < max_attempts - 1:
                    logger.info(f"Retrying with a different API key...")
                    await asyncio.sleep(1)  # Brief pause before retry
                    continue
                else:
                    # All keys exhausted
                    return {
                        "message": f"AI Service is temporarily unavailable due to high traffic (Quota exceeded after {len(tried_key_indices)} attempts). Please try again in a few minutes.",
                        "actions": [],
                        "suggested_universities": []
                    }
            
            # For non-rate-limit errors, return error immediately
            logger.error(f"AI service error: {error_str}")
            return {
                "message": f"I apologize, but I'm having trouble connecting to the AI service. ({str(e)[:50]}...)",
                "actions": [],
                "suggested_universities": []
            }
    
    return {
        "message": "I'm experiencing high demand right now. Please try again in about 30 seconds.",
        "actions": [],
        "suggested_universities": []
    }
