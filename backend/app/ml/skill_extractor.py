"""
Skill Extractor — dictionary-based skill matching with spaCy support.
Extracts skills from resume text and job descriptions, then computes skill_match_score.
"""
import re
from typing import List, Tuple, Dict

# Comprehensive skill dictionary
SKILL_DICTIONARY = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "c", "go", "golang",
    "rust", "swift", "kotlin", "ruby", "php", "scala", "r", "matlab", "perl",
    "shell", "bash", "powershell", "dart", "lua", "haskell", "elixir", "clojure",

    # Web Frameworks
    "react", "angular", "vue", "nextjs", "nuxt", "svelte", "django", "flask",
    "fastapi", "spring", "express", "nodejs", "rails", "laravel", "symfony",
    "asp.net", "fastify", "nest.js", "nestjs",

    # Data Science / ML
    "machine learning", "deep learning", "nlp", "natural language processing",
    "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn",
    "pandas", "numpy", "scipy", "matplotlib", "seaborn", "plotly",
    "bert", "transformers", "huggingface", "spacy", "nltk", "openai",
    "llm", "gpt", "embedding", "faiss", "langchain",

    # Databases
    "sql", "mysql", "postgresql", "postgres", "sqlite", "mongodb", "redis",
    "elasticsearch", "cassandra", "dynamodb", "oracle", "firebase", "supabase",
    "neo4j", "influxdb", "clickhouse",

    # Cloud / DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
    "terraform", "ansible", "jenkins", "github actions", "ci/cd", "devops",
    "linux", "nginx", "apache", "grafana", "prometheus", "airflow",

    # Data Engineering
    "spark", "hadoop", "kafka", "hive", "flink", "dbt", "airflow", "luigi",
    "etl", "data pipeline", "data warehouse", "snowflake", "bigquery", "redshift",

    # APIs / Architecture
    "rest", "graphql", "grpc", "microservices", "api", "websocket",
    "rabbitmq", "celery", "redis queue",

    # Tools
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "figma",
    "postman", "swagger", "vscode",

    # Soft Skills / Methods
    "agile", "scrum", "kanban", "tdd", "oop", "design patterns",
}

# Multi-word skill patterns for regex matching
MULTI_WORD_SKILLS = [
    s for s in SKILL_DICTIONARY if " " in s
]


def _normalize(text: str) -> str:
    return text.lower().strip()


def extract_skills_from_text(text: str) -> List[str]:
    """
    Extract skills from text using dictionary matching.
    Returns a list of found skills (lowercase, deduplicated).
    """
    text_lower = text.lower()
    found = set()

    # Multi-word first (to avoid partial matches)
    for skill in MULTI_WORD_SKILLS:
        if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
            found.add(skill)

    # Single-word skills
    words = set(re.findall(r'\b[a-z][a-z0-9\+\#\.]*\b', text_lower))
    for skill in SKILL_DICTIONARY:
        if " " not in skill and skill in words:
            found.add(skill)

    return sorted(found)


def compute_skill_match(
    resume_skills: List[str],
    required_skills: List[str],
) -> Tuple[float, List[str], List[str]]:
    """
    Compute skill match score.
    Returns: (score 0-1, matched_skills, missing_skills)
    """
    if not required_skills:
        return 1.0, [], []

    required_norm = {_normalize(s) for s in required_skills}
    resume_norm = {_normalize(s) for s in resume_skills}

    matched = required_norm & resume_norm
    missing = required_norm - resume_norm

    score = len(matched) / len(required_norm) if required_norm else 1.0

    return round(score, 4), sorted(matched), sorted(missing)
