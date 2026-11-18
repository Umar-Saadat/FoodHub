"""Menu categories."""

import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.catalog import CategoryIn, CategoryOut

router = APIRouter()


def _slug(db: Session, name: str, ignore_id: int | None = None) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "category"
    slug = base
    index = 2
    while True:
        query = db.query(Category).filter(Category.slug == slug)
        if ignore_id is not None:
            query = query.filter(Category.id != ignore_id)
        if query.first() is None:
            return slug
        slug = f"{base}-{index}"
        index += 1


@router.get("", response_model=list[CategoryOut])
def list_categories(restaurant_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Category)
    if restaurant_id is not None:
        query = query.filter((Category.restaurant_id == restaurant_id) | (Category.restaurant_id.is_(None)))
    return query.order_by(Category.name.asc()).all()


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryIn, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    category = Category(**payload.model_dump(), slug=_slug(db, payload.name))
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryIn,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    category.name = payload.name
    category.description = payload.description
    category.image_url = payload.image_url
    category.restaurant_id = payload.restaurant_id
    category.slug = _slug(db, payload.name, ignore_id=category.id)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(category_id: int, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}
