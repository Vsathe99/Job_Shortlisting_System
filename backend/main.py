"""
FastAPI Application Entry Point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.api import auth, jobs, resumes, candidates, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events."""
    # Create DB tables
    Base.metadata.create_all(bind=engine)

    # Initialize FAISS index
    try:
        from app.services.faiss_service import faiss_service
        faiss_service.initialize()
        print("[STARTUP] FAISS index initialized.")
    except Exception as e:
        print(f"[STARTUP] FAISS init warning: {e}")

    # Pre-load BERT model in background (optional warm-up)
    try:
        from app.ml.embedding_model import get_model
        get_model()
        print("[STARTUP] BERT embedding model loaded.")
    except Exception as e:
        print(f"[STARTUP] BERT model warning: {e}")

    yield

    print("[SHUTDOWN] Application shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Applicant Tracking System with BERT embeddings and FAISS vector search.",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routers ──────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(resumes.router)
app.include_router(candidates.router)
app.include_router(analytics.router)


# ── Static files (serve uploaded resumes) ────────────────────────────────────
os.makedirs(settings.RESUMES_DIR, exist_ok=True)
app.mount("/storage", StaticFiles(directory=settings.STORAGE_DIR), name="storage")


@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
