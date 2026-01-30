import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from database import engine, get_db, Base
from schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    ProfileUpdate, ProfileResponse,
    UniversityResponse, ShortlistCreate, ShortlistResponse,
    TaskCreate, TaskUpdate, TaskResponse,
    ChatMessageCreate, ChatMessageResponse,
    ChatMessageCreate, ChatMessageResponse,
    ChatSessionCreate, ChatSessionUpdate, ChatSessionResponse,
    DashboardResponse, ForgotPasswordRequest, ResetPasswordRequest
)
from models import User, UserProfile, University, ShortlistedUniversity, Task, ChatMessage, ChatSession, UserStage, TaskStatus
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from universities_data import UNIVERSITIES
from ai_counsellor import get_counsellor_response, analyze_profile_strength, categorize_university
from demo_data import DEMO_PROFILES, DEMO_CREDENTIALS
from google_oauth import google_router

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    db = next(get_db())
    seed_universities(db)
    seed_demo_users(db)
    db.close()
    yield

app = FastAPI(title="AI Counsellor API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(google_router)

@app.get("/")
def root():
    """Welcome endpoint for API visitors"""
    return {
        "name": "AI Counsellor API",
        "version": "1.0.0",
        "description": "A stage-based decision system for study-abroad guidance",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "auth": "/api/auth/login",
            "universities": "/api/universities",
            "counsellor": "/api/counsellor/chat"
        },
        "demo_accounts": {
            "weak_profile": "weak@demo.com",
            "average_profile": "average@demo.com", 
            "strong_profile": "strong@demo.com",
            "password": "Demo@123"
        },
        "frontend": "https://ai-counsellor-plum.vercel.app",
        "github": "https://github.com/amarzeus/ai-counsellor"
    }

@app.get("/health")
def health_check():
    """Health check endpoint for Docker/Kubernetes"""
    return {"status": "healthy", "service": "ai-counsellor-backend"}

@app.get("/api/health")
def api_health():
    """API health check"""
    return {"status": "healthy"}

@app.delete("/api/user/sessions/all")
def delete_all_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete all chat sessions for the current user (cleanup endpoint)"""
    deleted_count = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).delete()
    db.commit()
    return {"message": f"Deleted {deleted_count} sessions", "deleted": deleted_count}

def seed_universities(db: Session):
    # Ensure all universities in code exist in DB
    for uni_data in UNIVERSITIES:
        existing = db.query(University).filter(University.name == uni_data["name"]).first()
        if not existing:
            uni = University(**uni_data)
            db.add(uni)
    db.commit()

def seed_demo_users(db: Session):
    """Create demo users with weak/average/strong profiles for demo purposes"""
    created = []
    for profile_type, data in DEMO_PROFILES.items():
        existing = db.query(User).filter(User.email == data["email"]).first()
        if existing:
            created.append(f"{profile_type}: already exists")
            continue
        
        user = User(
            email=data["email"],
            password_hash=get_password_hash(data["password"]),
            full_name=data["full_name"],
            current_stage=UserStage.DISCOVERY,
            onboarding_completed=True
        )
        db.add(user)
        db.flush()
        
        profile_data = data["profile"]
        profile = UserProfile(
            user_id=user.id,
            current_education_level=profile_data["current_education_level"],
            degree_major=profile_data["degree_major"],
            graduation_year=profile_data["graduation_year"],
            gpa=profile_data["gpa"],
            intended_degree=profile_data["intended_degree"],
            field_of_study=profile_data["field_of_study"],
            target_intake_year=profile_data["target_intake_year"],
            preferred_countries=profile_data["preferred_countries"],
            budget_per_year=profile_data["budget_per_year"],
            funding_plan=profile_data["funding_plan"],
            ielts_toefl_status=profile_data["ielts_toefl_status"],
            gre_gmat_status=profile_data["gre_gmat_status"],
            sop_status=profile_data["sop_status"]
        )
        db.add(profile)
        created.append(f"{profile_type}: {data['email']} created")
    
    db.commit()
    return created

def run_migrations():
    """Run database migrations on startup"""
    with engine.connect() as conn:
        migrations = [
            # Add google_id column to users
            ("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE", "google_id"),
            # Create chat_sessions table if it doesn't exist
            ("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    title VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """, "chat_sessions table"),
            # Add session_id column to chat_messages
            ("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES chat_sessions(id)", "session_id"),
            # Add suggested_next_questions column to chat_messages
            ("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS suggested_next_questions JSON", "suggested_next_questions"),
        ]
        
        for sql, name in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"Migration applied: {name}")
            except Exception as e:
                error_str = str(e).lower()
                if "already exists" in error_str or "duplicate" in error_str:
                    print(f"Migration skipped (already exists): {name}")
                else:
                    print(f"Migration warning for {name}: {e}")

