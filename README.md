# 🧠 TalentAI — AI Resume Shortlisting Platform

A production-ready **Applicant Tracking System (ATS)** powered by **BERT embeddings**, **FAISS vector search**, and **spaCy NLP**.

Built with **FastAPI** (backend) + **React + Tailwind CSS** (frontend) + **Docker Compose** (deployment).

---

## ✨ Features

- 🔐 **JWT Authentication** — register, login, role-based access (recruiter / admin)
- 📋 **Job Management** — create and manage multiple job postings with required skills
- 📄 **Bulk Resume Upload** — drag-and-drop PDF/DOCX bulk upload
- 🤖 **AI Resume Parsing** — PyMuPDF → pdfminer → python-docx two-layer parser
- 🧠 **BERT Embeddings** — `sentence-transformers/all-MiniLM-L6-v2` (384-d)
- ⚡ **FAISS Vector Search** — persistent cosine similarity search index
- 📊 **Intelligent Ranking** — `final_score = 0.7×semantic + 0.3×skill`
- 🎯 **Skill Matching** — 100+ skill dictionary with multi-word regex detection
- 👤 **Candidate Profiles** — full profile with react-pdf resume viewer
- ✅ **Workflow Actions** — select / unselect / shortlist / reject / delete
- 📈 **Analytics Dashboard** — Recharts charts for recruitment insights

---

## 🏗️ Architecture

```
React Frontend (Vite + Tailwind)
        ↓ Axios + JWT
FastAPI Backend
        ↓
┌───────────────────┐  ┌───────────────────┐
│ Auth Service      │  │ Resume Service    │
│ (JWT + bcrypt)    │  │ (Parse+Embed+Rank)│
└───────────────────┘  └──────────┬────────┘
                                  ↓
                    ┌─────────────────────────┐
                    │      ML Pipeline        │
                    │  resume_parser.py       │
                    │  preprocessing.py       │
                    │  skill_extractor.py     │
                    │  embedding_model.py     │
                    │  similarity_engine.py   │
                    │  ranking_engine.py      │
                    └──────────┬──────────────┘
                               ↓
              ┌────────────────────────────────┐
              │   PostgreSQL / SQLite          │
              │   FAISS Vector Index           │
              └────────────────────────────────┘
```

---

## 🚀 Quick Start (Local Dev)

### Prerequisites

- Python 3.11+
- Node.js 20+

### 1. Backend

```bash
cd d:\webcode\job_shortlisting\backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS

# Install dependencies (~5-10 min first time)
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Copy env file
copy ..\\.env.example .env

# Start the server
uvicorn main:app --reload --port 8000
```

API available at: http://localhost:8000  
Swagger UI: http://localhost:8000/docs

### 2. Frontend

```bash
cd d:\webcode\job_shortlisting\frontend

npm install
npm run dev
```

App available at: http://localhost:5173

---

## 🐳 Docker Deployment

```bash
cd d:\webcode\job_shortlisting

# Copy and configure env
copy .env.example .env
# Edit .env: set JWT_SECRET to a strong random string

# Build and start all services
docker compose up --build

# Access:
# App:     http://localhost:3000
# API:     http://localhost:8000
# Swagger: http://localhost:8000/docs
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT |
| GET | `/auth/me` | Get current user |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/jobs` | Create job posting |
| GET | `/jobs` | List all jobs |
| GET | `/jobs/{id}` | Get job details |
| DELETE | `/jobs/{id}` | Delete job |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload-resumes` | Bulk resume upload (multipart) |
| GET | `/resumes/{id}/file` | Serve original resume file |

### Candidates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/candidates` | List candidates (filterable) |
| GET | `/candidates/{id}` | Get candidate profile |
| POST | `/candidates/{id}/select` | Mark as selected |
| POST | `/candidates/{id}/unselect` | Unmark selection |
| POST | `/candidates/{id}/shortlist` | Shortlist candidate |
| POST | `/candidates/{id}/reject` | Reject candidate |
| DELETE | `/candidates/{id}` | Delete candidate + file + FAISS vector |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics` | Recruitment analytics |

---

## 🧪 Testing the API

```bash
# 1. Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter@test.com","password":"Test1234","role":"recruiter"}'

# 2. Login → save token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter@test.com","password":"Test1234"}' | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 3. Create job
curl -X POST http://localhost:8000/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"ML Engineer","description":"Build ML pipelines","required_skills":["Python","BERT","Docker"],"experience_required":2}'

# 4. Upload resumes
curl -X POST http://localhost:8000/upload-resumes \
  -H "Authorization: Bearer $TOKEN" \
  -F "job_id=1" \
  -F "files=@resume1.pdf" \
  -F "files=@resume2.pdf"

# 5. Get ranked candidates
curl "http://localhost:8000/candidates?job_id=1" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
```

---

## 📁 Project Structure

```
job_shortlisting/
├── backend/
│   ├── main.py                    # FastAPI app entry
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── storage/
│   │   └── resumes/               # Uploaded resume files
│   └── app/
│       ├── config.py              # Settings
│       ├── database.py            # SQLAlchemy engine
│       ├── models.py              # ORM models (User, Job, Candidate)
│       ├── schemas.py             # Pydantic schemas
│       ├── auth.py                # JWT utilities
│       ├── api/
│       │   ├── auth.py            # /auth/* routes
│       │   ├── jobs.py            # /jobs/* routes
│       │   ├── resumes.py         # /upload-resumes route
│       │   ├── candidates.py      # /candidates/* routes
│       │   └── analytics.py      # /analytics route
│       ├── ml/
│       │   ├── resume_parser.py   # PDF/DOCX text extraction
│       │   ├── preprocessing.py   # spaCy NLP pipeline
│       │   ├── skill_extractor.py # Skill dictionary matching
│       │   ├── embedding_model.py # BERT sentence-transformers
│       │   ├── similarity_engine.py # Cosine similarity
│       │   └── ranking_engine.py  # Final score formula
│       └── services/
│           ├── resume_service.py  # Pipeline orchestrator
│           └── faiss_service.py   # FAISS vector index
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── src/
│       ├── App.jsx                # Router
│       ├── index.css              # Global styles + design system
│       ├── api/client.js          # Axios + JWT interceptor
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── Badges.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx
│           ├── JobCreate.jsx
│           ├── ResumeUpload.jsx
│           ├── CandidateRanking.jsx
│           ├── CandidateProfile.jsx
│           └── Analytics.jsx
├── nginx/nginx.conf               # Reverse proxy config
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔒 Security Notes

- Change `JWT_SECRET` to a strong random value (min 32 chars) in production
- Use PostgreSQL (not SQLite) in production
- Set `DEBUG=false` in production
- Use HTTPS with a valid SSL certificate behind Nginx

---

## 🎯 Ranking Algorithm

```
final_score = 0.7 × semantic_similarity + 0.3 × skill_match_score

Categories:
  Top Candidate       → final_score ≥ 0.75
  Potential Candidate → final_score ≥ 0.50
  Low Match           → final_score < 0.50
```

---

## 🛠️ Troubleshooting

**spaCy model not found:**
```bash
python -m spacy download en_core_web_sm
```

**BERT model download slow:**
The model downloads once (~90MB) and is cached. Subsequent runs are instant.

**Large file uploads timeout:**
Increase `client_max_body_size` in nginx.conf and `timeout` in uvicorn.

**FAISS import error:**
```bash
pip install faiss-cpu
```
