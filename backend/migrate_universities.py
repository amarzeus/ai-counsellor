"""
Database migration script for University Data Architecture v2
Adds new columns to universities table and creates programs table
"""
from sqlalchemy import text
from database import engine

def run_university_migrations():
    """Run migrations to add new university and program schema"""
    with engine.connect() as conn:
        migrations = [
            # Add new columns to universities table
            ("ALTER TABLE universities ADD COLUMN city VARCHAR(100)", "city"),
            ("ALTER TABLE universities ADD COLUMN qs_ranking INTEGER", "qs_ranking"),
            ("ALTER TABLE universities ADD COLUMN the_ranking INTEGER", "the_ranking"),
            ("ALTER TABLE universities ADD COLUMN us_news_ranking INTEGER", "us_news_ranking"),
            ("ALTER TABLE universities ADD COLUMN official_website VARCHAR(512)", "official_website"),
            ("ALTER TABLE universities ADD COLUMN is_public BOOLEAN DEFAULT 1", "is_public"),
            ("ALTER TABLE universities ADD COLUMN verified_at TIMESTAMP", "verified_at"),
            ("ALTER TABLE universities ADD COLUMN data_source VARCHAR(255)", "data_source"),
            
            # Create programs table
            ("""
                CREATE TABLE IF NOT EXISTS programs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    university_id INTEGER NOT NULL REFERENCES universities(id),
                    name VARCHAR(255) NOT NULL,
                    degree_level VARCHAR(50) NOT NULL,
                    department VARCHAR(255),
                    duration_months INTEGER,
                    tuition_per_year_usd INTEGER NOT NULL,
                    min_gpa FLOAT,
                    gpa_scale FLOAT DEFAULT 4.0,
                    ielts_min FLOAT,
                    toefl_min INTEGER,
                    gre_required BOOLEAN DEFAULT 0,
                    gre_min INTEGER,
                    intake_terms JSON,
                    application_deadline_fall VARCHAR(50),
                    application_deadline_spring VARCHAR(50),
                    specializations JSON,
                    program_url VARCHAR(512),
                    verified_at TIMESTAMP
                )
            """, "programs table"),
            
            # Create index on university_id for faster lookups
            ("CREATE INDEX IF NOT EXISTS idx_programs_university_id ON programs(university_id)", "programs_university_idx"),
        ]
        
        for sql, name in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"✓ Migration applied: {name}")
            except Exception as e:
                error_str = str(e).lower()
                if "already exists" in error_str or "duplicate" in error_str:
                    print(f"○ Migration skipped (already exists): {name}")
                else:
                    print(f"✗ Migration warning for {name}: {e}")

if __name__ == "__main__":
    print("Running University Data Architecture migrations...")
    run_university_migrations()
    print("\nMigrations complete!")
