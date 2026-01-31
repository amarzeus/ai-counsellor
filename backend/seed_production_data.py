import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import University, Program

# Initialize DB
Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Load JSON data
    json_path = os.path.join(os.path.dirname(__file__), "verified_universities.json")
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    with open(json_path, "r") as f:
        universities_data = json.load(f)

    print(f"Loaded {len(universities_data)} universities from JSON.")
    
    count_new = 0
    count_updated = 0

    for uni_data in universities_data:
        # Check if university exists
        existing_uni = db.query(University).filter(University.name == uni_data["name"]).first()
        
        # Compute legacy fields from programs
        programs = uni_data.get("programs", [])
        avg_tuition = 0
        min_gpa = None
        
        if programs:
            tuition_sum = sum(p["tuition_per_year_usd"] for p in programs)
            avg_tuition = int(tuition_sum / len(programs))
            
            gpas = [p.get("min_gpa") for p in programs if p.get("min_gpa") is not None]
            if gpas:
                min_gpa = min(gpas)

        uni_defaults = {
            "country": uni_data["country"],
            "city": uni_data["city"],
            "qs_ranking": uni_data["qs_ranking"],
            "the_ranking": uni_data["the_ranking"],
            "official_website": uni_data["official_website"],
            "is_public": uni_data["is_public"],
            "description": uni_data.get("description"),
            "verified_at": datetime.fromisoformat(uni_data["verified_at"]),
            "data_source": uni_data["data_source"],
            # Legacy fields population
            "tuition_per_year": avg_tuition,
            "min_gpa": min_gpa
        }

        if existing_uni:
            # Update existing
            for key, value in uni_defaults.items():
                setattr(existing_uni, key, value)
            count_updated += 1
            uni_obj = existing_uni
        else:
            # Create new
            uni_obj = University(name=uni_data["name"], **uni_defaults)
            db.add(uni_obj)
            db.commit() # Commit to get ID
            db.refresh(uni_obj)
            count_new += 1
        
        # Handle programs
        # Strategy: Clear existing programs and re-add to ensure data consistency
        # In a real heavy production update, we might do diffing, but for seed this is safer
        db.query(Program).filter(Program.university_id == uni_obj.id).delete()
        
        for prog_data in uni_data["programs"]:
            new_prog = Program(
                university_id=uni_obj.id,
                name=prog_data["name"],
                degree_level=prog_data["degree_level"],
                department=prog_data["department"],
                duration_months=prog_data["duration_months"],
                tuition_per_year_usd=prog_data["tuition_per_year_usd"],
                min_gpa=prog_data.get("min_gpa"),
                ielts_min=prog_data.get("ielts_min"),
                toefl_min=prog_data.get("toefl_min"),
                gre_required=prog_data.get("gre_required", False),
                gre_min=prog_data.get("gre_min"),
                intake_terms=prog_data.get("intake_terms"),
                application_deadline_fall=prog_data.get("application_deadline_fall"),
                specializations=prog_data.get("specializations")
            )
            db.add(new_prog)
    
    db.commit()
    print(f"Seeding complete. Created {count_new}, Updated {count_updated}.")
    db.close()

if __name__ == "__main__":
    seed_data()
