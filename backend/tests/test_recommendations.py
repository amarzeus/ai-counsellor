"""
University recommendation and categorization tests.
"""
from ai_counsellor import categorize_university, analyze_profile_strength

def test_categorize_dream_university_high_gpa():
    """University with GPA requirement > user GPA + 0.3 = DREAM."""
    university = {
        "id": 1,
        "name": "MIT",
        "min_gpa": 3.9,
        "tuition_per_year": 55000,
        "acceptance_rate": 0.04
    }
    user_profile = {
        "gpa": 3.4,
        "budget_per_year": 60000
    }
    
    category, fit, risk, acceptance, cost = categorize_university(university, user_profile)
    
    assert category == "DREAM"
    assert "GPA requirement" in risk
    assert "3.9" in risk
    assert "3.4" in risk
    assert acceptance == "Low"

def test_categorize_dream_university_high_tuition():
    """University with tuition > budget * 1.2 = DREAM."""
    university = {
        "id": 2,
        "name": "Stanford",
        "min_gpa": 3.5,
        "tuition_per_year": 70000,
        "acceptance_rate": 0.05
    }
    user_profile = {
        "gpa": 3.8,
        "budget_per_year": 50000
    }
    
    category, fit, risk, acceptance, cost = categorize_university(university, user_profile)
    
    assert category == "DREAM"
    assert "Tuition" in risk
    assert "exceeds your budget" in risk
    assert cost == "High"

def test_categorize_target_university():
    """University matching user profile = TARGET."""
    university = {
        "id": 3,
        "name": "University of Michigan",
        "min_gpa": 3.5,
        "tuition_per_year": 48000,
        "acceptance_rate": 0.23
    }
    user_profile = {
        "gpa": 3.6,
        "budget_per_year": 50000
    }
    
    category, fit, risk, acceptance, cost = categorize_university(university, user_profile)
    
    assert category == "TARGET"
    assert "Good match" in fit
    assert "meets requirements" in fit
    assert acceptance == "Medium"

def test_categorize_safe_university():
    """University with min GPA < user GPA - 0.2 AND tuition <= budget = SAFE."""
    university = {
        "id": 4,
        "name": "State University",
        "min_gpa": 3.0,
        "tuition_per_year": 12000,  # Low cost tier (< 15000)
        "acceptance_rate": 0.65
    }
    user_profile = {
        "gpa": 3.8,  # 3.8 - 0.2 = 3.6 > 3.0, so SAFE
        "budget_per_year": 30000  # Budget > tuition, so affordable
    }
    
    category, fit, risk, acceptance, cost = categorize_university(university, user_profile)
    
    assert category == "SAFE"
    assert "exceeds" in fit.lower() or "gpa" in fit.lower()
    assert acceptance == "High"
    assert cost == "Low"

def test_categorize_with_default_values():
    """Test categorization with missing data (defaults)."""
    university = {
        "id": 5,
        "name": "Unknown University"
        # Missing min_gpa, tuition, acceptance_rate
    }
    user_profile = {}  # Missing gpa, budget
    
    category, fit, risk, acceptance, cost = categorize_university(university, user_profile)
    
    # Should use defaults and not crash
    assert category in ["DREAM", "TARGET", "SAFE"]
    assert isinstance(fit, str)
    assert isinstance(risk, str)

def test_acceptance_chance_calculation():
    """Test acceptance chance based on acceptance rate."""
    # Low acceptance rate = Low chance
    uni_low = {"min_gpa": 3.5, "tuition_per_year": 50000, "acceptance_rate": 0.05}
    profile = {"gpa": 3.6, "budget_per_year": 60000}
    _, _, _, acceptance_low, _ = categorize_university(uni_low, profile)
    assert acceptance_low == "Low"
    
    # Medium acceptance rate = Medium chance
    uni_med = {"min_gpa": 3.5, "tuition_per_year": 50000, "acceptance_rate": 0.25}
    _, _, _, acceptance_med, _ = categorize_university(uni_med, profile)
    assert acceptance_med == "Medium"
    
    # High acceptance rate = High chance
    uni_high = {"min_gpa": 3.5, "tuition_per_year": 50000, "acceptance_rate": 0.70}
    _, _, _, acceptance_high, _ = categorize_university(uni_high, profile)
    assert acceptance_high == "High"

def test_cost_level_calculation():
    """Test cost level categorization."""
    profile = {"gpa": 3.5, "budget_per_year": 50000}
    
    # Low cost
    uni_low = {"min_gpa": 3.0, "tuition_per_year": 12000, "acceptance_rate": 0.5}
    _, _, _, _, cost_low = categorize_university(uni_low, profile)
    assert cost_low == "Low"
    
    # Medium cost
    uni_med = {"min_gpa": 3.0, "tuition_per_year": 30000, "acceptance_rate": 0.5}
    _, _, _, _, cost_med = categorize_university(uni_med, profile)
    assert cost_med == "Medium"
    
    # High cost
    uni_high = {"min_gpa": 3.0, "tuition_per_year": 60000, "acceptance_rate": 0.5}
    _, _, _, _, cost_high = categorize_university(uni_high, profile)
    assert cost_high == "High"

def test_analyze_profile_strength_strong():
    """High GPA + completed exams = Strong profile."""
    profile = {
        "gpa": 3.8,
        "ielts_toefl_status": "COMPLETED",
        "gre_gmat_status": "COMPLETED",
        "sop_status": "READY"
    }
    
    strength = analyze_profile_strength(profile)
    
    assert strength["academics"] == "Strong"
    assert strength["exams"] == "Completed"
    assert strength["overall"] == "Strong"

def test_analyze_profile_strength_weak():
    """Low GPA = Weak profile."""
    profile = {
        "gpa": 2.3,
        "ielts_toefl_status": "NOT_STARTED",
        "gre_gmat_status": "NOT_STARTED",
        "sop_status": "NOT_STARTED"
    }
    
    strength = analyze_profile_strength(profile)
    
    assert strength["academics"] == "Weak"
    assert strength["exams"] == "Not Started"
    assert strength["overall"] == "Weak"

def test_analyze_profile_strength_average():
    """Mid-range GPA = Average profile."""
    profile = {
        "gpa": 3.2,
        "ielts_toefl_status": "IN_PROGRESS",
        "gre_gmat_status": "NOT_STARTED",
        "sop_status": "DRAFT"
    }
    
    strength = analyze_profile_strength(profile)
    
    assert strength["academics"] == "Average"
    assert strength["exams"] == "In Progress"
    assert strength["sop"] == "Draft"

def test_analyze_profile_strength_with_defaults():
    """Test profile strength with missing data."""
    profile = {}  # Empty profile
    
    strength = analyze_profile_strength(profile)
    
    # Should use defaults and not crash
    assert strength["academics"] in ["Strong", "Average", "Weak"]
    assert "exams" in strength
    assert "sop" in strength
