from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserStage(str, Enum):
    ONBOARDING = "ONBOARDING"
    DISCOVERY = "DISCOVERY"
    LOCKED = "LOCKED"
    APPLICATION = "APPLICATION"

class FundingPlan(str, Enum):
    SELF_FUNDED = "SELF_FUNDED"
    SCHOLARSHIP = "SCHOLARSHIP"
    LOAN = "LOAN"

class ExamStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class SOPStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    DRAFT = "DRAFT"
    READY = "READY"

class TaskStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class UniversityCategory(str, Enum):
    DREAM = "DREAM"
    TARGET = "TARGET"
    SAFE = "SAFE"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    current_stage: UserStage
    onboarding_completed: bool
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ProfileUpdate(BaseModel):
    current_education_level: Optional[str] = None
    degree_major: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None
    intended_degree: Optional[str] = None
    field_of_study: Optional[str] = None
    target_intake_year: Optional[int] = None
    preferred_countries: Optional[List[str]] = None
    budget_per_year: Optional[int] = None
    funding_plan: Optional[FundingPlan] = None
    ielts_toefl_status: Optional[ExamStatus] = None
    gre_gmat_status: Optional[ExamStatus] = None
    sop_status: Optional[SOPStatus] = None

class ProfileResponse(BaseModel):
    id: int
    current_education_level: Optional[str] = None
    degree_major: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None
    intended_degree: Optional[str] = None
    field_of_study: Optional[str] = None
    target_intake_year: Optional[int] = None
    preferred_countries: Optional[List[str]] = None
    budget_per_year: Optional[int] = None
    funding_plan: Optional[FundingPlan] = None
    ielts_toefl_status: Optional[ExamStatus] = None
    gre_gmat_status: Optional[ExamStatus] = None
    sop_status: Optional[SOPStatus] = None
    profile_strength: Optional[str] = None
    
    class Config:
        from_attributes = True

class UniversityResponse(BaseModel):
    id: int
    name: str
    country: str
    tuition_per_year: int
    ranking: Optional[int] = None
    min_gpa: Optional[float] = None
    programs: Optional[List[str]] = None
    description: Optional[str] = None
    acceptance_rate: Optional[float] = None
    category: Optional[UniversityCategory] = None
    fit_reason: Optional[str] = None
    risk_reason: Optional[str] = None
    cost_level: Optional[str] = None
    acceptance_chance: Optional[str] = None
    
    class Config:
        from_attributes = True

class ShortlistCreate(BaseModel):
    university_id: int
    category: UniversityCategory

class ShortlistResponse(BaseModel):
    id: int
    university_id: int
    university: UniversityResponse
    category: UniversityCategory
    is_locked: bool
    locked_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[int] = 1
    due_date: Optional[datetime] = None
    shortlisted_university_id: Optional[int] = None

class TaskUpdate(BaseModel):
    status: TaskStatus

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: int
    due_date: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    content: str
    session_id: Optional[int] = None

class ChatSessionCreate(BaseModel):
    title: str

class ChatSessionUpdate(BaseModel):
    title: str

class ChatSessionResponse(BaseModel):
    id: int
    title: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    actions_taken: Optional[dict] = None  # {executed: [...], blocked: [...], final_stage: str}
    created_at: datetime
    
    class Config:
        from_attributes = True

class DashboardResponse(BaseModel):
    user: UserResponse
    profile: Optional[ProfileResponse] = None
    current_stage: UserStage
    profile_strength: dict
    shortlisted_count: int
    locked_count: int
    pending_tasks: int
    next_action: str
