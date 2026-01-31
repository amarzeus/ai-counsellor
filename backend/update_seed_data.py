import json
import os

JSON_PATH = "verified_universities.json"

new_programs = {
    "Carnegie Mellon University": {
        "name": "Master of Computational Data Science (MCDS)",
        "degree_level": "Masters",
        "department": "SCS",
        "duration_months": 16,
        "tuition_per_year_usd": 58000,
        "min_gpa": 3.6,
        "program_category": "STEM",
        "program_discipline": "Data Science",
        "requires_work_experience": False,
        "ielts_min": 7.5,
        "toefl_min": 100,
        "gre_required": True,
        "intake_terms": ["Fall"],
        "application_deadline_fall": "December 12",
        "specializations": ["Systems", "Analytics", "Human-Centered DS"]
    },
    "Georgia Institute of Technology": {
        "name": "MS Analytics",
        "degree_level": "Masters",
        "department": "College of Engineering",
        "duration_months": 12,
        "tuition_per_year_usd": 40000,
        "min_gpa": 3.5,
        "program_category": "STEM",
        "program_discipline": "Data Science",
        "requires_work_experience": False,
        "ielts_min": 7.0,
        "toefl_min": 100,
        "gre_required": True,
        "intake_terms": ["Fall"],
        "application_deadline_fall": "January 1",
        "specializations": ["Analytical Tools", "Business Analytics", "Computational Data Analytics"]
    },
    "New York University": {
        "name": "MS Data Science",
        "degree_level": "Masters",
        "department": "Center for Data Science",
        "duration_months": 24,
        "tuition_per_year_usd": 45000,
        "min_gpa": 3.6,
        "program_category": "STEM",
        "program_discipline": "Data Science",
        "requires_work_experience": False,
        "ielts_min": 7.0,
        "toefl_min": 100,
        "gre_required": True,
        "intake_terms": ["Fall"],
        "application_deadline_fall": "January 22",
        "specializations": ["Big Data", "NLP", "Medical Informatics"]
    },
    "Columbia University": {
        "name": "MS Data Science",
        "degree_level": "Masters",
        "department": "Data Science Institute",
        "duration_months": 18,
        "tuition_per_year_usd": 62000,
        "min_gpa": 3.7,
        "program_category": "STEM",
        "program_discipline": "Data Science",
        "requires_work_experience": False,
        "ielts_min": 7.5,
        "toefl_min": 100,
        "gre_required": False,
        "intake_terms": ["Fall"],
        "application_deadline_fall": "January 15",
        "specializations": ["Machine Learning", "Smart Cities", "Financial Analytics"]
    }
}

def update_json():
    if not os.path.exists(JSON_PATH):
        print(f"Error: {JSON_PATH} not found")
        return

    with open(JSON_PATH, "r") as f:
        data = json.load(f)

    updated_count = 0
    for uni in data:
        uni_name = uni["name"]
        if uni_name in new_programs:
            # Check if program already exists to verify idempotency
            prog_names = [p["name"] for p in uni["programs"]]
            new_prog = new_programs[uni_name]
            
            if new_prog["name"] not in prog_names:
                print(f"Adding {new_prog['name']} to {uni_name}")
                uni["programs"].append(new_prog)
                updated_count += 1
            else:
                print(f"Skipping {new_prog['name']} for {uni_name} (Already exists)")

    with open(JSON_PATH, "w") as f:
        json.dump(data, f, indent=4)
        print(f"Successfully updated {updated_count} universities.")

if __name__ == "__main__":
    update_json()
