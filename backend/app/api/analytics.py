from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=schemas.AnalyticsOut)
def get_analytics(
    job_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return aggregated recruitment analytics for the current recruiter."""
    base_query = (
        db.query(models.Candidate)
        .join(models.Job)
        .filter(models.Job.owner_id == current_user.id)
    )
    if job_id:
        base_query = base_query.filter(models.Candidate.job_id == job_id)

    candidates = base_query.all()

    total_resumes = len(candidates)
    total_shortlisted = sum(1 for c in candidates if c.candidate_status == "shortlisted")
    total_selected = sum(1 for c in candidates if c.candidate_status == "selected")
    total_rejected = sum(1 for c in candidates if c.candidate_status == "rejected")

    avg_score = (
        sum(c.final_score for c in candidates) / total_resumes
        if total_resumes > 0
        else 0.0
    )

    # Top skills distribution
    all_skills = []
    for c in candidates:
        if c.skills:
            all_skills.extend(c.skills)
    skill_counter = Counter(all_skills)
    top_skills = [
        {"skill": skill, "count": count}
        for skill, count in skill_counter.most_common(15)
    ]

    # Score distribution buckets
    buckets = {"0-25": 0, "25-50": 0, "50-75": 0, "75-100": 0}
    for c in candidates:
        score = c.final_score * 100
        if score < 25:
            buckets["0-25"] += 1
        elif score < 50:
            buckets["25-50"] += 1
        elif score < 75:
            buckets["50-75"] += 1
        else:
            buckets["75-100"] += 1
    score_distribution = [{"range": k, "count": v} for k, v in buckets.items()]

    # Candidates by status
    status_counter = Counter(c.candidate_status for c in candidates)
    candidates_by_status = [
        {"status": k, "count": v} for k, v in status_counter.items()
    ]

    # Candidates per job
    job_counter = Counter(c.job_id for c in candidates)
    jobs = {j.id: j.title for j in db.query(models.Job).filter(
        models.Job.owner_id == current_user.id
    ).all()}
    candidates_by_job = [
        {"job": jobs.get(job_id, f"Job #{job_id}"), "count": count}
        for job_id, count in job_counter.items()
    ]

    return schemas.AnalyticsOut(
        total_resumes=total_resumes,
        total_shortlisted=total_shortlisted,
        total_selected=total_selected,
        total_rejected=total_rejected,
        average_score=round(avg_score, 4),
        top_skills=top_skills,
        score_distribution=score_distribution,
        candidates_by_status=candidates_by_status,
        candidates_by_job=candidates_by_job,
    )
