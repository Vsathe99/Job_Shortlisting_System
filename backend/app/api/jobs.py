from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from app import schemas
from app.auth import get_current_user
from app.models import User, Job, Candidate

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("", response_model=schemas.JobOut, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: schemas.JobCreate,
    current_user: User = Depends(get_current_user),
):
    job = Job(
        owner_id=str(current_user.id),
        title=payload.title,
        description=payload.description,
        required_skills=payload.required_skills,
        experience_required=payload.experience_required,
    )
    await job.insert()
    
    out = schemas.JobOut.model_validate(job, from_attributes=True)
    out.candidate_count = 0
    return out


@router.get("", response_model=List[schemas.JobOut])
async def list_jobs(
    current_user: User = Depends(get_current_user),
):
    jobs = await Job.find(Job.owner_id == str(current_user.id)).to_list()
    result = []
    for job in jobs:
        out = schemas.JobOut.model_validate(job, from_attributes=True)
        out.candidate_count = await Candidate.find(Candidate.job_id == str(job.id)).count()
        result.append(out)
    return result


@router.get("/{job_id}", response_model=schemas.JobOut)
async def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    job = await Job.find_one(
        Job.id == job_id,
        Job.owner_id == str(current_user.id),
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    out = schemas.JobOut.model_validate(job, from_attributes=True)
    out.candidate_count = await Candidate.find(Candidate.job_id == str(job.id)).count()
    return out


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    job = await Job.find_one(
        Job.id == job_id,
        Job.owner_id == str(current_user.id),
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Also delete associated candidates
    candidates = await Candidate.find(Candidate.job_id == job_id).to_list()
    for c in candidates:
        await c.delete()
        
    await job.delete()
