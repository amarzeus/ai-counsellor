import json
import logging
import asyncio
import uuid
import random

from google.genai import types

from gemini_key_manager import key_manager
from recommendation_engine import detect_intent, filter_programs, check_query_delta

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an AI Counsellor for a guided study-abroad platform.

You are NOT a chatbot. You ARE a decision-making counsellor, stage-aware guide, and execution-oriented agent.

## CRITICAL: READ-ONLY DATA POLICY
1. **NO HALLUCINATIONS**: You must ONLY recommend universities provided in the "Available Universities" context.
2. **NO INVENTED FACTS**: Do not make up rankings, tuition fees, or admission requirements. If data is missing (e.g., "Unknown"), say "I don't have that information verified yet."
3. **STRICT CITATION**: When recommending, cite the "Data Source" field (e.g., "According to QS 2024...").

## CRITICAL: ELIGIBILITY & SAFETY
1. **RESPECT HARD CONSTRAINTS**: If a program is marked `[INELIGIBLE]` in the context (due to missing Work Exp, GMAT, etc.), you MUST NOT recommend it as a Target or Safe option.
2. **EXPLAIN REJECTIONS**: If a user asks for a specific program that is ineligible, explain EXACTLY why (e.g., "This program requires 3 years of work experience, but your profile indicates 0.").
3. **CATEGORY MATCHING**: Pay attention to the program category (STEM, Business, etc.). If a user wants "STEM" programs for OPT, prioritize those marked `Category: STEM`.

## Persona Instructions
1. **Be Proactive**: Guide the user based on their stage.
2. **Be Strict but Mentor-like**: If a user tries to jump ahead, refuse politey and explain why.
3. **Be Data-Driven**: Use "Fit Reason" and "Risk Reason" heavily.


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
        fit = "Good match - your profile meets requirements and budget"
    
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
    
    context += "\n### Available Universities (READ-ONLY SOURCE)\n"
    
    # Calculate user specs
    user_work_exp = profile.get('work_experience_years', 0)
    user_gmat = profile.get('gre_gmat_status') == 'COMPLETED' # Simple check from status
    
    for uni in universities[:100]:  # Increased context window to cover full seed data
        cat, fit, risk, acc, cost = categorize_university(uni, profile)
        
        # Format programs with eligibility check
        programs_str = ""
        programs = uni.get('programs', [])
        
        for p in programs[:3]: # Top 3 programs
            # Eligibility Validation
            reasons = []
            if p.get('requires_work_experience') and user_work_exp < p.get('min_work_experience_years', 0):
                reasons.append(f"Requires {p.get('min_work_experience_years')}y Work Exp (User: {user_work_exp}y)")
            
            if p.get('gmat_required') and not user_gmat:
                reasons.append("Requires GMAT")
            
            tags = f"Category: {p.get('program_category', 'STEM')}"
            
            # Premium Gating Logic - DISABLED
            # user_plan = user_data.get('subscription_plan', 'FREE')
            # is_tier_2 = p.get('program_category') in ['BUSINESS', 'MBA', 'MANAGEMENT'] or p.get('program_discipline') in ['MBA', 'Management']

            # if is_tier_2 and user_plan == 'FREE':
            #     programs_str += f"\n  - [PREMIUM_LOCKED] {p.get('name')} (Tier 2)"
            #     continue
            
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

    return context

def build_search_context(intent: dict, delta: dict) -> str:
    s = "### Active Search Constraints\n"
    s += f"- Intent: {intent.get('intent')}\n"
    s += f"- Context Change: {delta.get('change_summary')}\n"
    
    if intent.get("target_discipline"):
        s += f"- Field: {intent.get('target_discipline')}\n"
    if intent.get("target_degree"):
        s += f"- Degree: {intent.get('target_degree')}\n"
    if intent.get("max_budget_usd"):
        s += f"- Max Budget: ${intent.get('max_budget_usd'):,}\n"
    
    if intent.get("intent") == "FIELD_SWITCH":
        s += "\n## CRITICAL INSTRUCTION: FIELD SWITCH DETECTED\n"
        s += f"User has explicitly switched to {intent.get('target_discipline')}. You must NOT mention previous field programs.\n"
        s += "Explain WHY the recommendations changed (e.g., 'For Data Science specifically, ...').\n"
        
    return s

