from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from beanie import PydanticObjectId
from app import schemas
from app.auth import get_current_user
from app.models import User, Job, Candidate
from app.services.faiss_service import faiss_service
import os

router = APIRouter(prefix="/candidates", tags=["Candidates"])


async def _resolve_candidate(candidate_id: str, current_user: User) -> Candidate:
    """Get candidate and verify it belongs to a job owned by current user."""
    # In MongoDB/Beanie, we first get the candidate
    candidate = await Candidate.get(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Then verify job ownership
    job = await Job.find_one(Job.id == PydanticObjectId(candidate.job_id), Job.owner_id == str(current_user.id))
    if not job:
        raise HTTPException(status_code=403, detail="Access denied to this candidate")
        
    return candidate


@router.get("", response_model=List[schemas.CandidateOut])
async def list_candidates(
    job_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    max_score: Optional[float] = Query(None),
    skill: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    """List candidates with optional filters. Sorted by final_score DESC."""
    # Find all job IDs owned by the user if job_id is not specified
    if job_id:
        # Verify job ownership
        job = await Job.find_one(Job.id == PydanticObjectId(job_id), Job.owner_id == str(current_user.id))
        if not job:
            raise HTTPException(status_code=404, detail="Job not found or access denied")
        accessible_job_ids = [job_id]
    else:
        owned_jobs = await Job.find(Job.owner_id == str(current_user.id)).to_list()
        accessible_job_ids = [str(j.id) for j in owned_jobs]

    # Build query
    query_filters: Dict[str, Any] = {"job_id": {"$in": accessible_job_ids}}
    if status:
        query_filters["candidate_status"] = status
    if min_score is not None or max_score is not None:
        score_filter = {}
        if min_score is not None:
            score_filter["$gte"] = min_score
        if max_score is not None:
            score_filter["$lte"] = max_score
        query_filters["final_score"] = score_filter

    candidates = await Candidate.find(query_filters).sort("-final_score").to_list()

    # Skill filter (post-query since skills stored as List)
    if skill:
        skill_lower = skill.lower()
        candidates = [
            c for c in candidates
            if c.skills and any(skill_lower in s.lower() for s in c.skills)
        ]

    return candidates


@router.get("/{candidate_id}", response_model=schemas.CandidateOut)
async def get_candidate(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
):
    return await _resolve_candidate(candidate_id, current_user)


@router.post("/{candidate_id}/select")
async def select_candidate(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
):
    candidate = await _resolve_candidate(candidate_id, current_user)
    candidate.candidate_status = "selected"
    await candidate.save()
    return {"message": "Candidate marked as selected", "status": "selected"}


@router.post("/{candidate_id}/unselect")
async def unselect_candidate(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
):
    candidate = await _resolve_candidate(candidate_id, current_user)
    candidate.candidate_status = "new"
    await candidate.save()
    return {"message": "Candidate unselected", "status": "new"}


@router.post("/{candidate_id}/shortlist")
async def shortlist_candidate(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
):
    candidate = await _resolve_candidate(candidate_id, current_user)
    candidate.candidate_status = "shortlisted"
    await candidate.save()
    return {"message": "Candidate shortlisted", "status": "shortlisted"}


@router.post("/{candidate_id}/reject")
async def reject_candidate(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
):
    candidate = await _resolve_candidate(candidate_id, current_user)
    candidate.candidate_status = "rejected"
    await candidate.save()
    return {"message": "Candidate rejected", "status": "rejected"}


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete candidate, resume file, and remove from FAISS index."""
    candidate = await _resolve_candidate(candidate_id, current_user)

    # Remove resume file
    if candidate.resume_path and os.path.exists(candidate.resume_path):
        try:
            os.remove(candidate.resume_path)
        except OSError:
            pass

    # Remove from FAISS index
    faiss_service.remove_vector(str(candidate.id))

    await candidate.delete()