@app.post("/api/seed-demo")
def seed_demo_endpoint(db: Session = Depends(get_db)):
    """Manually seed demo users (useful for resetting demo data)"""
    results = seed_demo_users(db)
    return {
        "message": "Demo users seeded",
        "results": results,
        "credentials": DEMO_CREDENTIALS
    }

# ============================================================
# STAGE GUARDS - Enforce strict stage-based access control
# ============================================================
# Stage 1: ONBOARDING - User completing profile
# Stage 2: DISCOVERY  - User exploring & shortlisting universities
# Stage 3: LOCKED     - User has locked universities
# Stage 4: APPLICATION - User working on applications
# ============================================================

def require_stage_minimum(user: User, required_stage: UserStage, action_description: str):
    """
    Guard: User must be at or past a certain stage.
    Blocks ONBOARDING users from DISCOVERY features, etc.
    """
    stage_order = {
        UserStage.ONBOARDING: 1,
        UserStage.DISCOVERY: 2,
        UserStage.LOCKED: 3,
        UserStage.APPLICATION: 4
    }
    user_level = stage_order.get(user.current_stage, 1)
    required_level = stage_order.get(required_stage, 1)
    
    if user_level < required_level:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "STAGE_BLOCKED",
                "message": f"Cannot {action_description}. You are in {user.current_stage.value} stage.",
                "current_stage": user.current_stage.value,
                "required_stage": required_stage.value,
                "next_step": get_next_step_guidance(user.current_stage)
            }
        )

def require_shortlist_exists(db: Session, user: User):
    """
    Guard: User must have at least one shortlisted university to lock.
    """
    count = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.user_id == user.id
    ).count()
    
    if count == 0:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "NO_SHORTLIST",
                "message": "Cannot lock universities. You must shortlist at least one university first.",
                "current_stage": user.current_stage.value,
                "next_step": "Browse universities and add some to your shortlist before locking."
            }
        )

def block_shortlist_modifications(user: User, action: str):
    """
    Guard: LOCKED and APPLICATION users cannot modify shortlist without warning.
    """
    if user.current_stage in [UserStage.LOCKED, UserStage.APPLICATION]:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "STAGE_LOCKED",
                "message": f"Cannot {action}. Your university list is locked for applications.",
                "current_stage": user.current_stage.value,
                "warning": "Modifying your shortlist at this stage may affect your application progress.",
                "action_required": "To modify, use the unlock feature with confirmation."
            }
        )

def warn_stage_regression(user: User, action: str):
    """
    Guard: APPLICATION users going back to earlier stages need explicit confirmation.
    Returns warning info if user is in APPLICATION stage.
    """
    if user.current_stage == UserStage.APPLICATION:
        return {
            "warning": True,
            "message": f"You are in APPLICATION stage. {action} will affect your application tasks.",
            "impact": "Some generated tasks may become invalid if you change your locked universities."
        }
    return None

