from datetime import datetime
from typing import List, Optional, Dict, Any
from beanie import Document, Indexed
from pydantic import Field


class User(Document):
    email: Indexed(str, unique=True)
    password_hash: str
    full_name: Optional[str] = None
    role: str = "recruiter"  # recruiter | admin
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"


class Job(Document):
    owner_id: str  # Beanie stores as string or Link
    title: str
    description: str
    required_skills: List[str] = []
    experience_required: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "jobs"


class Candidate(Document):
    job_id: str
    
    # Parsed info
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    education: List[str] = []
    experience: List[str] = []
    certifications: List[str] = []

    # Storage
    resume_path: Optional[str] = None
    raw_resume_text: Optional[str] = None
    parsed_data_json: Dict[str, Any] = {}

    # ML scores
    semantic_similarity: float = 0.0
    skill_match_score: float = 0.0
    final_score: float = 0.0
    matched_skills: List[str] = []
    missing_skills: List[str] = []

    # Status management
    candidate_status: str = "new"
    # Options: new | selected | shortlisted | rejected
    shortlist_category: Optional[str] = None
    # Options: Top Candidate | Potential Candidate | Low Match

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "candidates"
