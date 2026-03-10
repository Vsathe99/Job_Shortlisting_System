from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime


# ──────────────────────────────────────────────────
# AUTH SCHEMAS
# ──────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: Optional[str] = None
    role: str = "recruiter"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ──────────────────────────────────────────────────
# JOB SCHEMAS
# ──────────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: List[str] = []
    experience_required: float = 0


class JobOut(BaseModel):
    id: int
    owner_id: int
    title: str
    description: str
    required_skills: List[str]
    experience_required: float
    created_at: datetime
    candidate_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────
# CANDIDATE SCHEMAS
# ──────────────────────────────────────────────────

class CandidateOut(BaseModel):
    id: int
    job_id: int
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    skills: List[str]
    education: List[str]
    experience: List[str]
    certifications: List[str]
    resume_path: Optional[str]
    semantic_similarity: float
    skill_match_score: float
    final_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    candidate_status: str
    shortlist_category: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateFilter(BaseModel):
    job_id: Optional[int] = None
    status: Optional[str] = None
    min_score: Optional[float] = None
    max_score: Optional[float] = None
    skill: Optional[str] = None


# ──────────────────────────────────────────────────
# ANALYTICS SCHEMAS
# ──────────────────────────────────────────────────

class AnalyticsOut(BaseModel):
    total_resumes: int
    total_shortlisted: int
    total_selected: int
    total_rejected: int
    average_score: float
    top_skills: List[dict]
    score_distribution: List[dict]
    candidates_by_status: List[dict]
    candidates_by_job: List[dict]
