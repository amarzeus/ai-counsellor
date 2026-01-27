import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, get_db, Base
from models import User, UserProfile, University, ShortlistedUniversity, Task, ChatMessage, UserStage, TaskStatus
from schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    ProfileUpdate, ProfileResponse,
    UniversityResponse, ShortlistCreate, ShortlistResponse,
    TaskCreate, TaskUpdate, TaskResponse,
    ChatMessageCreate, ChatMessageResponse,
    DashboardResponse
)
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from universities_data import UNIVERSITIES
from ai_counsellor import get_counsellor_response, analyze_profile_strength, categorize_university

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Counsellor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "https://*.replit.dev",
        "https://*.worf.replit.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def seed_universities(db: Session):
    if db.query(University).count() == 0:
        for uni_data in UNIVERSITIES:
            uni = University(**uni_data)
            db.add(uni)
        db.commit()

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    seed_universities(db)
    db.close()

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
    if not current_user.onboarding_completed:
        raise HTTPException(status_code=403, detail="Complete onboarding first")
    
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
    if not current_user.onboarding_completed:
        raise HTTPException(status_code=403, detail="Complete onboarding first")
    
    if current_user.current_stage == UserStage.ONBOARDING:
        raise HTTPException(status_code=403, detail="Cannot shortlist during onboarding stage")
    
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

@app.post("/api/shortlist/{shortlist_id}/lock")
def lock_university(
    shortlist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shortlist = db.query(ShortlistedUniversity).filter(
        ShortlistedUniversity.id == shortlist_id,
        ShortlistedUniversity.user_id == current_user.id
    ).first()
    
    if not shortlist:
        raise HTTPException(status_code=404, detail="Shortlist not found")
    
    if current_user.current_stage == UserStage.ONBOARDING:
        raise HTTPException(status_code=403, detail="Cannot lock during onboarding")
    
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    
    return {"message": "University unlocked. Warning: Application tasks have been removed.", "stage": current_user.current_stage.value}

@app.delete("/api/shortlist/{shortlist_id}")
def remove_from_shortlist(
    shortlist_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    if current_user.current_stage != UserStage.APPLICATION:
        raise HTTPException(status_code=403, detail="Tasks can only be created in APPLICATION stage")
    
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

@app.get("/api/chat/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at).all()
    return [ChatMessageResponse.model_validate(m) for m in messages]

@app.post("/api/chat", response_model=ChatMessageResponse)
async def chat_with_counsellor(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.onboarding_completed and current_user.current_stage == UserStage.ONBOARDING:
        pass
    
    user_message = ChatMessage(
        user_id=current_user.id,
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
    
    actions_taken = []
    for action in response.get('actions', []):
        action_type = action.get('type')
        params = action.get('params', {})
        
        if action_type == 'shortlist_university':
            uni_id = params.get('university_id')
            category = params.get('category', 'TARGET')
            existing = db.query(ShortlistedUniversity).filter(
                ShortlistedUniversity.user_id == current_user.id,
                ShortlistedUniversity.university_id == uni_id
            ).first()
            if not existing and current_user.onboarding_completed:
                shortlist = ShortlistedUniversity(
                    user_id=current_user.id,
                    university_id=uni_id,
                    category=category
                )
                db.add(shortlist)
                actions_taken.append({'type': 'shortlist_university', 'university_id': uni_id})
        
        elif action_type == 'create_task':
            task = Task(
                user_id=current_user.id,
                title=params.get('title', 'New Task'),
                description=params.get('description'),
                priority=params.get('priority', 1)
            )
            db.add(task)
            actions_taken.append({'type': 'create_task', 'title': params.get('title')})
    
    db.commit()
    
    ai_message = ChatMessage(
        user_id=current_user.id,
        role="assistant",
        content=response.get('message', 'I apologize, but I could not process your request.'),
        actions_taken=actions_taken if actions_taken else None
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)
    
    return ChatMessageResponse.model_validate(ai_message)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
