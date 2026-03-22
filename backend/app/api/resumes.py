import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from typing import List
from app import schemas
from app.auth import get_current_user
from app.models import User, Job, Candidate
from app.services.resume_service import process_resume

router = APIRouter(tags=["Resumes"])


ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}


@router.post("/upload-resumes", status_code=status.HTTP_201_CREATED)
async def upload_resumes(
    job_id: str = Form(...),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    """Bulk upload resumes (PDF/DOCX) and run the ML pipeline."""
    # Validate job exists and belongs to current recruiter
    job = await Job.find_one(
        Job.id == job_id,
        Job.owner_id == str(current_user.id),
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    results = []
    errors = []

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            errors.append({"file": file.filename, "error": "Unsupported file type"})
            continue

        try:
            candidate = await process_resume(file=file, job=job)
            results.append({
                "file": file.filename,
                "candidate_id": str(candidate.id),
                "name": candidate.name,
                "final_score": round(candidate.final_score, 4),
                "shortlist_category": candidate.shortlist_category,
            })
        except Exception as e:
            errors.append({"file": file.filename, "error": str(e)})

    return {
        "processed": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors,
    }


@router.get("/resumes/{candidate_id}/file")
async def serve_resume_file(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
):
    """Serve the original resume file for the PDF viewer."""
    candidate = await Candidate.get(candidate_id)
    if not candidate or not candidate.resume_path:
        raise HTTPException(status_code=404, detail="Resume file not found")
        
    # Verify job ownership via Candidate ID
    job = await Job.find_one(Job.id == candidate.job_id, Job.owner_id == str(current_user.id))
    if not job:
        raise HTTPException(status_code=403, detail="Access denied to this resume")

    if not os.path.exists(candidate.resume_path):
        raise HTTPException(status_code=404, detail="Resume file missing from storage")

    ext = os.path.splitext(candidate.resume_path)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    return FileResponse(candidate.resume_path, media_type=media_type)
