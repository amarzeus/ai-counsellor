
from database import get_db
from models import ChatMessage, ChatSession, User
from sqlalchemy.orm import Session
import json

db = next(get_db())

# Get the most recent session for the demo user or the first user found
user = db.query(User).first()
print(f"Checking messages for user: {user.email} (ID: {user.id})")

sessions = db.query(ChatSession).filter(ChatSession.user_id == user.id).order_by(ChatSession.updated_at.desc()).limit(5).all()

for session in sessions:
    print(f"\nSession ID: {session.id} - {session.title}")
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at.desc()).limit(5).all()
    
    for msg in messages:
        print(f"  Msg ID: {msg.id} ({msg.role})")
        
        print(f"    actions_taken ({type(msg.actions_taken)}): {msg.actions_taken}")
        print(f"    suggested_universities ({type(msg.suggested_universities)}): {msg.suggested_universities}")
        print(f"    suggested_next_questions ({type(msg.suggested_next_questions)}): {msg.suggested_next_questions}")
