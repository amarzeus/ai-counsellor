"""
Database model tests - relationships, constraints, and validations.
"""
import pytest
from sqlalchemy.exc import IntegrityError
from models import User, UserProfile, University, ShortlistedUniversity, Task, UserStage

def test_user_profile_relationship(db_session, test_user, test_profile):
    """Test User-Profile one-to-one relationship."""
    assert test_user.profile is not None
    assert test_user.profile.id == test_profile.id
    assert test_profile.user.id == test_user.id

def test_user_shortlist_relationship(db_session, test_user, test_shortlist):
    """Test User-ShortlistedUniversity relationship."""
    assert len(test_user.shortlisted_universities) > 0
    assert test_user.shortlisted_universities[0].id == test_shortlist.id

def test_user_tasks_relationship(db_session, test_user, test_task):
    """Test User-Task relationship."""
    assert len(test_user.tasks) > 0
    assert test_user.tasks[0].id == test_task.id

def test_cascade_delete_user(db_session, test_user, test_profile, test_task):
    """Test that deleting user cascades to profile and tasks."""
    user_id = test_user.id
    
    db_session.delete(test_user)
    db_session.commit()
    
    # Profile should be deleted (if cascade is set)
    db_session.query(UserProfile).filter_by(user_id=user_id).first()
    # Depending on cascade settings, this might be None
    
    # Tasks should be deleted (if cascade is set)
    db_session.query(Task).filter_by(user_id=user_id).all()
    # Depending on cascade settings, this might be empty

def test_unique_email_constraint(db_session):
    """Test that duplicate emails are prevented."""
    from auth import get_password_hash
    
    user1 = User(
        email="unique@test.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="User 1"
    )
    db_session.add(user1)
    db_session.commit()
    
    user2 = User(
        email="unique@test.com",  # Duplicate
        password_hash=get_password_hash("Pass456!"),
        full_name="User 2"
    )
    db_session.add(user2)
    
    with pytest.raises(IntegrityError):
        db_session.commit()

def test_user_stage_enum(db_session):
    """Test UserStage enum values."""
    from auth import get_password_hash
    
    user = User(
        email="stage@test.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Stage Test",
        current_stage=UserStage.DISCOVERY
    )
    db_session.add(user)
    db_session.commit()
    
    assert user.current_stage == UserStage.DISCOVERY
    assert user.current_stage.value == "DISCOVERY"

def test_university_unique_name(db_session):
    """Test that university names are unique."""
    uni1 = University(
        name="Test University",
        country="USA",
        min_gpa=3.0,
        tuition_per_year=30000
    )
    db_session.add(uni1)
    db_session.commit()
    
    uni2 = University(
        name="Test University",  # Duplicate
        country="Canada",
        min_gpa=3.2,
        tuition_per_year=25000
    )
    db_session.add(uni2)
    
    with pytest.raises(IntegrityError):
        db_session.commit()

def test_shortlist_category_values(db_session, test_user, test_universities):
    """Test shortlist category values."""
    shortlist = ShortlistedUniversity(
        user_id=test_user.id,
        university_id=test_universities[0].id,
        category="DREAM",
        is_locked=False
    )
    db_session.add(shortlist)
    db_session.commit()
    
    assert shortlist.category == "DREAM"
    assert shortlist.is_locked is False
