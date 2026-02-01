import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

# Debug: Print loaded DATABASE_URL
print(f"[DEBUG] Loaded DATABASE_URL: {DATABASE_URL}")

# AGGRESSIVE FALLBACK: If we are running locally (no REPLIT_DEV_DOMAIN) and no legacy 
# DATABASE_URL is set, we default to SQLite. We only force SQLite if 
# DATABASE_URL is not already pointing to a real postgres instance.
is_replit = os.environ.get("REPLIT_DEV_DOMAIN") is not None
if not is_replit and (not DATABASE_URL or "postgres" not in DATABASE_URL):
    print("[DEBUG] Local non-Postgres environment detected. Using SQLite.")
    DATABASE_URL = "sqlite:///./ai_counsellor.db"

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./ai_counsellor.db"

print(f"[DEBUG] Final DATABASE_URL: {DATABASE_URL}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
