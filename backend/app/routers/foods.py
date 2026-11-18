"""Food catalog search and admin management."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, case, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.category import Category
from app.models.food import Food
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.catalog import FoodIn, FoodOut
from app.schemas.common import Page

router = APIRouter()


def _effective_price():
    return case(
        (and_(Food.discount_price.is_not(None), Food.discount_price < Food.price), Food.discount_price),
        else_=Food.price,
    )


def _serialize(food: Food) -> dict:
    data = FoodOut.model_validate(food).model_dump()
    data["restaurant_name"] = food.restaurant.name if food.restaurant else None
    data["restaurant_city"] = food.restaurant.city if food.restaurant else None
    return data


@router.get("", response_model=Page[FoodOut])
def list_foods(
    q: str | None = None,
    category_id: int | None = None,
    restaurant_id: int | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    popular: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    price = _effective_price()
    query = (
        db.query(Food)
        .join(Restaurant)
        .options(joinedload(Food.restaurant))
        .filter(Food.is_available.is_(True), Restaurant.is_active.is_(True))
    )
    if q:
        like = f"%{q.strip().lower()}%"
        query = query.filter(or_(func.lower(Food.name).like(like), func.lower(Food.description).like(like)))
    if category_id is not None:
        query = query.filter(Food.category_id == category_id)
    if restaurant_id is not None:
        query = query.filter(Food.restaurant_id == restaurant_id)
    if min_price is not None:
        query = query.filter(price >= min_price)
    if max_price is not None:
        query = query.filter(price <= max_price)
    if popular:
        query = query.filter(Food.is_popular.is_(True))
    total = query.count()
    items = query.order_by(Food.is_featured.desc(), Food.name.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_serialize(food) for food in items], "total": total, "page": page, "page_size": page_size}


@router.get("/{food_id}")
def get_food(food_id: int, db: Session = Depends(get_db)):
    food = (
        db.query(Food)
        .options(joinedload(Food.restaurant), joinedload(Food.category))
        .filter(Food.id == food_id)
        .one_or_none()
    )
    if food is None or food.restaurant is None or not food.restaurant.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food item not found")
    data = _serialize(food)
    data["restaurant"] = {
        "id": food.restaurant.id,
        "name": food.restaurant.name,
        "cuisine": food.restaurant.cuisine,
        "delivery_fee": food.restaurant.delivery_fee,
        "delivery_time_min": food.restaurant.delivery_time_min,
        "rating": food.restaurant.rating,
        "city": food.restaurant.city,
    }
    data["category_name"] = food.category.name if food.category else None
    return data


def _validate_links(db: Session, payload: FoodIn) -> None:
    if db.get(Restaurant, payload.restaurant_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Restaurant not found")
    if payload.category_id is not None and db.get(Category, payload.category_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")
    if payload.discount_price is not None and payload.discount_price >= payload.price:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount price must be lower than the regular price")


@router.post("", response_model=FoodOut, status_code=status.HTTP_201_CREATED)
def create_food(payload: FoodIn, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    _validate_links(db, payload)
    food = Food(**payload.model_dump())
    db.add(food)
    db.commit()
    db.refresh(food)
    food = db.query(Food).options(joinedload(Food.restaurant)).filter(Food.id == food.id).one()
    return _serialize(food)


@router.put("/{food_id}", response_model=FoodOut)
def update_food(food_id: int, payload: FoodIn, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    food = db.get(Food, food_id)
    if food is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food item not found")
    _validate_links(db, payload)
    for key, value in payload.model_dump().items():
        setattr(food, key, value)
    db.commit()
    food = db.query(Food).options(joinedload(Food.restaurant)).filter(Food.id == food.id).one()
    return _serialize(food)


@router.delete("/{food_id}")
def delete_food(food_id: int, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    food = db.get(Food, food_id)
    if food is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food item not found")
    db.delete(food)
    db.commit()
    return {"message": "Food item deleted"}
