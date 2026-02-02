"""
Pytest configuration and shared fixtures for backend tests.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from database import Base
from models import User, UserProfile, University, UserStage, ShortlistedUniversity, Task, TaskStatus
from main import app
from auth import get_password_hash

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db_engine():
    """Create a fresh database engine for each test."""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a database session for tests."""
    TestingSessionLocal = sessionmaker(bind=db_engine)
    session = TestingSessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database override."""
    from database import get_db
    
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session):
    """Create a test user in DISCOVERY stage."""
    user = User(
        email="test@example.com",
        password_hash=get_password_hash("TestPass123!"),
        full_name="Test User",
        current_stage=UserStage.DISCOVERY,
        onboarding_completed=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def onboarding_user(db_session):
    """Create a user in ONBOARDING stage."""
    user = User(
        email="onboarding@example.com",
        password_hash=get_password_hash("TestPass123!"),
        full_name="Onboarding User",
        current_stage=UserStage.ONBOARDING,
        onboarding_completed=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def locked_user(db_session):
    """Create a user in LOCKED stage."""
    user = User(
        email="locked@example.com",
        password_hash=get_password_hash("TestPass123!"),
        full_name="Locked User",
        current_stage=UserStage.LOCKED,
        onboarding_completed=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_profile(db_session, test_user):
    """Create a test user profile."""
    profile = UserProfile(
        user_id=test_user.id,
        current_education_level="Bachelor's",
        degree_major="Computer Science",
        graduation_year=2024,
        gpa=3.6,
        intended_degree="Master's",
        field_of_study="Computer Science",
        target_intake_year=2025,
        preferred_countries=["USA"],
        budget_per_year=50000,
        funding_plan="SELF_FUNDED",
        ielts_toefl_status="COMPLETED",
        gre_gmat_status="COMPLETED",
        sop_status="DRAFT"
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile

@pytest.fixture
def test_universities(db_session):
    """Create test universities with different characteristics."""
    universities = [
        University(
            name="MIT",
            country="USA",
            min_gpa=3.9,
            tuition_per_year=55000,
            acceptance_rate=0.04,
            ranking=1
        ),
        University(
            name="University of Michigan",
            country="USA",
            min_gpa=3.5,
            tuition_per_year=48000,
            acceptance_rate=0.23,
            ranking=25
        ),
        University(
            name="State University",
            country="USA",
            min_gpa=3.0,
            tuition_per_year=25000,
            acceptance_rate=0.65,
            ranking=100
        )
    ]
    for uni in universities:
        db_session.add(uni)
    db_session.commit()
    for uni in universities:
        db_session.refresh(uni)
    return universities

@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers for test user."""
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "TestPass123!"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_shortlist(db_session, test_user, test_universities):
    """Create a shortlisted university."""
    shortlist = ShortlistedUniversity(
        user_id=test_user.id,
        university_id=test_universities[1].id,  # University of Michigan
        category="TARGET",
        is_locked=False
    )
    db_session.add(shortlist)
    db_session.commit()
    db_session.refresh(shortlist)
    return shortlist

@pytest.fixture
def test_task(db_session, test_user):
    """Create a test task."""
    task = Task(
        user_id=test_user.id,
        title="Complete SOP",
        description="Write Statement of Purpose",
        priority=1,
        status=TaskStatus.PENDING
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)
    return task
