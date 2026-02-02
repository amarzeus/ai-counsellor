from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import edge_tts
import uuid
import os
import base64
import asyncio

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Realtime Conversation Mode:
    1. Receive Audio
    2. Transcribe (Gemini)
    3. Reason (Gemini)
    4. Speak (Edge TTS in requested language)
    """
    
    # 1. Save and Transcribe
    try:
        contents = await file.read()
        mime_type = file.content_type or "audio/wav"
        user_text = await transcribe_audio(contents, mime_type)
        
        if not user_text:
            return JSONResponse(status_code=400, content={"message": "Could not understand audio"})
            
    except Exception as e:
         return JSONResponse(status_code=500, content={"message": f"Transcription Error: {str(e)}"})

    # 2. Get AI Response (Reusing existing logic)
    profile = current_user.profile.__dict__ if current_user.profile else {}
    shortlisted_objs = db.query(ShortlistedUniversity).filter(ShortlistedUniversity.user_id == current_user.id).all()
    shortlisted = [s.__dict__ for s in shortlisted_objs]
    for s in shortlisted:
         uni = next((u for u in UNIVERSITIES_DATA if u["id"] == s["university_id"]), {})
         s["university"] = uni
         
    tasks_objs = db.query(Task).filter(Task.user_id == current_user.id).all()
    tasks = [t.__dict__ for t in tasks_objs]
    history = []
    
    # Inject Language Instruction if not English
    context_prefix = ""
    if language != "en":
        lang_names = {"hi": "Hindi", "es": "Spanish", "fr": "French", "de": "German", "ja": "Japanese"}
        lang_name = lang_names.get(language, language)
        context_prefix = f"[SYSTEM: The user is speaking in {lang_name}. Reply in {lang_name}.] "
    
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
    
    # 3. Text to Speech (Edge TTS)
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
        "audio_base64": audio_base64
    }