def get_next_step_guidance(current_stage: UserStage) -> str:
    """Provide guidance on what to do next based on current stage."""
    guidance = {
        UserStage.ONBOARDING: "Complete your profile with academic details, budget, and preferences.",
        UserStage.DISCOVERY: "Explore universities and add at least one to your shortlist, then lock your choices.",
        UserStage.LOCKED: "Review your locked universities and proceed to applications.",
        UserStage.APPLICATION: "Complete your application tasks for each locked university."
    }
    return guidance.get(current_stage, "Continue with your study abroad journey.")

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/auth/signup", response_model=TokenResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        current_stage=UserStage.ONBOARDING
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    profile = UserProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    
    token = create_access_token(data={"sub": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@app.post("/api/auth/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"sub": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@app.get("/api/user/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@app.post("/api/auth/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        return {"message": "If an account exists with this email, you will receive password reset instructions."}
    return {"message": "If an account exists with this email, you will receive password reset instructions."}

@app.post("/api/auth/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    raise HTTPException(status_code=400, detail="Password reset functionality requires email configuration. Please contact support.")

@app.get("/api/profile", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return ProfileResponse.model_validate(profile)

@app.put("/api/profile", response_model=ProfileResponse)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    for field, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    
    strength = analyze_profile_strength(profile_data.model_dump())
    profile.profile_strength = strength['overall']
    
    required_fields = [
        profile.current_education_level,
        profile.degree_major,
        profile.intended_degree,
        profile.field_of_study,
        profile.preferred_countries,
        profile.budget_per_year,
        profile.funding_plan
    ]
    
    if all(required_fields):
        current_user.onboarding_completed = True
        if current_user.current_stage == UserStage.ONBOARDING:
            current_user.current_stage = UserStage.DISCOVERY
    
    db.commit()
    db.refresh(profile)
    return ProfileResponse.model_validate(profile)

@app.post("/api/onboarding/complete")
def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    required_fields = [
        profile.current_education_level if profile else None,
        profile.degree_major if profile else None,
        profile.intended_degree if profile else None,
        profile.field_of_study if profile else None,
        profile.preferred_countries if profile else None,
        profile.budget_per_year if profile else None,
        profile.funding_plan if profile else None
    ]
    
    if not all(required_fields):
        raise HTTPException(status_code=400, detail="Please complete all required profile fields")
    
    current_user.onboarding_completed = True
    current_user.current_stage = UserStage.DISCOVERY
    db.commit()
    
    return {"message": "Onboarding completed successfully", "stage": current_user.current_stage.value}

@app.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    shortlisted_count = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.user_id == current_user.id
    ).count()
    locked_count = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.user_id == current_user.id,
        ShortlistedUniversity.is_locked == True
    ).count()
    pending_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == TaskStatus.PENDING
    ).count()
    
    profile_strength = analyze_profile_strength(
        profile.__dict__ if profile else {}
    )
    
    if current_user.current_stage == UserStage.ONBOARDING:
        next_action = "Complete your profile to unlock the AI Counsellor"
    elif current_user.current_stage == UserStage.DISCOVERY:
        if shortlisted_count == 0:
            next_action = "Talk to the AI Counsellor to discover and shortlist universities"
        else:
            next_action = "Lock at least one university to proceed to application guidance"
    elif current_user.current_stage == UserStage.LOCKED:
        next_action = "Review your locked universities and proceed to applications"
    else:
        next_action = "Complete your application tasks and prepare documents"
    
    return DashboardResponse(
        user=UserResponse.model_validate(current_user),
        profile=ProfileResponse.model_validate(profile) if profile else None,
        current_stage=current_user.current_stage,
        profile_strength=profile_strength,
        shortlisted_count=shortlisted_count,
        locked_count=locked_count,
        pending_tasks=pending_tasks,
        next_action=next_action
    )

@app.get("/api/universities", response_model=List[UniversityResponse])
def get_universities(
    country: Optional[str] = None,
    max_tuition: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # GUARD: Stage 1 users cannot access Discovery data
    require_stage_minimum(current_user, UserStage.DISCOVERY, "browse universities")
    
    query = db.query(University)
    if country:
        query = query.filter(University.country == country)
    if max_tuition:
        query = query.filter(University.tuition_per_year <= max_tuition)
    
    universities = query.all()
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    profile_dict = profile.__dict__ if profile else {}
    
    result = []
    for uni in universities:
        cat, fit, risk, acc, cost = categorize_university(uni.__dict__, profile_dict)
        uni_resp = UniversityResponse(
            id=uni.id,
            name=uni.name,
            country=uni.country,
            tuition_per_year=uni.tuition_per_year,
            ranking=uni.ranking,
            min_gpa=uni.min_gpa,
            programs=uni.programs,
            description=uni.description,
            acceptance_rate=uni.acceptance_rate,
            category=cat,
            fit_reason=fit,
            risk_reason=risk,
            cost_level=cost,
            acceptance_chance=acc
        )
        result.append(uni_resp)
    
    return result

@app.get("/api/shortlist", response_model=List[ShortlistResponse])
def get_shortlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # GUARD: Stage 1 users cannot access Discovery data
    require_stage_minimum(current_user, UserStage.DISCOVERY, "view shortlist")
    
    shortlisted = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.user_id == current_user.id
    ).all()
    
    result = []
    for s in shortlisted:
        uni = db.query(University).filter(University.id == s.university_id).first()
        result.append(ShortlistResponse(
            id=s.id,
            university_id=s.university_id,
            university=UniversityResponse.model_validate(uni),
            category=s.category,
            is_locked=s.is_locked,
            locked_at=s.locked_at
        ))
    return result

@app.post("/api/shortlist", response_model=ShortlistResponse)
def add_to_shortlist(
    data: ShortlistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # GUARD: Stage 1 users cannot shortlist
    require_stage_minimum(current_user, UserStage.DISCOVERY, "add to shortlist")
    # GUARD: Stage 3/4 users cannot modify shortlist
    block_shortlist_modifications(current_user, "add new universities to shortlist")
    
    existing = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.user_id == current_user.id,
        ShortlistedUniversity.university_id == data.university_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="University already shortlisted")
    
    shortlist = ShortlistedUniversity(
        user_id=current_user.id,
        university_id=data.university_id,
        category=data.category
    )
    db.add(shortlist)
    db.commit()
    db.refresh(shortlist)
    
    uni = db.query(University).filter(University.id == data.university_id).first()
    return ShortlistResponse(
        id=shortlist.id,
        university_id=shortlist.university_id,
        university=UniversityResponse.model_validate(uni),
        category=shortlist.category,
        is_locked=shortlist.is_locked,
        locked_at=shortlist.locked_at
    )

@app.delete("/api/shortlist/university/{university_id}")
def remove_shortlist_by_university(
    university_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shortlist = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.user_id == current_user.id,
        ShortlistedUniversity.university_id == university_id
    ).first()
    
    if not shortlist:
        raise HTTPException(status_code=404, detail="University not in shortlist")
        
    if shortlist.is_locked:
        raise HTTPException(status_code=400, detail="Cannot remove locked university. Unlock it first.")
        
    db.delete(shortlist)
    db.commit()
    return {"message": "Removed from shortlist"}

@app.post("/api/shortlist/{shortlist_id}/lock")
def lock_university(
    shortlist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # GUARD: Stage 1 users cannot lock
    require_stage_minimum(current_user, UserStage.DISCOVERY, "lock universities")
    # GUARD: Must have shortlist to lock
    require_shortlist_exists(db, current_user)
    
    shortlist = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.id == shortlist_id,
        ShortlistedUniversity.user_id == current_user.id
    ).first()
    
    if not shortlist:
        raise HTTPException(status_code=404, detail="Shortlist not found")
    
    shortlist.is_locked = True
    shortlist.locked_at = datetime.utcnow()
    
    if current_user.current_stage in [UserStage.DISCOVERY, UserStage.LOCKED]:
        current_user.current_stage = UserStage.APPLICATION
    
    uni = db.query(University).filter(University.id == shortlist.university_id).first()
    default_tasks = [
        Task(user_id=current_user.id, shortlisted_university_id=shortlist.id, 
             title=f"Research {uni.name} admission requirements", priority=1),
        Task(user_id=current_user.id, shortlisted_university_id=shortlist.id,
             title=f"Prepare SOP for {uni.name}", priority=2),
        Task(user_id=current_user.id, shortlisted_university_id=shortlist.id,
             title=f"Gather required documents for {uni.name}", priority=3),
        Task(user_id=current_user.id, shortlisted_university_id=shortlist.id,
             title=f"Check application deadline for {uni.name}", priority=1),
    ]
    
    for task in default_tasks:
        db.add(task)
    
    db.commit()
    
    return {"message": f"University locked successfully. You are now in the Application stage.", "stage": current_user.current_stage.value}

@app.post("/api/shortlist/{shortlist_id}/unlock")
def unlock_university(
    shortlist_id: int,
    confirm: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # GUARD: Stage 4 users need explicit confirmation to go back
    regression_warning = warn_stage_regression(current_user, "Unlocking a university")
    if regression_warning and not confirm:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "CONFIRMATION_REQUIRED",
                "message": regression_warning["message"],
                "impact": regression_warning["impact"],
                "action_required": "Set confirm=true to proceed. This action cannot be undone."
            }
        )
    
    shortlist = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.id == shortlist_id,
        ShortlistedUniversity.user_id == current_user.id
    ).first()
    
    if not shortlist:
        raise HTTPException(status_code=404, detail="Shortlist not found")
    
    shortlist.is_locked = False
    shortlist.locked_at = None
    
    db.query(Task).filter(
        Task.shortlisted_university_id == shortlist_id
    ).delete()
    
    other_locked = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.user_id == current_user.id,
        ShortlistedUniversity.is_locked == True,
        ShortlistedUniversity.id != shortlist_id
    ).count()
    
    if other_locked == 0:
        current_user.current_stage = UserStage.DISCOVERY
    
    db.commit()
    
    return {
        "message": "University unlocked. Warning: Application tasks have been removed.",
        "stage": current_user.current_stage.value,
        "tasks_deleted": True
    }

