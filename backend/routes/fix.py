from fastapi import APIRouter

from models.schemas import FixRequest, FixResponse
from services.ai_fixer import suggest_fix

router = APIRouter()


@router.post("/fix", response_model=FixResponse)
def fix(request: FixRequest):
    return suggest_fix(request.issue_type, request.snippet, request.context)
