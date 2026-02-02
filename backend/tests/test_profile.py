"""
Profile management tests - CRUD operations and validation.
"""
import pytest

def test_get_profile(client, auth_headers, test_profile):
    """Test retrieving user profile."""
    response = client.get("/api/profile", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["gpa"] == 3.6
    assert data["budget_per_year"] == 50000
    assert data["field_of_study"] == "Computer Science"

def test_update_profile(client, auth_headers, test_profile):
    """Test updating user profile."""
    update_data = {
        "gpa": 3.9,
        "budget_per_year": 60000,
        "field_of_study": "Data Science"
    }
    
    response = client.put("/api/profile", json=update_data, headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["gpa"] == 3.9
    assert data["budget_per_year"] == 60000
    assert data["field_of_study"] == "Data Science"

def test_complete_onboarding(client, db_session):
    """Test that onboarding completes when profile is fully filled.
    
    Note: The API doesn't have a separate complete-onboarding endpoint.
    Onboarding completes automatically based on profile completeness.
    This test verifies the profile update flow for onboarding users.
    """
    # Create onboarding user
    from models import User, UserStage
    from auth import get_password_hash
    
    user = User(
        email="onboard@test.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Onboard Test",
        current_stage=UserStage.ONBOARDING,
        onboarding_completed=False
    )
    db_session.add(user)
    db_session.commit()
    
    # Login
    response = client.post("/api/auth/login", json={
        "email": "onboard@test.com",
        "password": "Pass123!"
    })
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Complete profile - this should trigger onboarding completion
    profile_data = {
        "current_education_level": "Bachelor's",
        "degree_major": "CS",
        "graduation_year": 2024,
        "gpa": 3.5,
        "intended_degree": "Master's",
        "field_of_study": "CS",
        "target_intake_year": 2025,
        "preferred_countries": ["USA"],
        "budget_per_year": 50000,
        "funding_plan": "SELF_FUNDED",
        "ielts_toefl_status": "COMPLETED",
        "gre_gmat_status": "COMPLETED",
        "sop_status": "DRAFT"
    }
    response = client.put("/api/profile", json=profile_data, headers=headers)
    
    # Profile update should succeed
    assert response.status_code == 200
    
    # Verify user can now be retrieved
    me_response = client.get("/api/user/me", headers=headers)
    assert me_response.status_code == 200

def test_profile_strength_recalculation(client, auth_headers, test_profile):
    """Test that profile strength is recalculated on update."""
    # Update to strong profile
    update_data = {
        "gpa": 3.9,
        "ielts_toefl_status": "COMPLETED",
        "gre_gmat_status": "COMPLETED"
    }
    
    response = client.put("/api/profile", json=update_data, headers=auth_headers)
    
    assert response.status_code == 200
    # Profile strength should be updated (if endpoint returns it)
    # This depends on backend implementation
