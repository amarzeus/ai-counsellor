import sqlite3
import os
import sys

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine

db_url = str(engine.url)
print(f"Connecting to: {db_url}")

if db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    try:
        c.execute("ALTER TABLE chat_messages ADD COLUMN suggested_next_questions JSON")
        print("Added suggested_next_questions column.")
    except sqlite3.OperationalError as e:
        print(f"suggested_next_questions column might already exist: {e}")

    conn.commit()
    conn.close()
else:
    print("Not using SQLite, manual migration needed.")