async def get_counsellor_response(
    message: str,
    user_data: dict,
    profile: dict,
    universities: list,
    shortlisted: list,
    tasks: list,
    history: list = []
) -> dict:
    """Get AI counsellor response with automatic API key rotation."""
    
    # 0. Fingerprint History for Anti-Repetition
    # We collect hashes of the last 3 assistant messages to block duplicates
    past_hashes = set()
    for h in history:
        if h.get('role') == 'model' or h.get('role') == 'assistant': # Handle both formats
             content = h.get('content', '') or ''
             # Simple hash of the first 50 chars (intro sentence) + length
             # This blocks the "Based on your profile..." repetition
             if len(content) > 20: 
                 intro_hash = f"{content[:50].strip()}_{len(content)}"
                 past_hashes.add(intro_hash)
                 
    # Check if any keys are available
    if not key_manager.has_keys():
        return {
            "message": "AI Counsellor is not configured. Please set GEMINI_API_KEY or GEMINI_API_KEYS environment variable.",
            "actions": [],
            "suggested_universities": []
        }
    
    # 1. Detect Intent
    intent = await detect_intent(message, profile or {})
    logger.info(f"Detected Intent: {intent}")
    
    # 2. Check Delta (History Comparison)
    delta = check_query_delta(intent, history)
    
    # 3. Filter Universities based on Intent
    filtered_universities = filter_programs(universities, intent, profile or {})
    
    # 4. Build Context
    base_context = build_context(user_data, profile or {}, filtered_universities, shortlisted, tasks)
    search_context = build_search_context(intent, delta)
    
    full_context = f"{base_context}\n{search_context}\n"
    
    # 5. Anti-Repetition Rules
    full_context += """
    ## MANDATORY ANTI-REPETITION RULES
    1. Do NOT start with "Based on your profile...". Use a direct, fresh opening.
    2. If this is a FIELD SWITCH, explicitly mention: "Switching focus to [Field]..."
    3. If 'Available Universities' is empty for this specific field, say so. Do NOT fallback to generic lists.
    """
    
    full_prompt = f"""{SYSTEM_PROMPT}

{full_context}

## User Message
{message}

Respond with valid JSON only. Include a helpful message and any actions to take based on the user's stage and request.

## SYSTEM ENTROPY / SALT
Current Session ID: {str(uuid.uuid4())}
RNG Seed: {random.randint(1, 10000)}
Goal: Ensure this response is unique from any previous output.
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
            
            # --- FINGERPRINT CHECK ---
            new_msg = result.get("message", "")
            new_hash = f"{new_msg[:50].strip()}_{len(new_msg)}"
            
            # If intro matches exactly what we said before, REJECT IT (unless it's a generic failure message)
            if new_hash in past_hashes and len(new_msg) > 20 and attempt < max_attempts - 1:
                logger.warning(f"DUPLICATE RESPONSE DETECTED via fingerprint: {new_hash}. Retrying...")
                # Add explicit penalty to prompt for next attempt
                full_prompt += "\n\nSYSTEM ALERT: You just generated a duplicate response. DO NOT repeat yourself. Write a completely different opening."
                continue 
                
            return result
            
        except Exception as e:
            error_str = str(e)
            # Check if it's a rate limit / quota error
            is_quota_error = "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower()
            
            if is_quota_error:
                logger.warning(f"Quota error on key #{key_index + 1}: {error_str[:100]}")
                
                # If we have more keys to try, continue to next iteration
                if attempt < max_attempts - 1:
                    logger.info("Retrying with a different API key...")
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
    

SOP_SYSTEM_PROMPT = """You are an expert Admissions Committee Officer at a top-tier university.
Your task is to review a Statement of Purpose (SOP) and provide structured, critical, and constructive feedback.

## Review Criteria
1. **Clarity & Structure**: Is the flow logical? Does it have a clear hook?
2. **Content Strength**: Does it show (not just tell) achievements? Is the motivation clear?
3. **Grammar & Tone**: Is the language professional, concise, and error-free?
4. **Impact**: Does it stand out?

## Output Format (Strict JSON)
{
    "overall_score": <int 1-100>,
    "strengths": ["<strength 1>", "<strength 2>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>"],
    "grammar_mistakes": ["<mistake 1>"],
    "improved_snippet": "<Rewrite the weakest paragraph to be stronger>",
    "ai_feedback": "<Overall summary and advice>"
}
"""

async def analyze_sop(sop_text: str, university_name: str = None, program_name: str = None) -> dict:
    """Analyze SOP using Gemini."""
    
    if not key_manager.has_keys():
        return {
            "overall_score": 0,
            "strengths": [],
            "weaknesses": ["AI Service Unavailable - No API Key"],
            "grammar_mistakes": [],
            "improved_snippet": None,
            "ai_feedback": "Please configure the API Key to use this feature."
        }

    client, key_index = key_manager.create_client() # Simple client creation for now
    
    context = ""
    if university_name:
        context += f"Target University: {university_name}\n"
    if program_name:
        context += f"Target Program: {program_name}\n"
        
    full_prompt = f"""{SOP_SYSTEM_PROMPT}

