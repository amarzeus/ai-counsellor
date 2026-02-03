from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import edge_tts
import uuid
import os
import base64
from datetime import datetime

from database import get_db
from models import User, ShortlistedUniversity, Task, ChatMessage, ChatSession
from auth import get_current_user
from ai_counsellor import transcribe_audio, get_counsellor_response
from real_universities_data import UNIVERSITIES_DATA

router = APIRouter(prefix="/api/voice", tags=["Voice"])

TEMP_AUDIO_DIR = "temp_audio"
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

@router.post("/transcribe")
async def transcribe_only(
    file: UploadFile = File(...)
):
    """
    Dictation Mode: Audio -> Text only.
    """
    try:
        contents = await file.read()
        mime_type = file.content_type or "audio/wav"
        text = await transcribe_audio(contents, mime_type)
        return {"text": text}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Transcription Error: {str(e)}"})

# Language Mapping for Edge TTS
VOICE_MAPPING = {
    "en": "en-US-ChristopherNeural",
    "hi": "hi-IN-MadhurNeural",
    "es": "es-ES-AlvaroNeural",
    "fr": "fr-FR-HenriNeural",
    "de": "de-DE-ConradNeural",
    "ja": "ja-JP-KeitaNeural"
}

@router.post("/chat")
async def voice_chat(
    file: UploadFile = File(...),
    language: str = "en",
    session_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Realtime Conversation Mode:
    1. Receive Audio
    2. Transcribe (Gemini)
    3. Reason (Gemini) - WITH CONTEXT
    4. Speak (Edge TTS in requested language)
    5. Persist to DB
    """
    
    # 1. Save and Transcribe
    try:
        contents = await file.read()
        # Browser default is often webm, but header might be missing/wrong.
        # Defaulting to audio/webm is safer than wav for web recorders.
        mime_type = file.content_type if file.content_type not in ["application/octet-stream", ""] else "audio/webm"
        user_text = await transcribe_audio(contents, mime_type)
        
        if not user_text:
            # Silence or unintelligible
            return JSONResponse(status_code=400, content={"message": "Could not understand audio"})
            
    except Exception as e:
         print(f"Transcription Critical Error: {e}")
         # Fallback to speaking the error instead of crashing the UI
         user_text = "" 
         transcription_error = True
         error_message = f"I encountered a technical issue: {str(e)[:50]}"

    # 2. Get AI Response (Only if no error)
    if 'transcription_error' in locals() and transcription_error:
        ai_response = {
            "message": "I'm sorry, I'm having trouble accessing my hearing services right now. Please try again in a moment.",
            "actions": [],
            "suggested_universities": []
        }
    else:
        # Normal AI Flow
        profile = current_user.profile.__dict__ if current_user.profile else {}
        shortlisted_objs = db.query(ShortlistedUniversity).filter(ShortlistedUniversity.user_id == current_user.id).all()
        shortlisted = [s.__dict__ for s in shortlisted_objs]
        for s in shortlisted:
             uni = next((u for u in UNIVERSITIES_DATA if u["id"] == s["university_id"]), {})
             s["university"] = uni
             
        tasks_objs = db.query(Task).filter(Task.user_id == current_user.id).all()
        tasks = [t.__dict__ for t in tasks_objs]
        
        # --- FETCH HISTORY ---
        history = []
        if session_id:
            # Get last 10 messages for context
            db_messages = db.query(ChatMessage).filter(
                ChatMessage.session_id == session_id
            ).order_by(ChatMessage.created_at.desc()).limit(10).all()
            
            # Reverse to chronological order and format
            for msg in reversed(db_messages):
                history.append({"role": msg.role, "content": msg.content})
        
        # Inject Language Instruction if not English
        context_prefix = ""
        if language != "en":
            lang_names = {"hi": "Hindi", "es": "Spanish", "fr": "French", "de": "German", "ja": "Japanese"}
            lang_name = lang_names.get(language, language)
            context_prefix = f"[SYSTEM: User is speaking {lang_name}. Reply in {lang_name}.] "
        
        # Force concise responses for Voice Mode
        context_prefix += "[SYSTEM: VOICE MODE ACTIVE. Keep response CONVERSATIONAL, SHORT (max 2-3 sentences), and spoken-style. No markdown lists.] "

        # HARD FIX FOR REPETITION
        if len(history) > 0:
             context_prefix += " [SYSTEM: CONVERSATION CONTINUATION. We are already talking. Do NOT say 'Hello', 'Welcome back' or greet the user. Answer the query directly.]"
        
        ai_response = await get_counsellor_response(
            message=context_prefix + user_text,
            user_data=current_user.__dict__,
            profile=profile,
            universities=UNIVERSITIES_DATA,
            shortlisted=shortlisted,
            tasks=tasks,
            history=history
        )
        
    response_text = ai_response.get("message", "I didn't catch that.")
    
    # --- PERSISTENCE ---
    try:
        # If no session_id provided, create a new one
        if not session_id:
            new_session = ChatSession(
                user_id=current_user.id,
                title=f"Voice Chat {datetime.now().strftime('%d/%m %H:%M')}"
            )
            db.add(new_session)
            db.flush() # Get ID
            session_id = new_session.id

        # 1. Save User Message (Only if valid)
        if user_text:
            user_msg = ChatMessage(
                user_id=current_user.id,
                session_id=session_id,
                role="user",
                content=user_text
            )
            db.add(user_msg)
        
        # 2. Save AI Message
        ai_msg = ChatMessage(
            user_id=current_user.id,
            session_id=session_id,
            role="assistant", # Consistent with DB model
            content=response_text,
            actions_taken=ai_response.get("actions", []),
            suggested_universities=ai_response.get("suggested_universities", []),
            suggested_next_questions=ai_response.get("suggested_next_questions", [])
        )
        db.add(ai_msg)
        db.commit()
        
        # Update updated_at on session
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            session.updated_at = datetime.now()
            db.commit()
            
    except Exception as e:
        print(f"Persistence Error: {e}")
        db.rollback()
    
    # 3. Execute AI Actions (Real Agentic Behavior)
    try:
        actions = ai_response.get("actions", [])
        for action in actions:
            action_type = action.get("type")
            params = action.get("params", {})
            
            if action_type == "shortlist_university":
                uni_id = params.get("university_id")
                category = params.get("category", "TARGET")
                
                # Check if already shortlisted
                exists = db.query(ShortlistedUniversity).filter(
                    ShortlistedUniversity.user_id == current_user.id,
                    ShortlistedUniversity.university_id == uni_id
                ).first()
                
                if not exists:
                    new_shortlist = ShortlistedUniversity(
                        user_id=current_user.id,
                        university_id=uni_id,
                        category=category,
                        is_locked=False
                    )
                    db.add(new_shortlist)
                    print(f"ACTION: Shortlisted Uni {uni_id}")

            elif action_type == "lock_university":
                uni_id = params.get("university_id")
                shortlisted_item = db.query(ShortlistedUniversity).filter(
                    ShortlistedUniversity.user_id == current_user.id,
                    ShortlistedUniversity.university_id == uni_id
                ).first()
                
                if shortlisted_item:
                    shortlisted_item.is_locked = True
                    print(f"ACTION: Locked Uni {uni_id}")

            elif action_type == "unlock_university":
                uni_id = params.get("university_id")
                shortlisted_item = db.query(ShortlistedUniversity).filter(
                    ShortlistedUniversity.user_id == current_user.id,
                    ShortlistedUniversity.university_id == uni_id
                ).first()
                if shortlisted_item:
                    shortlisted_item.is_locked = False
                    print(f"ACTION: Unlocked Uni {uni_id}")

            elif action_type == "create_task":
                new_task = Task(
                    user_id=current_user.id,
                    title=params.get("title", "New Task"),
                    description=params.get("description", ""),
                    priority=params.get("priority", 2),
                    status="PENDING"
                )
                db.add(new_task)
                print(f"ACTION: Created Task '{new_task.title}'")

        db.commit()
    except Exception as e:
        print(f"Action Execution Error: {e}")
        db.rollback()

    # 4. Text to Speech (Edge TTS)
    try:
        # Select voice based on language
        voice = VOICE_MAPPING.get(language, "en-US-ChristopherNeural")
        
        communicate = edge_tts.Communicate(response_text, voice)
        
        output_file = f"{TEMP_AUDIO_DIR}/{uuid.uuid4()}.mp3"
        await communicate.save(output_file)
        
        # Read back as base64
        with open(output_file, "rb") as f:
            audio_bytes = f.read()
            
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        os.remove(output_file)
        
    except Exception as e:
        print(f"TTS Error: {e}")
        audio_base64 = None

    return {
        "user_text": user_text,
        "ai_response": ai_response,
        "audio_base64": audio_base64,
        "session_id": session_id
    }
