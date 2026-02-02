"""
Stage guard tests - enforce stage-based access control.
"""
import pytest
from fastapi import HTTPException
from models import User, UserStage
from main import require_stage_minimum, require_shortlist_exists, block_shortlist_modifications

def test_require_stage_minimum_onboarding_blocked():
    """ONBOARDING users cannot access DISCOVERY features."""
    user = User(id=1, current_stage=UserStage.ONBOARDING)
    
    with pytest.raises(HTTPException) as exc_info:
        require_stage_minimum(user, UserStage.DISCOVERY, "view universities")
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["error"] == "STAGE_BLOCKED"
    assert "ONBOARDING" in exc_info.value.detail["current_stage"]
    assert "DISCOVERY" in exc_info.value.detail["required_stage"]

def test_require_stage_minimum_discovery_allowed():
    """DISCOVERY users can access DISCOVERY features."""
    user = User(id=1, current_stage=UserStage.DISCOVERY)
    
    # Should not raise exception
    try:
        require_stage_minimum(user, UserStage.DISCOVERY, "shortlist university")
    except HTTPException:
        pytest.fail("Should not raise exception for valid stage")

def test_require_stage_minimum_locked_can_access_discovery():
    """LOCKED users can access DISCOVERY features (higher stage)."""
    user = User(id=1, current_stage=UserStage.LOCKED)
    
    # Should not raise exception
    try:
        require_stage_minimum(user, UserStage.DISCOVERY, "view universities")
    except HTTPException:
        pytest.fail("Higher stage users should access lower stage features")

def test_require_shortlist_exists_no_shortlist(db_session, test_user):
    """User with no shortlisted universities cannot lock."""
    with pytest.raises(HTTPException) as exc_info:
        require_shortlist_exists(db_session, test_user)
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["error"] == "NO_SHORTLIST"

def test_require_shortlist_exists_with_shortlist(db_session, test_user, test_shortlist):
    """User with shortlisted universities can lock."""
    # Should not raise exception
    try:
        require_shortlist_exists(db_session, test_user)
    except HTTPException:
        pytest.fail("Should not raise exception when shortlist exists")

def test_block_shortlist_modifications_locked_user():
    """LOCKED users cannot modify shortlist."""
    user = User(id=1, current_stage=UserStage.LOCKED)
    
    with pytest.raises(HTTPException) as exc_info:
        block_shortlist_modifications(user, "remove from shortlist")
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["error"] == "STAGE_LOCKED"

def test_block_shortlist_modifications_application_user():
    """APPLICATION users cannot modify shortlist."""
    user = User(id=1, current_stage=UserStage.APPLICATION)
    
    with pytest.raises(HTTPException) as exc_info:
        block_shortlist_modifications(user, "add to shortlist")
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["error"] == "STAGE_LOCKED"

def test_block_shortlist_modifications_discovery_allowed():
    """DISCOVERY users can modify shortlist."""
    user = User(id=1, current_stage=UserStage.DISCOVERY)
    
    # Should not raise exception
    try:
        block_shortlist_modifications(user, "add to shortlist")
    except HTTPException:
        pytest.fail("DISCOVERY users should be able to modify shortlist")

def test_stage_progression_order():
    """Test that stage order is enforced correctly."""
    stages = [
        UserStage.ONBOARDING,
        UserStage.DISCOVERY,
        UserStage.LOCKED,
        UserStage.APPLICATION
    ]
    
    # Each stage should block access to higher stages
    for i, current_stage in enumerate(stages[:-1]):
        user = User(id=1, current_stage=current_stage)
        next_stage = stages[i + 1]
        
        with pytest.raises(HTTPException):
            require_stage_minimum(user, next_stage, "test action")

def test_onboarding_user_blocked_from_universities(client, onboarding_user):
    """Integration test: ONBOARDING users cannot access universities endpoint."""
    # Login as onboarding user
    response = client.post("/api/auth/login", json={
        "email": "onboarding@example.com",
        "password": "TestPass123!"
    })
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to access universities
    response = client.get("/api/universities", headers=headers)
    
    # Should be blocked (403) or redirected
    assert response.status_code in [403, 401]

def test_discovery_user_can_shortlist(client, auth_headers, test_universities):
    """Integration test: DISCOVERY users can shortlist universities."""
    university_id = test_universities[0].id
    
    response = client.post(
        f"/api/shortlist/{university_id}",
        json={"category": "DREAM"},
        headers=auth_headers
    )
    
    # Should succeed
    assert response.status_code == 200

def test_locked_user_cannot_remove_shortlist(client, locked_user, test_universities, db_session):
    """Integration test: LOCKED users cannot remove from shortlist."""
    from models import ShortlistedUniversity
    
    # Add a shortlisted university for locked user
    shortlist = ShortlistedUniversity(
        user_id=locked_user.id,
        university_id=test_universities[0].id,
        category="TARGET",
        is_locked=True
    )
    db_session.add(shortlist)
    db_session.commit()
    
    # Login as locked user
    response = client.post("/api/auth/login", json={
        "email": "locked@example.com",
        "password": "TestPass123!"
    })
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to remove from shortlist
    response = client.delete(
        f"/api/shortlist/{test_universities[0].id}",
        headers=headers
    )
    
    # Should be blocked
    assert response.status_code == 403
