import os
import uuid
from fastapi import UploadFile
from app.config import settings
from app.models import Job, Candidate
from app.ml.resume_parser import parse_resume
from app.ml.preprocessing import preprocess_text
from app.ml.skill_extractor import extract_skills_from_text, compute_skill_match
from app.ml.embedding_model import embed
from app.ml.similarity_engine import compute_semantic_similarity
from app.ml.ranking_engine import rank_and_categorize
from app.services.faiss_service import faiss_service


async def process_resume(
    file: UploadFile,
    job: Job,
) -> Candidate:
    """
    Full ML pipeline for a single uploaded resume file.
    Returns the persisted Candidate document.
    """
    # ── 1. Read file bytes and save to storage ──────────────────────────
    file_bytes = await file.read()
    ext = os.path.splitext(file.filename)[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(settings.RESUMES_DIR, unique_name)

    os.makedirs(settings.RESUMES_DIR, exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(file_bytes)

    # ── 2. Extract raw text + structured fields ──────────────────────────
    # Note: parse_resume is likely synchronous, fine for now if it's fast enough
    raw_text, parsed = parse_resume(file_bytes, file.filename)

    # ── 3. Extract skills from resume ────────────────────────────────────
    resume_skills = extract_skills_from_text(raw_text)
    parsed["skills"] = resume_skills

    # ── 4. Build job embedding (from raw JD text) ────────────────────────
    job_text = f"{job.title} {job.description} {' '.join(job.required_skills or [])}"
    job_embedding = embed(job_text)

    # ── 5. Build resume embedding (from preprocessed text) ──────────────
    processed_text = preprocess_text(raw_text)
    resume_embedding = embed(processed_text if processed_text.strip() else raw_text)

    # ── 6. Compute semantic similarity ────────────────────────────────────
    semantic_sim = compute_semantic_similarity(resume_embedding, job_embedding)

    # ── 7. Compute skill match score ──────────────────────────────────────
    skill_score, matched_skills, missing_skills = compute_skill_match(
        resume_skills, job.required_skills or []
    )

    # ── 8. Final ranking score + category ────────────────────────────────
    final_score, category = rank_and_categorize(semantic_sim, skill_score)

    # ── 9. Save candidate to database ────────────────────────────────────
    candidate = Candidate(
        job_id=str(job.id),
        name=parsed.get("name"),
        email=parsed.get("email"),
        phone=parsed.get("phone"),
        skills=resume_skills,
        education=parsed.get("education", []),
        experience=parsed.get("experience", []),
        certifications=parsed.get("certifications", []),
        resume_path=save_path,
        raw_resume_text=raw_text,
        parsed_data_json=parsed,
        semantic_similarity=semantic_sim,
        skill_match_score=skill_score,
        final_score=final_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        candidate_status="new",
        shortlist_category=category,
    )
    await candidate.insert()

    # ── 10. Add embedding to FAISS index ─────────────────────────────────
    try:
        faiss_service.add_vector(str(candidate.id), resume_embedding)
    except Exception as e:
        print(f"[FAISS] Warning: could not add vector for candidate {candidate.id}: {e}")

    return candidate
