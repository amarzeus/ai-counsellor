"""
Seed script to populate the database with real, verified university data.
Run this AFTER running migrate_universities.py
"""
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import University, Program, Base
from real_universities_data import UNIVERSITIES_DATA, VERIFIED_AT, DATA_SOURCE

def seed_real_universities():
    """
    Seed the database with real university and program data.
    This replaces any existing dummy data.
    """
    db = SessionLocal()
    
    try:
        # Clear existing programs first (due to FK constraints)
        existing_programs = db.query(Program).count()
        if existing_programs > 0:
            print(f"Clearing {existing_programs} existing programs...")
            db.query(Program).delete()
        
        # Process each university
        created_unis = 0
        updated_unis = 0
        created_programs = 0
        
        for uni_data in UNIVERSITIES_DATA:
            programs_data = uni_data.pop("programs", [])
            
            # Check if university exists
            existing = db.query(University).filter(
                University.name == uni_data["name"]
            ).first()
            
            if existing:
                # Update existing university
                for key, value in uni_data.items():
                    setattr(existing, key, value)
                existing.verified_at = VERIFIED_AT
                existing.data_source = DATA_SOURCE
                
                # Compute legacy fields from programs
                if programs_data:
                    existing.tuition_per_year = min(p["tuition_per_year_usd"] for p in programs_data)
                    existing.min_gpa = min((p.get("min_gpa") or 4.0) for p in programs_data)
                    existing.programs_json = [p["name"] for p in programs_data]
                    existing.ranking = uni_data.get("qs_ranking")
                
                uni = existing
                updated_unis += 1
            else:
                # Create new university
                uni = University(
                    name=uni_data["name"],
                    country=uni_data["country"],
                    city=uni_data.get("city"),
                    qs_ranking=uni_data.get("qs_ranking"),
                    the_ranking=uni_data.get("the_ranking"),
                    us_news_ranking=uni_data.get("us_news_ranking"),
                    official_website=uni_data.get("official_website"),
                    is_public=uni_data.get("is_public", True),
                    description=uni_data.get("description"),
                    verified_at=VERIFIED_AT,
                    data_source=DATA_SOURCE,
                    # Legacy fields
                    tuition_per_year=min(p["tuition_per_year_usd"] for p in programs_data) if programs_data else 0,
                    min_gpa=min((p.get("min_gpa") or 4.0) for p in programs_data) if programs_data else None,
                    programs_json=[p["name"] for p in programs_data] if programs_data else [],
                    ranking=uni_data.get("qs_ranking"),
                )
                db.add(uni)
                db.flush()  # Get the ID
                created_unis += 1
            
            # Add programs
            for prog_data in programs_data:
                program = Program(
                    university_id=uni.id,
                    name=prog_data["name"],
                    degree_level=prog_data["degree_level"],
                    department=prog_data.get("department"),
                    duration_months=prog_data.get("duration_months"),
                    tuition_per_year_usd=prog_data["tuition_per_year_usd"],
                    min_gpa=prog_data.get("min_gpa"),
                    gpa_scale=prog_data.get("gpa_scale", 4.0),
                    ielts_min=prog_data.get("ielts_min"),
                    toefl_min=prog_data.get("toefl_min"),
                    gre_required=prog_data.get("gre_required", False),
                    gre_min=prog_data.get("gre_min"),
                    intake_terms=prog_data.get("intake_terms"),
                    application_deadline_fall=prog_data.get("application_deadline_fall"),
                    application_deadline_spring=prog_data.get("application_deadline_spring"),
                    specializations=prog_data.get("specializations"),
                    program_url=prog_data.get("program_url"),
                    verified_at=VERIFIED_AT,
                )
                db.add(program)
                created_programs += 1
        
        db.commit()
        
        print(f"\n{'='*50}")
        print("SEED COMPLETE")
        print(f"{'='*50}")
        print(f"✓ Created {created_unis} new universities")
        print(f"✓ Updated {updated_unis} existing universities")
        print(f"✓ Created {created_programs} programs")
        print(f"\nTotal universities: {db.query(University).count()}")
        print(f"Total programs: {db.query(Program).count()}")
        print(f"{'='*50}")
        
        # Show sample
        print("\nSample universities:")
        for uni in db.query(University).limit(5).all():
            prog_count = db.query(Program).filter(Program.university_id == uni.id).count()
            print(f"  - {uni.name} ({uni.country}) - QS #{uni.qs_ranking} - {prog_count} programs")
        
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


def verify_data_integrity():
    """Verify that all seeded data is correctly linked and valid."""
    db = SessionLocal()
    
    try:
        print("\n== DATA INTEGRITY CHECK ==")
        
        # Check all universities have at least one program
        unis_without_programs = []
        for uni in db.query(University).all():
            prog_count = db.query(Program).filter(Program.university_id == uni.id).count()
            if prog_count == 0:
                unis_without_programs.append(uni.name)
        
        if unis_without_programs:
            print(f"⚠ {len(unis_without_programs)} universities without programs:")
            for name in unis_without_programs[:5]:
                print(f"    - {name}")
        else:
            print("✓ All universities have at least one program")
        
        # Check programs have valid tuition
        invalid_tuition = db.query(Program).filter(
            (Program.tuition_per_year_usd == None) | (Program.tuition_per_year_usd < 0)
        ).count()
        
        if invalid_tuition > 0:
            print(f"⚠ {invalid_tuition} programs with invalid tuition")
        else:
            print("✓ All programs have valid tuition")
        
        # Check for required fields
        programs_missing_degree = db.query(Program).filter(
            Program.degree_level == None
        ).count()
        
        if programs_missing_degree > 0:
            print(f"⚠ {programs_missing_degree} programs missing degree level")
        else:
            print("✓ All programs have degree level")
        
        print("\n✓ Data integrity check complete")
        
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding real university data...")
    seed_real_universities()
    verify_data_integrity()
