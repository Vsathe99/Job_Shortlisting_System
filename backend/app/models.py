from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="recruiter")  # recruiter | admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    jobs = relationship("Job", back_populates="owner", cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(JSON, default=list)   # List[str]
    experience_required = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="jobs")
    candidates = relationship("Candidate", back_populates="job", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)

    # Parsed info
    name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    skills = Column(JSON, default=list)           # List[str]
    education = Column(JSON, default=list)        # List[str]
    experience = Column(JSON, default=list)       # List[str]
    certifications = Column(JSON, default=list)   # List[str]

    # Storage
    resume_path = Column(String(500))
    raw_resume_text = Column(Text)
    parsed_data_json = Column(JSON, default=dict)

    # ML scores
    semantic_similarity = Column(Float, default=0.0)
    skill_match_score = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)

    # Status management
    candidate_status = Column(String(50), default="new")
    # Options: new | selected | shortlisted | rejected
    shortlist_category = Column(String(50))
    # Options: Top Candidate | Potential Candidate | Low Match

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    job = relationship("Job", back_populates="candidates")
