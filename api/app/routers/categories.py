from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.category import CategoryOut
from app.services.category_service import list_categories

router = APIRouter(tags=["categories"])


@router.get("/categories", response_model=list[CategoryOut])
def get_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    """List all task categories. No auth required."""
    return [CategoryOut.model_validate(c) for c in list_categories(db)]
