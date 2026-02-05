import json
import logging
import asyncio
import uuid
import random

from google.genai import types

from gemini_key_manager import key_manager
from recommendation_engine import detect_intent, filter_programs, check_query_delta

logger = logging.getLogger(__name__)



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



