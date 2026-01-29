from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

class UserStage(str, enum.Enum):
    ONBOARDING = "ONBOARDING"
    DISCOVERY = "DISCOVERY"
    LOCKED = "LOCKED"
    APPLICATION = "APPLICATION"

class FundingPlan(str, enum.Enum):
    SELF_FUNDED = "SELF_FUNDED"
    SCHOLARSHIP = "SCHOLARSHIP"
    LOAN = "LOAN"

class ExamStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class SOPStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    DRAFT = "DRAFT"
    READY = "READY"

class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class UniversityCategory(str, enum.Enum):
    DREAM = "DREAM"
    TARGET = "TARGET"
    SAFE = "SAFE"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    google_id = Column(String(255), unique=True, nullable=True)
    current_stage = Column(Enum(UserStage), default=UserStage.ONBOARDING)
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    shortlisted_universities = relationship("ShortlistedUniversity", back_populates="user")
    tasks = relationship("Task", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    current_education_level = Column(String(100))
    degree_major = Column(String(255))
    graduation_year = Column(Integer)
    gpa = Column(Float)
    
    intended_degree = Column(String(100))
    field_of_study = Column(String(255))
    target_intake_year = Column(Integer)
    preferred_countries = Column(JSON)
    
    budget_per_year = Column(Integer)
    funding_plan = Column(Enum(FundingPlan))
    
    ielts_toefl_status = Column(Enum(ExamStatus), default=ExamStatus.NOT_STARTED)
    gre_gmat_status = Column(Enum(ExamStatus), default=ExamStatus.NOT_STARTED)
    sop_status = Column(Enum(SOPStatus), default=SOPStatus.NOT_STARTED)
    
    profile_strength = Column(String(50))
    
    user = relationship("User", back_populates="profile")

class University(Base):
    __tablename__ = "universities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    country = Column(String(100), nullable=False)
    tuition_per_year = Column(Integer, nullable=False)
    ranking = Column(Integer)
    min_gpa = Column(Float)
    programs = Column(JSON)
    description = Column(Text)
    acceptance_rate = Column(Float)
    
    shortlisted_by = relationship("ShortlistedUniversity", back_populates="university")

class ShortlistedUniversity(Base):
    __tablename__ = "shortlisted_universities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    university_id = Column(Integer, ForeignKey("universities.id"))
    category = Column(Enum(UniversityCategory))
    is_locked = Column(Boolean, default=False)
    locked_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="shortlisted_universities")
    university = relationship("University", back_populates="shortlisted_by")
    tasks = relationship("Task", back_populates="shortlisted_university")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    shortlisted_university_id = Column(Integer, ForeignKey("shortlisted_universities.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    priority = Column(Integer, default=1)
    due_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="tasks")
    shortlisted_university = relationship("ShortlistedUniversity", back_populates="tasks")

    user = relationship("User", back_populates="tasks")
    shortlisted_university = relationship("ShortlistedUniversity", back_populates="tasks")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    actions_taken = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("ChatSession", back_populates="messages")