{context}

## Student SOP
{sop_text}

Analyze this SOP and provide feedback in JSON format.
"""

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
            return json.loads(response_text)
        except json.JSONDecodeError:
            return {
                "overall_score": 0,
                "strengths": [],
                "weaknesses": ["Failed to parse AI response"],
                "grammar_mistakes": [],
                "improved_snippet": None,
                "ai_feedback": "Error analyzing SOP. Please try again."
            }
            
    except Exception as e:
        logger.error(f"SOP Analysis Error: {str(e)}")
        return {
            "overall_score": 0,
            "strengths": [],
            "weaknesses": [f"Error: {str(e)}"],
            "grammar_mistakes": [],
            "improved_snippet": None,
            "ai_feedback": "An error occurred during analysis."
        }


CHECKLIST_SYSTEM_PROMPT = """You are an expert Study Abroad Consultant.
Your task is to generate a specific, actionable Checklist of application documents for a student applying to a specific university.

## Rules
1. **Be Specific**: If the country is Germany, include "APS Certificate". If USA, include "WES Evaluation" (if needed) or "I-20 Proof".
2. **Prioritize**: "Deadlines" and "Transcripts" are High priority. "Vaccination Proof" is Low priority.
3. **Format**: Return a JSON-compatible list of task objects.

## Output Format (Strict JSON List)
[
    {
        "title": "<Task Title>",
        "description": "<Short Description>",
        "priority": <int 1-3>  (1=High, 3=Low)
    }
]
"""

async def generate_application_checklist(university_name: str, country: str, program_name: str = "Master's") -> list:
    """Generate intelligent checklist using Gemini."""
    
    if not key_manager.has_keys():
        # Fallback if no key
        return []

    client, key_index = key_manager.create_client()
    
    prompt = f"""{CHECKLIST_SYSTEM_PROMPT}

Target University: {university_name}
Target Country: {country}
Program Level: {program_name}

Generate the 5-7 most important application tasks/documents for this specific target.
"""

    try:
        response = client.models.generate_content(
            model=key_manager.get_model_name(),
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        response_text = response.text or "[]"
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            logger.error("Failed to decode Checklist JSON")
            return []
            
    except Exception as e:
        logger.error(f"Checklist Generation Error: {str(e)}")
        return []

async def generate_cold_email_content(profile_summary: str, professor_name: str, university_name: str, research_area: str, paper_title: str = None, tone: str = "Formal"):
    """Generate cold email draft using Gemini."""
    
    if not key_manager.has_keys():
        return None

    client, key_index = key_manager.create_client()
    
    system_prompt = """You are an expert academic mentor helping a student write a cold email to a professor for a research assistantship.
Your goal is to write a high-conversion email.

## Intelligence Instructions (CRITICAL)
- **Use Student Details**: You MUST explicitly mention their specific background (Degree, Major, Graduation Year, GPA, Work Experience) to build credibility.
- **Connect Context**: If they have work experience, say "My x years of experience in...". If they have cleared exams, mention it.
- **Dates**: Use their Graduation Year and Target Intake to propose a logical start date.

## Persona Instructions
Adopt the requested "Writing Style / Persona" strictly:
- **Professional**: Standard academic tone. Respectful, clear, and direct.
- **Soft**: Use indirect language ("I was wondering", "I would be grateful"). Very polite and deferential.
- **Casual**: Conversational but respectful. Less rigid structure. ("Hi Professor", "Best,").
- **Confident**: Highlight achievements boldly. Propose specific value. ("I am confident I can contribute...").
- **Humble**: Emphasize willingness to learn. Acknowledge the professor's expertise.
- **Academic**: Use sophisticated vocabulary. Focus heavily on checking the specific research details.

Output JSON:
{
    "subject_line": "Subject...",
    "email_body": "Dear Professor...",
    "tips": ["Tip 1", "Tip 2"]
}
"""

    user_prompt = f"""
Student Profile: {profile_summary}
Target Professor: {professor_name} ({university_name})
Research Area: {research_area}
Specific Paper Mentioned: {paper_title if paper_title else "None"}
Writing Persona: {tone}

