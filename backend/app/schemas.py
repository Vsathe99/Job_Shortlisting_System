from pydantic import BaseModel, EmailStr, Field, BeforeValidator, ConfigDict
from typing import List, Optional, Any, Annotated
from datetime import datetime

# Helper to convert MongoDB ObjectId to string
PyObjectId = Annotated[str, BeforeValidator(str)]

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
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: PyObjectId = Field(validation_alias="_id")
    email: str
    full_name: Optional[str]
    role: str
    created_at: datetime


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
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: PyObjectId = Field(validation_alias="_id")
    owner_id: str
    title: str
    description: str
    required_skills: List[str]
    experience_required: float
    created_at: datetime
    candidate_count: Optional[int] = 0


# ──────────────────────────────────────────────────
# CANDIDATE SCHEMAS
# ──────────────────────────────────────────────────

class CandidateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: PyObjectId = Field(validation_alias="_id")
    job_id: str
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


class CandidateFilter(BaseModel):
    job_id: Optional[str] = None
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
