import sqlite3
import os

DB_PATH = "ai_counsellor.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "subscription_plan" not in columns:
            print("Adding subscription_plan column...")
            cursor.execute("ALTER TABLE users ADD COLUMN subscription_plan VARCHAR default 'FREE'")
        
        if "subscription_status" not in columns:
            print("Adding subscription_status column...")
            cursor.execute("ALTER TABLE users ADD COLUMN subscription_status VARCHAR default 'ACTIVE'")
            
        if "trial_ends_at" not in columns:
            print("Adding trial_ends_at column...")
            cursor.execute("ALTER TABLE users ADD COLUMN trial_ends_at DATETIME")
            
        conn.commit()
        print("Migration successful.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
