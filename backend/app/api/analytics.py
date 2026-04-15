from fastapi import APIRouter, Depends, HTTPException
from collections import Counter
from beanie import PydanticObjectId
from app import schemas
from app.auth import get_current_user
from app.models import User, Job, Candidate

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=schemas.AnalyticsOut)
async def get_analytics(
    job_id: str = None,
    current_user: User = Depends(get_current_user),
):
    """Return aggregated recruitment analytics for the current recruiter."""
    
    # 1. Determine which candidates are accessible
    if job_id:
        # Verify job ownership
        job = await Job.find_one(Job.id == PydanticObjectId(job_id), Job.owner_id == str(current_user.id))
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        candidates = await Candidate.find(Candidate.job_id == job_id).to_list()
    else:
        owned_jobs = await Job.find(Job.owner_id == str(current_user.id)).to_list()
        job_ids = [str(j.id) for j in owned_jobs]
        candidates = await Candidate.find({"job_id": {"$in": job_ids}}).to_list()

    total_resumes = len(candidates)
    total_shortlisted = sum(1 for c in candidates if c.candidate_status == "shortlisted")
    total_selected = sum(1 for c in candidates if c.candidate_status == "selected")
    total_rejected = sum(1 for c in candidates if c.candidate_status == "rejected")

    avg_score = (
        sum(c.final_score for c in candidates) / total_resumes
        if total_resumes > 0
        else 0.0
    )

    # 2. Top skills distribution
    all_skills = []
    for c in candidates:
        if c.skills:
            all_skills.extend(c.skills)
    skill_counter = Counter(all_skills)
    top_skills = [
        {"skill": skill, "count": count}
        for skill, count in skill_counter.most_common(15)
    ]

    # 3. Score distribution buckets
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

    # 4. Candidates by status
    status_counter = Counter(c.candidate_status for c in candidates)
    candidates_by_status = [
        {"status": k, "count": v} for k, v in status_counter.items()
    ]

    # 5. Candidates per job
    job_counter = Counter(c.job_id for c in candidates)
    owned_jobs_list = await Job.find(Job.owner_id == str(current_user.id)).to_list()
    job_titles = {str(j.id): j.title for j in owned_jobs_list}
    
    candidates_by_job = [
        {"job": job_titles.get(jid, f"Job #{jid}"), "count": count}
        for jid, count in job_counter.items()
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
