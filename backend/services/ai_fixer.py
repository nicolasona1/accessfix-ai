import os
import json
import re

import requests
from openai import OpenAI, OpenAIError, RateLimitError


SYSTEM_PROMPT = """You are AccessFix AI, an accessibility repair assistant for developers.
Return only valid JSON with fixed_html, explanation, and confidence.
Fix only the provided HTML snippet.
Do not return a full HTML document unless the provided snippet is already a full HTML document.
Mark AI-generated image alt text with data-ai-suggested="true".
Never claim image contents are certain if the snippet lacks visual context; use cautious, reviewable alt text."""


def _guess_alt(snippet: str) -> str:
    src_match = re.search(r'src=["\']?([^"\'\s>]+)', snippet, re.IGNORECASE)
    src = src_match.group(1).lower() if src_match else ""
    if "logo" in src:
        return "Company logo"
    if "team" in src:
        return "Team photo"
    if "hero" in src:
        return "Featured image"
    return "Descriptive image"


def _repair_first_line(issue_type: str, line: str) -> str:
    stripped = line.strip()

    if issue_type in {"missing-alt", "empty-alt"} and "<img" in stripped.lower():
        without_empty_alt = re.sub(r'\salt=["\']{2}', "", stripped, flags=re.IGNORECASE)
        if re.search(r"\salt=", without_empty_alt, re.IGNORECASE):
            return without_empty_alt
        return re.sub(
            r"<img\b",
            f'<img alt="{_guess_alt(stripped)}" data-ai-suggested="true"',
            without_empty_alt,
            count=1,
            flags=re.IGNORECASE,
        )

    if issue_type == "unlabeled-button" and "<button" in stripped.lower():
        if re.search(r">\s*</button>", stripped, re.IGNORECASE):
            return re.sub(r">\s*</button>", ">Submit form</button>", stripped, flags=re.IGNORECASE)
        if "aria-label" not in stripped.lower():
            return re.sub(r"<button\b", '<button aria-label="Submit form"', stripped, count=1, flags=re.IGNORECASE)

    if issue_type == "generic-link" and "<a" in stripped.lower():
        return re.sub(r">[^<]*(click here|read more|here|more)[^<]*<", ">Learn more about this page<", stripped, count=1, flags=re.IGNORECASE)

    if issue_type == "missing-label" and re.search(r"<(input|select|textarea)\b", stripped, re.IGNORECASE):
        label = "Form field"
        placeholder = re.search(r'placeholder=["\']([^"\']+)["\']', stripped, re.IGNORECASE)
        if placeholder:
            label = placeholder.group(1)
        if "aria-label" not in stripped.lower():
            return re.sub(r"<(input|select|textarea)\b", rf'<\1 aria-label="{label}"', stripped, count=1, flags=re.IGNORECASE)

    if issue_type == "heading-order":
        return re.sub(r"<h([3-6])\b([^>]*)>(.*?)</h\1>", r"<h2\2>\3</h2>", stripped, count=1, flags=re.IGNORECASE)

    if issue_type == "missing-lang" and stripped.lower().startswith("<html"):
        if " lang=" not in stripped.lower():
            return re.sub(r"<html\b", '<html lang="en"', stripped, count=1, flags=re.IGNORECASE)

    if issue_type == "missing-role" and re.search(r"<(div|span)\b", stripped, re.IGNORECASE):
        fixed = stripped
        if "role=" not in fixed.lower():
            fixed = re.sub(r"<(div|span)\b", r'<\1 role="button"', fixed, count=1, flags=re.IGNORECASE)
        if "tabindex=" not in fixed.lower():
            fixed = re.sub(r"<(div|span)\b", r'<\1 tabindex="0"', fixed, count=1, flags=re.IGNORECASE)
        return fixed

    return stripped


def fallback_fixed_html(issue_type: str, snippet: str) -> str:
    lines = [line for line in snippet.splitlines() if line.strip()]
    if not lines:
        return snippet

    fixed_lines = [_repair_first_line(issue_type, line) for line in lines]
    return "\n".join(fixed_lines)


def fallback_fix(issue_type: str, snippet: str, reason: str) -> dict:
    return {
        "fixed_html": fallback_fixed_html(issue_type, snippet),
        "explanation": reason,
        "confidence": "Local Fix",
    }


def is_full_document(html: str) -> bool:
    lowered = html.lower()
    return "<!doctype" in lowered or "<body" in lowered or "</body>" in lowered


def is_too_broad_fix(snippet: str, fixed_html: str) -> bool:
    if is_full_document(fixed_html) and not is_full_document(snippet):
        return True
    if len(fixed_html) > max(900, len(snippet) * 3):
        return True
    return False


def normalize_confidence(value, provider_label: str) -> str:
    if provider_label == "Local AI":
        return "Local AI"
    if provider_label == "OpenAI":
        return "OpenAI"
    if isinstance(value, (int, float)):
        return provider_label
    text = str(value or "").strip()
    if re.fullmatch(r"0?\.\d+|1(?:\.0+)?", text):
        return provider_label
    return text or provider_label


def normalize_fix_payload(payload: dict, snippet: str, confidence: str) -> dict:
    return {
        "fixed_html": str(payload.get("fixed_html", snippet)),
        "explanation": str(payload.get("explanation", "Suggested an accessibility-focused repair for this snippet.")),
        "confidence": normalize_confidence(payload.get("confidence"), confidence),
    }


def try_openai_fix(issue_type: str, snippet: str, context: str | None = None) -> dict | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Issue: {issue_type}\nSnippet: {snippet}\nContext: {context or ''}"},
            ],
        )
        payload = json.loads(response.choices[0].message.content or "{}")
        return normalize_fix_payload(payload, snippet, "OpenAI")
    except (RateLimitError, OpenAIError, json.JSONDecodeError, KeyError, TypeError):
        return None


def try_ollama_fix(issue_type: str, snippet: str, context: str | None = None) -> dict | None:
    model = os.getenv("OLLAMA_MODEL", "llama3.2")
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    prompt = f"""{SYSTEM_PROMPT}

Issue: {issue_type}
Snippet: {snippet}
Context: {context or ""}

Return JSON only."""

    try:
        response = requests.post(
            f"{base_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.2},
            },
            timeout=18,
        )
        if response.status_code != 200:
            return None

        data = response.json()
        raw = data.get("response", "{}")
        payload = json.loads(raw)
        normalized = normalize_fix_payload(payload, snippet, "Local AI")
        if normalized["fixed_html"].strip() == snippet.strip():
            return None
        if is_too_broad_fix(snippet, normalized["fixed_html"]):
            normalized["fixed_html"] = fallback_fixed_html(issue_type, snippet)
            normalized["explanation"] = f"{normalized['explanation']} Focused the generated fix to the affected snippet for review."
        return normalized
    except (requests.RequestException, json.JSONDecodeError, KeyError, TypeError, ValueError):
        return None


def suggest_fix(issue_type: str, snippet: str, context: str | None = None) -> dict:
    openai_fix = try_openai_fix(issue_type, snippet, context)
    if openai_fix:
        return openai_fix

    ollama_fix = try_ollama_fix(issue_type, snippet, context)
    if ollama_fix:
        return ollama_fix

    if os.getenv("OPENAI_API_KEY"):
        return fallback_fix(
            issue_type,
            snippet,
            "Model services were unavailable in this demo environment. Showing a reviewable local accessibility fix.",
        )

    return fallback_fix(
        issue_type,
        snippet,
        "No model service is configured. Showing a reviewable local accessibility fix.",
    )
