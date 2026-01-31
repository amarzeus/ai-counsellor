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

class ProgramCategory(str, Enum):
    STEM = "STEM"
    ENGINEERING = "ENGINEERING"
    BUSINESS = "BUSINESS"
    DESIGN = "DESIGN"
    SOCIAL_SCIENCE = "SOCIAL_SCIENCE"
    OTHER = "OTHER"

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
    work_experience_years: Optional[int] = None
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
    work_experience_years: Optional[int] = None
    ielts_toefl_status: Optional[ExamStatus] = None
    gre_gmat_status: Optional[ExamStatus] = None
    sop_status: Optional[SOPStatus] = None
    profile_strength: Optional[str] = None
    
    class Config:
        from_attributes = True

class ProgramResponse(BaseModel):
    id: int
    name: str
    degree_level: str
    department: Optional[str] = None
    
    # Taxonomy
    program_category: Optional[ProgramCategory] = None
    program_discipline: Optional[str] = None
    
    # Duration & Cost
    duration_months: Optional[int] = None
    tuition_per_year_usd: int
    
    # Admission Requirements
    min_gpa: Optional[float] = None
    gpa_scale: Optional[float] = 4.0
    
    # Test Requirements
    ielts_min: Optional[float] = None
    toefl_min: Optional[int] = None
    gre_required: bool = False
    gre_min: Optional[int] = None
    gmat_required: bool = False
    gmat_min: Optional[int] = None
    
    # Experience & Portfolio
    requires_work_experience: bool = False
    min_work_experience_years: Optional[int] = 0
    portfolio_required: bool = False
    
    # Deadlines & Intakes
    intake_terms: Optional[List[str]] = None
    application_deadline_fall: Optional[str] = None
    application_deadline_spring: Optional[str] = None
    
    specializations: Optional[List[str]] = None
    program_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class UniversityResponse(BaseModel):
    id: int
    name: str
    country: str
    city: Optional[str] = None
    tuition_per_year: Optional[int] = None
    
    # Rankings
    qs_ranking: Optional[int] = None
    the_ranking: Optional[int] = None
    us_news_ranking: Optional[int] = None
    ranking: Optional[int] = None  # Legacy, for backward compat
    
    # Details
    official_website: Optional[str] = None
    is_public: Optional[bool] = True
    min_gpa: Optional[float] = None
    programs: Optional[List[str]] = None  # Legacy field
    description: Optional[str] = None
    acceptance_rate: Optional[float] = None
    
    # Data verification
    verified_at: Optional[datetime] = None
    data_source: Optional[str] = None
    
    # AI-computed categorization
    category: Optional[UniversityCategory] = None
    fit_reason: Optional[str] = None
    risk_reason: Optional[str] = None
    cost_level: Optional[str] = None
    acceptance_chance: Optional[str] = None
    
    class Config:
        from_attributes = True

class UniversityDetailResponse(BaseModel):
    """Extended university response with full program details"""
    id: int
    name: str
    country: str
    city: Optional[str] = None
    qs_ranking: Optional[int] = None
    the_ranking: Optional[int] = None
    us_news_ranking: Optional[int] = None
    official_website: Optional[str] = None
    is_public: Optional[bool] = True
    description: Optional[str] = None
    verified_at: Optional[datetime] = None
    data_source: Optional[str] = None
    
    # Full program details
    programs: List[ProgramResponse] = []
    
    # AI categorization
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
    session_id: int
    role: str
    content: str
    actions_taken: Optional[dict] = None  # {executed: [...], blocked: [...], final_stage: str}
    suggested_universities: Optional[List[dict]] = None
    suggested_next_questions: Optional[List[str]] = None
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

class SOPReviewRequest(BaseModel):
    text: str
    university_name: Optional[str] = None
    program_name: Optional[str] = None

class SOPReviewResponse(BaseModel):
    overall_score: int
    strengths: List[str]
    weaknesses: List[str]
    grammar_mistakes: List[str]
    improved_snippet: Optional[str] = None
    ai_feedback: str
