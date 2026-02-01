"""
Database migration script for production (PostgreSQL) and local (SQLite).
Run this script to add missing columns to the database.
"""
import os
import sys
from sqlalchemy import text

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine  # noqa: E402

def run_migrations():
    db_url = str(engine.url)
    print(f"Connecting to: {db_url}")
    
    migrations = [
        # Add session_id column to chat_messages (for chat sessions feature)
        {
            "name": "Add session_id to chat_messages",
            "check": "SELECT column_name FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='session_id'",
            "sql": "ALTER TABLE chat_messages ADD COLUMN session_id INTEGER REFERENCES chat_sessions(id)"
        },
        # Add suggested_next_questions column to chat_messages
        {
            "name": "Add suggested_next_questions to chat_messages", 
            "check": "SELECT column_name FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='suggested_next_questions'",
            "sql": "ALTER TABLE chat_messages ADD COLUMN suggested_next_questions JSON"
        },
        # Create chat_sessions table if it doesn't exist
        {
            "name": "Create chat_sessions table",
            "check": "SELECT table_name FROM information_schema.tables WHERE table_name='chat_sessions'",
            "sql": """
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    title VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """
        }
    ]
    
    with engine.connect() as conn:
        for migration in migrations:
            try:
                # Check if migration is needed
                result = conn.execute(text(migration["check"]))
                exists = result.fetchone()
                
                if exists:
                    print(f"✓ {migration['name']} - already exists, skipping")
                else:
                    conn.execute(text(migration["sql"]))
                    conn.commit()
                    print(f"✓ {migration['name']} - applied successfully")
            except Exception as e:
                print(f"✗ {migration['name']} - error: {str(e)[:100]}")
                # Try to continue with other migrations
                conn.rollback()
    
    print("\nMigration complete!")

if __name__ == "__main__":
    run_migrations()
