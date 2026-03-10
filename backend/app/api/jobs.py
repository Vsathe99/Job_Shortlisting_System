from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("", response_model=schemas.JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    job = models.Job(
        owner_id=current_user.id,
        title=payload.title,
        description=payload.description,
        required_skills=payload.required_skills,
        experience_required=payload.experience_required,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    out = schemas.JobOut.model_validate(job)
    out.candidate_count = len(job.candidates)
    return out


@router.get("", response_model=List[schemas.JobOut])
def list_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    jobs = db.query(models.Job).filter(models.Job.owner_id == current_user.id).all()
    result = []
    for job in jobs:
        out = schemas.JobOut.model_validate(job)
        out.candidate_count = len(job.candidates)
        result.append(out)
    return result


@router.get("/{job_id}", response_model=schemas.JobOut)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    job = db.query(models.Job).filter(
        models.Job.id == job_id,
        models.Job.owner_id == current_user.id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    out = schemas.JobOut.model_validate(job)
    out.candidate_count = len(job.candidates)
    return out


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    job = db.query(models.Job).filter(
        models.Job.id == job_id,
        models.Job.owner_id == current_user.id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
