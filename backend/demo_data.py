DEMO_PROFILES = {
    "weak": {
        "email": "weak@demo.com",
        "password": "Demo@123",
        "full_name": "Alex Struggling",
        "profile": {
            "current_education_level": "BACHELORS",
            "degree_major": "General Studies",
            "graduation_year": 2024,
            "gpa": 2.8,
            "intended_degree": "MASTERS",
            "field_of_study": "Business Administration",
            "target_intake_year": 2025,
            "preferred_countries": ["USA", "Canada"],
            "budget_per_year": 25000,
            "funding_plan": "SELF_FUNDED",
            "ielts_toefl_status": "NOT_STARTED",
            "gre_gmat_status": "NOT_STARTED",
            "sop_status": "NOT_STARTED"
        },
        "description": "Low GPA (2.8), tight budget ($25k), no exams started"
    },
    "average": {
        "email": "average@demo.com",
        "password": "Demo@123",
        "full_name": "Jordan Decent",
        "profile": {
            "current_education_level": "BACHELORS",
            "degree_major": "Computer Science",
            "graduation_year": 2024,
            "gpa": 3.4,
            "intended_degree": "MASTERS",
            "field_of_study": "Data Science",
            "target_intake_year": 2025,
            "preferred_countries": ["USA", "UK", "Canada"],
            "budget_per_year": 45000,
            "funding_plan": "LOAN",
            "ielts_toefl_status": "COMPLETED",
            "gre_gmat_status": "IN_PROGRESS",
            "sop_status": "NOT_STARTED"
        },
        "description": "Average GPA (3.4), moderate budget ($45k), IELTS done"
    },
    "strong": {
        "email": "strong@demo.com",
        "password": "Demo@123",
        "full_name": "Taylor Excellence",
        "profile": {
            "current_education_level": "BACHELORS",
            "degree_major": "Computer Science",
            "graduation_year": 2024,
            "gpa": 3.9,
            "intended_degree": "MASTERS",
            "field_of_study": "Artificial Intelligence",
            "target_intake_year": 2025,
            "preferred_countries": ["USA", "UK"],
            "budget_per_year": 70000,
            "funding_plan": "SCHOLARSHIP",
            "ielts_toefl_status": "COMPLETED",
            "gre_gmat_status": "COMPLETED",
            "sop_status": "DRAFT"
        },
        "description": "High GPA (3.9), strong budget ($70k), all exams complete"
    }
}

DEMO_CREDENTIALS = """
========================================
DEMO LOGIN CREDENTIALS
========================================

1. WEAK PROFILE (struggles everywhere)
   Email: weak@demo.com
   Password: Demo@123
   GPA: 2.8 | Budget: $25k | Exams: None
   -> AI will suggest: SAFE universities only
   -> Most universities will be DREAM (out of reach)

2. AVERAGE PROFILE (decent chances)
   Email: average@demo.com
   Password: Demo@123
   GPA: 3.4 | Budget: $45k | Exams: IELTS done
   -> AI will suggest: Mix of TARGET and SAFE
   -> Some DREAM schools still possible

3. STRONG PROFILE (competitive applicant)
   Email: strong@demo.com
   Password: Demo@123
   GPA: 3.9 | Budget: $70k | Exams: All done
   -> AI will suggest: Many TARGET schools
   -> Even top schools are reachable

========================================
"""
