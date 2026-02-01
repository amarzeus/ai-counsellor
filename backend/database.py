import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

# Debug: Print loaded DATABASE_URL
print(f"[DEBUG] Loaded DATABASE_URL: {DATABASE_URL}")

# AGGRESSIVE FALLBACK: If we are running locally (no REPLIT_DEV_DOMAIN) and the URL is postgres,
# we default to SQLite because the user likely doesn't have a local Postgres instance running.
is_local_env = os.environ.get("REPLIT_DEV_DOMAIN") is None
if is_local_env:
    print("[DEBUG] Local environment detected. Forcing SQLite.")
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
