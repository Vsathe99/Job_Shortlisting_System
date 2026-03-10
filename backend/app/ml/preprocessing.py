"""
Text Preprocessing Pipeline using spaCy en_core_web_sm.
Operations: lowercase → stopword removal → tokenization → lemmatization.
IMPORTANT: Never modifies raw_text — always works on a copy.
"""
from functools import lru_cache
from typing import List


@lru_cache(maxsize=1)
def get_nlp():
    """Lazy-load spaCy model (singleton)."""
    import spacy
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        import subprocess, sys
        subprocess.run(
            [sys.executable, "-m", "spacy", "download", "en_core_web_sm"],
            check=True,
        )
        return spacy.load("en_core_web_sm")


def preprocess_text(raw_text: str) -> str:
    """
    Preprocess a COPY of the input text.
    Steps: lowercase → tokenize → remove stopwords/punctuation → lemmatize.
    Returns a cleaned string for embedding.
    """
    nlp = get_nlp()
    text_copy = raw_text  # We work on a variable, not mutating the original

    # Truncate for spaCy limit (1M chars)
    if len(text_copy) > 900_000:
        text_copy = text_copy[:900_000]

    doc = nlp(text_copy.lower())

    tokens: List[str] = []
    for token in doc:
        if (
            token.is_alpha
            and not token.is_stop
            and len(token.lemma_) > 1
        ):
            tokens.append(token.lemma_)

    return " ".join(tokens)


def get_tokens(raw_text: str) -> List[str]:
    """Return list of preprocessed tokens (for skill matching etc.)."""
    nlp = get_nlp()
    text_copy = raw_text[:900_000]
    doc = nlp(text_copy.lower())
    return [
        token.lemma_
        for token in doc
        if token.is_alpha and not token.is_stop and len(token.lemma_) > 1
    ]
