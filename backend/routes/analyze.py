from fastapi import APIRouter, HTTPException

from models.schemas import AnalyzeRequest, AnalyzeResponse
from services.parser import parse_accessibility_issues
from services.scorer import score_issues
from services.scraper import fetch_html

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    html = request.html
    source_url = None
    page_title = None

    if request.url:
        try:
            fetched = fetch_html(str(request.url))
            html = fetched["html"]
            source_url = fetched["source_url"]
            page_title = fetched["page_title"]
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Unable to fetch URL: {exc}") from exc

    if not html:
        raise HTTPException(status_code=400, detail="Provide html or url")

    issues = parse_accessibility_issues(html)
    return {
        "score": score_issues(issues),
        "issues": issues,
        "html": html,
        "source_url": source_url,
        "page_title": page_title,
    }
