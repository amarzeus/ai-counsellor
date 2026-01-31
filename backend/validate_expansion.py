import sys
import os
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_counsellor import categorize_university, build_context
from models import University, Program, ProgramCategory

# Mock Data Classes
class MockProgram:
    def __init__(self, name, category, work_exp_req=False, min_work=0, gmat_req=False, min_gpa=3.0, tuition=50000):
        self.name = name
        self.degree_level = "Masters"
        self.program_category = category
        self.requires_work_experience = work_exp_req
        self.min_work_experience_years = min_work
        self.gmat_required = gmat_req
        self.min_gpa = min_gpa
        self.tuition_per_year_usd = tuition
        self.application_deadline_fall = "Dec 1"
        self.gre_required = False

    def get(self, key, default=None):
        return getattr(self, key, default)

class MockUniversity:
    def __init__(self, id, name, programs):
        self.id = id
        self.name = name
        self.country = "USA"
        self.city = "Test City"
        self.qs_ranking = 10
        self.is_public = False
        self.data_source = "Test"
        self.programs = programs
        # Legacy getters
        self.min_gpa = min(p.min_gpa for p in programs) if programs else 3.0
        self.tuition_per_year = sum(p.tuition_per_year_usd for p in programs) / len(programs) if programs else 50000

    def get(self, key, default=None):
        if key == 'programs': return self.programs
        if hasattr(self, key): return getattr(self, key)
        return default
    
    def __getitem__(self, key):
        return getattr(self, key)

# Test Data
mit_mba = MockProgram("MBA", ProgramCategory.BUSINESS, work_exp_req=True, min_work=3, gmat_req=True, min_gpa=3.5, tuition=80000)
stanford_meche = MockProgram("MS Mechanical Engineering", ProgramCategory.ENGINEERING, min_gpa=3.6, tuition=60000)
cmu_is = MockProgram("Master of Information Systems", ProgramCategory.BUSINESS, min_gpa=3.4, tuition=54000)

universities = [
    MockUniversity(1, "MIT", [mit_mba]),
    MockUniversity(2, "Stanford", [stanford_meche]),
    MockUniversity(3, "CMU", [cmu_is])
]

def run_tests():
    print("Running Program Expansion Validation...\n")
    
    # CASE 1: Fresh Grad (No Experience) targeting MBA
    print("--- TEST CASE 1: Fresh Grad vs MBA (Should be Ineligible) ---")
    profile_fresh = {
        'gpa': 3.8,
        'work_experience_years': 0,
        'gre_gmat_status': 'NOT_STARTED',
        'budget_per_year': 100000
    }
    context = build_context({}, profile_fresh, universities, [], [])
    
    if "[INELIGIBLE] MBA" in context and "Requires 3y Work Exp" in context:
        print("✅ PASS: MBA correctly blocked for 0y work exp.")
    else:
        print("❌ FAIL: MBA not blocked or reasoning missing.")
        print(f"DEBUG Context snippet:\n{context}")

    # CASE 2: Experienced Professional targeting MBA
    print("\n--- TEST CASE 2: Experienced Pro vs MBA (Should be Eligible) ---")
    profile_exp = {
        'gpa': 3.6,
        'work_experience_years': 4,
        'gre_gmat_status': 'COMPLETED', # Has GMAT
        'budget_per_year': 100000
    }
    context_exp = build_context({}, profile_exp, universities, [], [])
    
    if "[INELIGIBLE] MBA" not in context_exp and "MBA" in context_exp:
        print("✅ PASS: MBA allowed for eligible user.")
    else:
        print("❌ FAIL: MBA blocked despite eligibility.")
        print(f"DEBUG Context snippet:\n{context_exp}")

    # CASE 3: GMAT Requirement Check
    print("\n--- TEST CASE 3: Experienced but No GMAT vs MBA (Should be Ineligible) ---")
    profile_no_gmat = {
        'gpa': 3.6,
        'work_experience_years': 4,
        'gre_gmat_status': 'NOT_STARTED',
        'budget_per_year': 100000
    }
    context_gmat = build_context({}, profile_no_gmat, universities, [], [])
    
    if "Requires GMAT" in context_gmat:
        print("✅ PASS: Correctly flagged missing GMAT.")
    else:
        print("❌ FAIL: GMAT requirement ignored.")

    # CASE 4: Engineering Categorization
    print("\n--- TEST CASE 4: Engineering Logic ---")
    cat, fit, risk, acc, cost = categorize_university(universities[1].__dict__, {'gpa': 3.2, 'budget_per_year': 70000})
    # Stanford MechE min 3.6. User 3.2. 3.6 > 3.2 + 0.3 (no, 3.5). Wait. 3.6 > 3.2 + 0.3 -> 3.6 > 3.5. Yes.
    # So should be DREAM.
    
    print(f"Stanford MechE (Min 3.6) vs User (3.2) -> Category: {cat}")
    if cat == 'DREAM':
        print("✅ PASS: Stanford categorized as DREAM due to GPA gap.")
    else:
        print(f"❌ FAIL: Expected DREAM, got {cat}")

if __name__ == "__main__":
    run_tests()
