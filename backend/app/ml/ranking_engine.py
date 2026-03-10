"""
Ranking Engine — Computes final candidate score and shortlist category.
final_score = 0.7 * semantic_similarity + 0.3 * skill_match_score
"""
from typing import Tuple
from app.config import settings


def compute_final_score(
    semantic_similarity: float,
    skill_match_score: float,
) -> float:
    """
    Weighted combination of semantic and skill scores.
    Returns: final_score in [0, 1].
    """
    score = (
        settings.SEMANTIC_WEIGHT * semantic_similarity
        + settings.SKILL_WEIGHT * skill_match_score
    )
    return round(float(score), 6)


def categorize_candidate(final_score: float) -> str:
    """
    Assign shortlist category based on final score.
    Returns one of: 'Top Candidate', 'Potential Candidate', 'Low Match'
    """
    if final_score >= settings.TOP_CANDIDATE_THRESHOLD:
        return "Top Candidate"
    elif final_score >= settings.POTENTIAL_CANDIDATE_THRESHOLD:
        return "Potential Candidate"
    else:
        return "Low Match"


def rank_and_categorize(
    semantic_similarity: float,
    skill_match_score: float,
) -> Tuple[float, str]:
    """
    Compute final score and determine shortlist category.
    Returns: (final_score, shortlist_category)
    """
    final_score = compute_final_score(semantic_similarity, skill_match_score)
    category = categorize_candidate(final_score)
    return final_score, category
