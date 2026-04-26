from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    html: str | None = None
    url: str | None = None


class FixRequest(BaseModel):
    issue_type: str
    snippet: str
    context: str | None = None


class Issue(BaseModel):
    type: str
    severity: str
    title: str
    snippet: str
    suggestion: str
    count: int = 1


class AnalyzeResponse(BaseModel):
    score: int
    issues: list[Issue]
    html: str
    source_url: str | None = None
    page_title: str | None = None


class FixResponse(BaseModel):
    fixed_html: str
    explanation: str
    confidence: str