@app.delete("/api/shortlist/{shortlist_id}")
def remove_from_shortlist(
    shortlist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # GUARD: Stage 3/4 users cannot modify shortlist
    block_shortlist_modifications(current_user, "remove universities from shortlist")
    
    shortlist = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.id == shortlist_id,
        ShortlistedUniversity.user_id == current_user.id
    ).first()
    
    if not shortlist:
        raise HTTPException(status_code=404, detail="Shortlist not found")
    
    if shortlist.is_locked:
        raise HTTPException(status_code=400, detail="Cannot remove locked university. Unlock it first.")
    
    db.delete(shortlist)
    db.commit()
    
    return {"message": "University removed from shortlist"}

@app.get("/api/tasks", response_model=List[TaskResponse])
def get_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(Task).filter(Task.user_id == current_user.id).order_by(Task.priority).all()
    return [TaskResponse.model_validate(t) for t in tasks]

@app.post("/api/tasks", response_model=TaskResponse)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # GUARD: Tasks can only be created in APPLICATION stage
    require_stage_minimum(current_user, UserStage.APPLICATION, "create application tasks")
    
    task = Task(
        user_id=current_user.id,
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority or 1,
        due_date=task_data.due_date,
        shortlisted_university_id=task_data.shortlisted_university_id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)

