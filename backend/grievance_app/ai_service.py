"""
AI Classification Service — uses Groq API (free) with llama3-8b-8192
Falls back to keyword-based classification if Groq is unavailable.
"""
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

CATEGORIES = [
    "ELECTRICITY", "WATER", "SANITATION", "ROADS",
    "PUBLIC_SERVICES", "HEALTH", "EDUCATION", "OTHER"
]

KEYWORDS = {
    "ELECTRICITY": ["light", "power", "electricity", "bijli", "current", "transformer",
                    "wire", "pole", "voltage", "outage", "blackout", "electric", "meter"],
    "WATER": ["water", "paani", "pipe", "leak", "supply", "drain", "bore", "tap",
              "sewage", "borewell", "drinking water", "nala"],
    "SANITATION": ["garbage", "waste", "dustbin", "clean", "safai", "toilet",
                   "hygiene", "drain", "sewage", "smell", "filth", "kooda"],
    "ROADS": ["road", "pothole", "street", "footpath", "bridge", "signal", "traffic",
              "divider", "construction", "repair", "sadak", "gutter"],
    "HEALTH": ["hospital", "doctor", "medicine", "clinic", "health", "ambulance",
               "disease", "dispensary", "vaccination", "illness"],
    "EDUCATION": ["school", "teacher", "college", "book", "fee", "scholarship",
                  "midday meal", "shiksha", "vidyalaya"],
    "PUBLIC_SERVICES": ["ration", "certificate", "id card", "aadhar", "pension",
                        "subsidy", "government office", "application", "passbook"],
}

PRIORITY_KEYWORDS = {
    "CRITICAL": ["death", "fire", "flood", "emergency", "accident", "collapse",
                 "electrocution", "drowning", "serious", "critical", "urgent", "aag", "maut"],
    "HIGH": ["no water", "no electricity", "broken", "dangerous", "injury",
             "hospital", "school closed", "days", "week"],
    "MEDIUM": ["irregular", "complaint", "issue", "problem", "not working", "delay"],
}


def detect_language(text: str) -> str:
    try:
        from langdetect import detect
        return detect(text)
    except Exception:
        return "en"


def translate_to_english(text: str, source_lang: str) -> str:
    """Basic translation — in production replace with IndicTrans or DeepL free."""
    if source_lang == "en":
        return text
    try:
        import requests
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source_lang}&tl=en&dt=t&q={requests.utils.quote(text)}"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            result = resp.json()
            return "".join([s[0] for s in result[0] if s[0]])
    except Exception as e:
        logger.warning(f"Translation failed: {e}")
    return text


def classify_with_groq(text: str) -> dict:
    """Use Groq (free) to classify complaint."""
    if not settings.GROQ_API_KEY:
        return None
    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        prompt = f"""You are a government grievance classifier for India.
Classify the following citizen complaint into exactly one category and one priority level.

Categories: ELECTRICITY, WATER, SANITATION, ROADS, PUBLIC_SERVICES, HEALTH, EDUCATION, OTHER
Priority: LOW, MEDIUM, HIGH, CRITICAL

Rules:
- CRITICAL = life threatening, emergency, fire, flood, electrocution
- HIGH = essential service failure (no water/power for >24h, dangerous conditions)
- MEDIUM = service degradation, delay, minor damage
- LOW = general suggestion, minor inconvenience

Respond ONLY with valid JSON, no explanation:
{{"category": "CATEGORY_HERE", "priority": "PRIORITY_HERE", "confidence": 0.95, "summary": "One line summary in English"}}

Complaint: {text[:800]}"""

        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=150,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        result["source"] = "groq"
        return result
    except Exception as e:
        logger.warning(f"Groq classification failed: {e}")
        return None


def classify_with_keywords(text: str) -> dict:
    """Fallback keyword-based classifier."""
    text_lower = text.lower()
    scores = {cat: 0 for cat in CATEGORIES}
    for cat, words in KEYWORDS.items():
        for word in words:
            if word in text_lower:
                scores[cat] += 1
    best_cat = max(scores, key=scores.get)
    if scores[best_cat] == 0:
        best_cat = "OTHER"
    confidence = min(0.5 + scores[best_cat] * 0.1, 0.85)

    priority = "LOW"
    for level, words in PRIORITY_KEYWORDS.items():
        for word in words:
            if word in text_lower:
                priority = level
                break
        if priority != "LOW":
            break

    return {
        "category": best_cat,
        "priority": priority,
        "confidence": round(confidence, 2),
        "summary": text[:100],
        "source": "keyword",
    }


def classify_complaint(text: str) -> dict:
    """
    Main entry point. Tries Groq first, falls back to keywords.
    Returns: {category, priority, confidence, summary, source, original_lang, translated_text}
    """
    lang = detect_language(text)
    translated = translate_to_english(text, lang) if lang != "en" else text

    result = classify_with_groq(translated) or classify_with_keywords(translated)
    result["original_lang"] = lang
    result["translated_text"] = translated
    return result
