from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.faiss_service import faiss_service

router = APIRouter(prefix="/candidates", tags=["Candidates"])


def _resolve_candidate(candidate_id: int, db: Session, current_user: models.User) -> models.Candidate:
    """Get candidate and verify it belongs to a job owned by current user."""
    candidate = db.query(models.Candidate).join(models.Job).filter(
        models.Candidate.id == candidate_id,
        models.Job.owner_id == current_user.id,
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.get("", response_model=List[schemas.CandidateOut])
def list_candidates(
    job_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    max_score: Optional[float] = Query(None),
    skill: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List candidates with optional filters. Sorted by final_score DESC."""
    query = (
        db.query(models.Candidate)
        .join(models.Job)
        .filter(models.Job.owner_id == current_user.id)
    )

    if job_id is not None:
        query = query.filter(models.Candidate.job_id == job_id)
    if status:
        query = query.filter(models.Candidate.candidate_status == status)
    if min_score is not None:
        query = query.filter(models.Candidate.final_score >= min_score)
    if max_score is not None:
        query = query.filter(models.Candidate.final_score <= max_score)

    candidates = query.order_by(models.Candidate.final_score.desc()).all()

    # Skill filter (post-query since skills stored as JSON)
    if skill:
        skill_lower = skill.lower()
        candidates = [
            c for c in candidates
            if c.skills and any(skill_lower in s.lower() for s in c.skills)
        ]

    return candidates


@router.get("/{candidate_id}", response_model=schemas.CandidateOut)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return _resolve_candidate(candidate_id, db, current_user)


@router.post("/{candidate_id}/select")
def select_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    candidate = _resolve_candidate(candidate_id, db, current_user)
    candidate.candidate_status = "selected"
    db.commit()
    return {"message": "Candidate marked as selected", "status": "selected"}


@router.post("/{candidate_id}/unselect")
def unselect_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    candidate = _resolve_candidate(candidate_id, db, current_user)
    candidate.candidate_status = "new"
    db.commit()
    return {"message": "Candidate unselected", "status": "new"}


@router.post("/{candidate_id}/shortlist")
def shortlist_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    candidate = _resolve_candidate(candidate_id, db, current_user)
    candidate.candidate_status = "shortlisted"
    db.commit()
    return {"message": "Candidate shortlisted", "status": "shortlisted"}


@router.post("/{candidate_id}/reject")
def reject_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    candidate = _resolve_candidate(candidate_id, db, current_user)
    candidate.candidate_status = "rejected"
    db.commit()
    return {"message": "Candidate rejected", "status": "rejected"}


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete candidate, resume file, and remove from FAISS index."""
    import os
    candidate = _resolve_candidate(candidate_id, db, current_user)

    # Remove resume file
    if candidate.resume_path and os.path.exists(candidate.resume_path):
        try:
            os.remove(candidate.resume_path)
        except OSError:
            pass

    # Remove from FAISS index
    faiss_service.remove_vector(candidate.id)

    db.delete(candidate)
    db.commit()