Draft the email now. Use the profile details intelligently.
"""

    try:
        response = client.models.generate_content(
            model=key_manager.get_model_name(),
            contents=system_prompt + "\n\n" + user_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        response_text = response.text or "{}"
        return json.loads(response_text)
            
    except Exception as e:
        logger.error(f"Cold Email Generation Error: {str(e)}")
        return None

async def polish_cold_email_content(email_body: str, tone: str, profile_summary: str = "", is_selection: bool = False):
    """Refine existing email body using Gemini with a specific persona."""
    
    if not key_manager.has_keys():
        return None

    client, key_index = key_manager.create_client()
    
    system_prompt = """You are an expert editor for academic correspondence.
Your task is to REWRITE the provided text to match the requested persona EXACTLY.
"""
    if is_selection:
        system_prompt += "\nNOTE: The input is a specific selection (sentence/fragment). Refine ONLY this text. Do NOT add salutations, headers, or signatures. Return only the polished text.\n"
    else:
        system_prompt += "\nNOTE: The input is an email draft. Ensure proper structure (Salutation -> Body -> Sign-off).\n"

    system_prompt += """
Do not change the core meaning or facts, BUT YOU MUST ENSURE CONSISTENCY WITH THE STUDENT'S PROFILE.

## Intelligence Instructions
- Check the "Student Profile" provided.
- If the original draft misses key strengths (like High GPA, Work Exp, or specific Degree info), seamlessly weave them in during the polish if appropriate.
- Ensure the tone matches the requested persona.

## Polishing Personas
- **Professional**: Eliminate slang, ensure perfect grammar, standard academic closing.
- **Soft**: Soften requests. Use phrases like "If you have a moment", "I would be grateful".
- **Casual**: Make it sound like a friendly conversation. "Hi [Name]", "Best,".
- **Confident**: Use strong verbs. Remove "I think" or "I believe". Be assertive.
- **Humble**: Show deep respect. Emphasize learning.
- **Academic**: Use higher-level vocabulary.

Output JSON:
{
    "polished_body": "Rewrite version...",
    "changes_made": ["Changed 'hey' to 'Dear'", "Added work experience context"]
}
"""

    user_prompt = f"""
Student Profile:
{profile_summary or "No profile details provided."}

Original Draft:
{email_body}

Target Persona: {tone}

Polish this email now. Use the profile to enhance it.
"""

    try:
        response = client.models.generate_content(
            model=key_manager.get_model_name(),
            contents=system_prompt + "\n\n" + user_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        response_text = response.text or "{}"
        return json.loads(response_text)
            
    except Exception as e:
        logger.error(f"Cold Email Polishing Error: {str(e)}")
        return None

    client, key_index = key_manager.create_client()
    
    system_prompt = """You are an expert editor for academic correspondence.
Your task is to REWRITE the provided email draft to match the requested persona EXACTLY.
Do not change the core meaning or facts. improve flow, vocabulary, and tone.

## Polishing Personas
- **Professional**: Eliminate slang, ensure perfect grammar, standard academic closing.
- **Soft**: Soften requests. Use phrases like "If you have a moment", "I would appreciate".
- **Casual**: Make it sound like a friendly conversation. "Hi [Name]", "Best,".
- **Confident**: Use strong verbs. Remove "I think" or "I believe". Be assertive.
- **Humble**: Show deep respect. Emphasize learning.
- **Academic**: Use higher-level vocabulary.

Output JSON:
{
    "polished_body": "Rewrite version...",
    "changes_made": ["Changed 'hey' to 'Dear'", "Softened the request"]
}
"""

    user_prompt = f"""
Original Draft:
{email_body}

Target Persona: {tone}

Polish this email now.
"""

    try:
        response = client.models.generate_content(
            model=key_manager.get_model_name(),
            contents=system_prompt + "\n\n" + user_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        response_text = response.text or "{}"
        return json.loads(response_text)
            
    except Exception as e:
        logger.error(f"Cold Email Polishing Error: {str(e)}")
        return None

async def transcribe_audio(audio_data: bytes, mime_type: str = "audio/wav") -> str:
    """Transcribe audio using Gemini Multimodal capabilities."""
    
    if not key_manager.has_keys():
        raise Exception("Gemini API keys not configured")

    client, key_index = key_manager.create_client()
    
    # Simple prompt for transcription
    prompt = "Transcribe this audio file exactly as spoken. Do not add any commentary."
    
    try:
        response = client.models.generate_content(
            model=key_manager.get_model_name(),
            contents=[prompt, types.Part.from_bytes(data=audio_data, mime_type=mime_type)],
            config=types.GenerateContentConfig(
                response_mime_type="text/plain"
            )
        )
        return response.text.strip() if response.text else ""
            
    except Exception as e:
        logger.error(f"Audio Transcription Error: {str(e)}")
        raise e

