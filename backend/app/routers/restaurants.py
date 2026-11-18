"""Restaurant browsing, reviews, and admin management."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_admin, get_current_user
from app.database import get_db
from app.models.order import Order, OrderStatus
from app.models.restaurant import Restaurant
from app.models.review import Review
from app.models.user import User
from app.schemas.catalog import RestaurantIn, RestaurantOut, ReviewIn, ReviewOut
from app.schemas.common import Page

router = APIRouter()


def _list_query(db: Session, q: str | None, city: str | None, cuisine: str | None, featured: bool | None, include_inactive: bool):
    query = db.query(Restaurant)
    if not include_inactive:
        query = query.filter(Restaurant.is_active.is_(True))
    if q:
        like = f"%{q.strip().lower()}%"
        query = query.filter(or_(func.lower(Restaurant.name).like(like), func.lower(Restaurant.cuisine).like(like)))
    if city:
        query = query.filter(func.lower(Restaurant.city) == city.strip().lower())
    if cuisine:
        query = query.filter(func.lower(Restaurant.cuisine) == cuisine.strip().lower())
    if featured:
        query = query.filter(Restaurant.is_featured.is_(True))
    return query.order_by(Restaurant.is_featured.desc(), Restaurant.rating.desc(), Restaurant.name.asc())


@router.get("", response_model=Page[RestaurantOut])
def list_restaurants(
    q: str | None = None,
    city: str | None = None,
    cuisine: str | None = None,
    featured: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = _list_query(db, q, city, cuisine, featured, include_inactive=False)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{restaurant_id}")
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = (
        db.query(Restaurant)
        .options(joinedload(Restaurant.foods), joinedload(Restaurant.reviews).joinedload(Review.user))
        .filter(Restaurant.id == restaurant_id, Restaurant.is_active.is_(True))
        .one_or_none()
    )
    if restaurant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    data = RestaurantOut.model_validate(restaurant).model_dump()
    seen_foods: set[int] = set()
    data["foods"] = []
    for food in restaurant.foods:
        if not food.is_available or food.id in seen_foods:
            continue
        seen_foods.add(food.id)
        data["foods"].append(
            {
                "id": food.id,
                "name": food.name,
                "description": food.description,
                "price": food.price,
                "discount_price": food.discount_price,
                "effective_price": food.effective_price,
                "image_url": food.image_url,
                "category_id": food.category_id,
                "is_available": food.is_available,
                "is_popular": food.is_popular,
                "prep_time_min": food.prep_time_min,
            }
        )
    data["reviews"] = [
        {
            "id": review.id,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at,
            "author_name": review.user.full_name if review.user else "Customer",
            "food_id": review.food_id,
        }
        for review in sorted(restaurant.reviews, key=lambda row: row.created_at, reverse=True)[:20]
    ]
    return data


@router.post("", response_model=RestaurantOut, status_code=status.HTTP_201_CREATED)
def create_restaurant(payload: RestaurantIn, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    restaurant = Restaurant(**payload.model_dump(), rating=0, review_count=0)
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.put("/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(
    restaurant_id: int,
    payload: RestaurantIn,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    restaurant = db.get(Restaurant, restaurant_id)
    if restaurant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    for key, value in payload.model_dump().items():
        setattr(restaurant, key, value)
    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.delete("/{restaurant_id}")
def delete_restaurant(restaurant_id: int, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    restaurant = db.get(Restaurant, restaurant_id)
    if restaurant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    has_orders = db.query(Order).filter(Order.restaurant_id == restaurant.id).count() > 0
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This restaurant has orders and cannot be deleted. Deactivate it instead.",
        )
    try:
        db.delete(restaurant)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Restaurant could not be deleted") from None
    return {"message": "Restaurant deleted"}


def _refresh_rating(db: Session, restaurant_id: int) -> None:
    restaurant = db.get(Restaurant, restaurant_id)
    if restaurant is None:
        return
    avg, count = db.query(func.avg(Review.rating), func.count(Review.id)).filter(Review.restaurant_id == restaurant_id).one()
    restaurant.rating = round(float(avg or 0), 2)
    restaurant.review_count = int(count or 0)


@router.post("/{restaurant_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    restaurant_id: int,
    payload: ReviewIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.get(Order, payload.order_id)
    if order is None or order.user_id != user.id or order.restaurant_id != restaurant_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can review a restaurant after it delivers your order")
    if order.status != OrderStatus.delivered.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reviews open after the order is delivered")
    if payload.food_id is not None and not any(item.food_id == payload.food_id for item in order.items):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="That item was not part of this order")
    existing = db.query(Review).filter(Review.user_id == user.id, Review.order_id == order.id).one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already reviewed this order")
    review = Review(
        user_id=user.id,
        restaurant_id=restaurant_id,
        food_id=payload.food_id,
        order_id=order.id,
        rating=payload.rating,
        comment=payload.comment.strip(),
    )
    db.add(review)
    db.commit()
    _refresh_rating(db, restaurant_id)
    db.commit()
    db.refresh(review)
    data = ReviewOut.model_validate(review).model_dump()
    data["author_name"] = user.full_name
    return data