@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = task_data.status
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)

@app.get("/api/sessions", response_model=List[ChatSessionResponse])
def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).all()
    return [ChatSessionResponse.model_validate(s) for s in sessions]

@app.post("/api/sessions", response_model=ChatSessionResponse)
def create_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = ChatSession(
        user_id=current_user.id,
        title=session_data.title
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return ChatSessionResponse.model_validate(session)

@app.put("/api/sessions/{session_id}", response_model=ChatSessionResponse)
def update_session(
    session_id: int,
    session_data: ChatSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.title = session_data.title
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return ChatSessionResponse.model_validate(session)

@app.delete("/api/sessions/{session_id}")
def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}

@app.get("/api/chat/history/{session_id}", response_model=List[ChatMessageResponse])
def get_chat_history(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify session ownership
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()

    # Runtime Hydration (Fix for old messages & dynamic info)
    shortlisted_ids = [s.university_id for s in current_user.shortlisted_universities]
    
    # Pre-fetch universities to avoid N+1 if needed, or query on demand
    # Simple on-demand for now as universities table is small
    
    for msg in messages:
        if msg.suggested_universities:
            # We need to modify the dict in place or create a copy
            # Since SQLA models return immutable-ish JSON, better to modify before returning response model
            # But here we are returning list of model_validates.
            # We must modify the underlying dict or handle it in the loop. 
            # Note: Modifying msg.suggested_universities directly on DB object might trigger update if we commit (we won't).
            # But for Pydantic validation, we need to pass the modified data.
            
            # Create a mutable copy
            updated_suggestions = []
            for uni_data in msg.suggested_universities:
                new_data = uni_data.copy()
                uni_id = new_data.get('university_id')
                
                # Check if hydration needed
                if uni_id:
                    # Always re-hydrate to ensure freshness and fix "ID Only" bug
                    db_uni = db.query(University).filter(University.id == uni_id).first()
                    if db_uni:
                        new_data['name'] = db_uni.name
                        new_data['country'] = db_uni.country
                        new_data['tuition'] = db_uni.tuition_per_year
                        new_data['ranking'] = db_uni.ranking
                    
                    # Update shortlist status
                    new_data['is_shortlisted'] = uni_id in shortlisted_ids
                
                updated_suggestions.append(new_data)
            
            # Temporarily assign to object for response serialization
            # This works because Python objects are mutable, but won't persist to DB unless committed
            msg.suggested_universities = updated_suggestions

    return [ChatMessageResponse.model_validate(m) for m in messages]

@app.post("/api/chat", response_model=ChatMessageResponse)
async def chat_with_counsellor(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not message_data.session_id:
        # Auto-create session if not provided
        new_session = ChatSession(
            user_id=current_user.id,
            title=message_data.content[:30] + "..."
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        session_id = new_session.id
    else:
        session_id = message_data.session_id
        session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        # Update session title/timestamp if needed
        session.updated_at = datetime.utcnow()

    # GUARD: Onboarding Check
    if not current_user.onboarding_completed and current_user.current_stage == UserStage.ONBOARDING:
        pass
    
    user_message = ChatMessage(
        user_id=current_user.id,
        session_id=session_id,
        role="user",
        content=message_data.content
    )
    db.add(user_message)
    db.commit()
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    universities = db.query(University).all()
    shortlisted = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.user_id == current_user.id
    ).all()
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    
    user_dict = {
        'id': current_user.id,
        'full_name': current_user.full_name,
        'email': current_user.email,
        'current_stage': current_user.current_stage.value,
        'onboarding_completed': current_user.onboarding_completed
    }
    profile_dict = profile.__dict__ if profile else {}
    uni_list = [u.__dict__ for u in universities]
    shortlist_data = []
    for s in shortlisted:
        uni = db.query(University).filter(University.id == s.university_id).first()
        shortlist_data.append({
            'id': s.id,
            'university_id': s.university_id,
            'university': uni.__dict__ if uni else {},
            'category': s.category.value if s.category else None,
            'is_locked': s.is_locked
        })
    task_list = [{'id': t.id, 'title': t.title, 'status': t.status.value} for t in tasks]
    
    response = await get_counsellor_response(
        message_data.content,
        user_dict,
        profile_dict,
        uni_list,
        shortlist_data,
        task_list
    )
    
    # ============================================================
    # EXECUTE AI TOOL CALLS → Backend Actions → DB Updates
    # ============================================================
    # Flow: Gemini JSON → Validate Stage → Execute → DB Update → Confirm
    # ============================================================
    actions_taken = []
    actions_blocked = []
    
    for action in response.get('actions', []):
        action_type = action.get('type')
        params = action.get('params', {})
        
        # ------------------------------------------------------------
        # TOOL: shortlist_university
        # JSON: {"type": "shortlist_university", "params": {"university_id": 1, "category": "TARGET"}}
        # Requires: DISCOVERY stage, onboarding complete
        # ------------------------------------------------------------
        if action_type == 'shortlist_university':
            uni_id = params.get('university_id')
            category = params.get('category', 'TARGET')
            
            # Stage check: Must be in DISCOVERY, not LOCKED/APPLICATION
            if current_user.current_stage == UserStage.ONBOARDING:
                actions_blocked.append({'type': action_type, 'reason': 'Complete onboarding first'})
                continue
            if current_user.current_stage in [UserStage.LOCKED, UserStage.APPLICATION]:
                actions_blocked.append({'type': action_type, 'reason': 'Cannot modify shortlist after locking'})
                continue
            
            existing = db.query(ShortlistedUniversity).filter(
                ShortlistedUniversity.user_id == current_user.id,
                ShortlistedUniversity.university_id == uni_id
            ).first()
            
            if existing:
                actions_blocked.append({'type': action_type, 'reason': 'Already shortlisted'})
                continue
            
            uni = db.query(University).filter(University.id == uni_id).first()
            if not uni:
                actions_blocked.append({'type': action_type, 'reason': 'University not found'})
                continue
            
            shortlist = ShortlistedUniversity(
                user_id=current_user.id,
                university_id=uni_id,
                category=category
            )
            db.add(shortlist)
            db.flush()  # Get ID immediately
            actions_taken.append({
                'type': 'shortlist_university',
                'university_id': uni_id,
                'university_name': uni.name,
                'category': category,
                'shortlist_id': shortlist.id,
                'confirmed': True
            })
        
        # ------------------------------------------------------------
        # TOOL: lock_university
        # JSON: {"type": "lock_university", "params": {"university_id": 1}}
        # Requires: DISCOVERY stage, university in shortlist
        # Result: Moves user to APPLICATION stage, creates tasks
        # ------------------------------------------------------------
        elif action_type == 'lock_university':
            uni_id = params.get('university_id')
            
            # Stage check
            if current_user.current_stage == UserStage.ONBOARDING:
                actions_blocked.append({'type': action_type, 'reason': 'Complete onboarding first'})
                continue
            
            # Find in shortlist
            shortlist = db.query(ShortlistedUniversity).filter(
                ShortlistedUniversity.user_id == current_user.id,
                ShortlistedUniversity.university_id == uni_id
            ).first()
            
            if not shortlist:
                actions_blocked.append({'type': action_type, 'reason': 'University not in shortlist. Add to shortlist first.'})
                continue
            
            if shortlist.is_locked:
                actions_blocked.append({'type': action_type, 'reason': 'Already locked'})
                continue
            
            # Execute lock
            shortlist.is_locked = True
            shortlist.locked_at = datetime.utcnow()
            
            # Stage transition: Move to APPLICATION
            previous_stage = current_user.current_stage.value
            current_user.current_stage = UserStage.APPLICATION
            
            # Auto-generate tasks
            uni = db.query(University).filter(University.id == uni_id).first()
            generated_tasks = []
            task_templates = [
                (f"Research {uni.name} admission requirements", 1),
                (f"Prepare SOP for {uni.name}", 2),
                (f"Gather documents for {uni.name}", 3),
                (f"Check {uni.name} application deadline", 1),
            ]
            for title, priority in task_templates:
                task = Task(
                    user_id=current_user.id,
                    shortlisted_university_id=shortlist.id,
                    title=title,
                    priority=priority
                )
                db.add(task)
                generated_tasks.append(title)
            
            actions_taken.append({
                'type': 'lock_university',
                'university_id': uni_id,
                'university_name': uni.name,
                'stage_changed': True,
                'previous_stage': previous_stage,
                'new_stage': 'APPLICATION',
                'tasks_created': len(generated_tasks),
                'confirmed': True
            })
        
        # ------------------------------------------------------------
        # TOOL: unlock_university
        # JSON: {"type": "unlock_university", "params": {"university_id": 1}}
        # Warning: Deletes tasks, may regress stage
        # ------------------------------------------------------------
        elif action_type == 'unlock_university':
            uni_id = params.get('university_id')
            
            shortlist = db.query(ShortlistedUniversity).filter(
                ShortlistedUniversity.user_id == current_user.id,
                ShortlistedUniversity.university_id == uni_id
            ).first()
            
            if not shortlist:
                actions_blocked.append({'type': action_type, 'reason': 'University not in shortlist'})
                continue
            
            if not shortlist.is_locked:
                actions_blocked.append({'type': action_type, 'reason': 'University is not locked'})
                continue
            
            # Execute unlock
            shortlist.is_locked = False
            shortlist.locked_at = None
            
            # Delete associated tasks
            deleted_tasks = db.query(Task).filter(
                Task.shortlisted_university_id == shortlist.id
            ).delete()
            
            # Check if any other locked universities remain
            other_locked = db.query(ShortlistedUniversity).filter(
                ShortlistedUniversity.user_id == current_user.id,
                ShortlistedUniversity.is_locked == True,
                ShortlistedUniversity.id != shortlist.id
            ).count()
            
            stage_regressed = False
            if other_locked == 0:
                current_user.current_stage = UserStage.DISCOVERY
                stage_regressed = True
            
            uni = db.query(University).filter(University.id == uni_id).first()
            actions_taken.append({
                'type': 'unlock_university',
                'university_id': uni_id,
                'university_name': uni.name if uni else 'Unknown',
                'tasks_deleted': deleted_tasks,
                'stage_regressed': stage_regressed,
                'new_stage': current_user.current_stage.value,
                'confirmed': True
            })
        
        # ------------------------------------------------------------
        # TOOL: create_task
        # JSON: {"type": "create_task", "params": {"title": "...", "description": "...", "priority": 1}}
        # Requires: APPLICATION stage
        # ------------------------------------------------------------
        elif action_type == 'create_task':
            # Stage check
            if current_user.current_stage != UserStage.APPLICATION:
                actions_blocked.append({'type': action_type, 'reason': 'Tasks can only be created in APPLICATION stage'})
                continue
            
            task = Task(
                user_id=current_user.id,
                title=params.get('title', 'New Task'),
                description=params.get('description'),
                priority=params.get('priority', 1)
            )
            db.add(task)
            db.flush()
            actions_taken.append({
                'type': 'create_task',
                'task_id': task.id,
                'title': task.title,
                'confirmed': True
            })
        
        # ------------------------------------------------------------
        # TOOL: update_task
        # JSON: {"type": "update_task", "params": {"task_id": 1, "status": "COMPLETED"}}
        # ------------------------------------------------------------
        elif action_type == 'update_task':
            task_id = params.get('task_id')
            new_status = params.get('status', 'IN_PROGRESS')
            
            task = db.query(Task).filter(
                Task.id == task_id,
                Task.user_id == current_user.id
            ).first()
            
            if not task:
                actions_blocked.append({'type': action_type, 'reason': 'Task not found'})
                continue
            
            try:
                task.status = TaskStatus(new_status)
                actions_taken.append({
                    'type': 'update_task',
                    'task_id': task_id,
                    'new_status': new_status,
                    'confirmed': True
                })
            except ValueError:
                actions_blocked.append({'type': action_type, 'reason': f'Invalid status: {new_status}'})
    
    db.commit()
    db.refresh(current_user)  # Refresh to get updated stage
    
    # Build comprehensive action summary for response
    action_summary = None
    if actions_taken or actions_blocked:
        action_summary = {
            'executed': actions_taken,
            'blocked': actions_blocked,
            'final_stage': current_user.current_stage.value
        }
    
    # Hydrate suggested universities with DB data
    suggested_unis = response.get('suggested_universities')
    
    # Get user's currently shortlisted IDs for "is_shortlisted" status
    shortlisted_ids = [s.university_id for s in current_user.shortlisted_universities]
    
    if suggested_unis:
        for uni_data in suggested_unis:
            uni_id = uni_data.get('university_id')
            if uni_id:
                db_uni = db.query(University).filter(University.id == uni_id).first()
                if db_uni:
                    uni_data['name'] = db_uni.name
                    uni_data['country'] = db_uni.country
                    uni_data['tuition'] = db_uni.tuition_per_year
                    uni_data['ranking'] = db_uni.ranking
                    uni_data['is_shortlisted'] = uni_id in shortlisted_ids

    ai_message = ChatMessage(
        user_id=current_user.id,
        session_id=session_id,
        role="assistant",
        content=response.get('message', 'I apologize, but I could not process your request.'),
        actions_taken=action_summary,
        suggested_universities=suggested_unis,
        suggested_next_questions=response.get('suggested_next_questions')
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)
    
    return ChatMessageResponse.model_validate(ai_message)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True, forwarded_allow_ips="*")
