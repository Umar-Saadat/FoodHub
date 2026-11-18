"""Administrator analytics and account management. Every route checks the admin role."""

import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_admin
from app.core.security import hash_password
from app.database import UPLOAD_DIR, get_db
from app.models.driver import Driver
from app.models.food import Food
from app.models.order import Order
from app.models.payment import Payment, PaymentStatus
from app.models.promotion import Promotion
from app.models.restaurant import Restaurant
from app.models.user import User, UserRole
from app.schemas.auth import UserOut
from app.schemas.driver import PromotionIn, PromotionOut
from app.schemas.user import AdminUserCreate, AdminUserUpdate
from app.services.order_service import load_order, serialize_order

router = APIRouter()


def _ensure_driver(db: Session, user: User, vehicle_type: str | None, license_plate: str | None) -> None:
    if user.role != UserRole.driver.value:
        return
    profile = db.query(Driver).filter(Driver.user_id == user.id).one_or_none()
    if profile is None:
        db.add(
            Driver(
                user_id=user.id,
                vehicle_type=vehicle_type or "motorbike",
                license_plate=license_plate or "",
                is_available=True,
            )
        )
    else:
        if vehicle_type is not None:
            profile.vehicle_type = vehicle_type
        if license_plate is not None:
            profile.license_plate = license_plate


@router.get("/dashboard")
def dashboard(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.status == PaymentStatus.paid.value).scalar()
    )
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    pending_orders = db.query(func.count(Order.id)).filter(Order.status.in_(["pending", "confirmed", "preparing"])).scalar() or 0
    completed_orders = db.query(func.count(Order.id)).filter(Order.status == "delivered").scalar() or 0
    since = datetime.now(UTC) - timedelta(days=6)
    grouped = (
        db.query(func.date(Payment.paid_at), func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == PaymentStatus.paid.value, Payment.paid_at.is_not(None), Payment.paid_at >= since)
        .group_by(func.date(Payment.paid_at))
        .all()
    )
    totals = {str(day): float(amount) for day, amount in grouped}
    revenue_by_day = []
    for offset in range(6, -1, -1):
        day = (datetime.now(UTC) - timedelta(days=offset)).date().isoformat()
        revenue_by_day.append({"date": day, "amount": round(totals.get(day, 0.0), 2)})
    from app.models.order import OrderItem

    recent_rows = db.query(Order).order_by(Order.created_at.desc()).limit(6).all()
    recent_orders = []
    for row in recent_rows:
        loaded = load_order(db, row.id)
        if loaded:
            recent_orders.append(serialize_order(loaded))
    sold_rows = (
        db.query(OrderItem.name, func.sum(OrderItem.quantity))
        .group_by(OrderItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )
    if sold_rows:
        popular_foods = [{"name": name, "orders": int(qty)} for name, qty in sold_rows]
    else:
        featured = db.query(Food).filter(Food.is_popular.is_(True)).order_by(Food.name.asc()).limit(5).all()
        popular_foods = [{"name": food.name, "orders": 0} for food in featured]
    recent_user_rows = (
        db.query(User)
        .options(joinedload(User.driver_profile))
        .filter(User.role != UserRole.admin.value)
        .order_by(User.created_at.desc())
        .limit(6)
        .all()
    )
    recent_users = []
    for u in recent_user_rows:
        data = UserOut.model_validate(u).model_dump()
        data["created_at"] = u.created_at
        if u.driver_profile:
            data["vehicle_type"] = u.driver_profile.vehicle_type
            data["license_plate"] = u.driver_profile.license_plate
            data["is_available"] = u.driver_profile.is_available
        recent_users.append(data)

    return {
        "total_revenue": round(float(total_revenue or 0), 2),
        "total_orders": int(total_orders),
        "total_users": db.query(func.count(User.id)).filter(User.role != UserRole.admin.value).scalar() or 0,
        "total_restaurants": db.query(func.count(Restaurant.id)).scalar() or 0,
        "total_foods": db.query(func.count(Food.id)).scalar() or 0,
        "pending_orders": int(pending_orders),
        "completed_orders": int(completed_orders),
        "revenue_by_day": revenue_by_day,
        "recent_orders": recent_orders,
        "popular_foods": popular_foods,
        "recent_users": recent_users,
    }


@router.get("/users")
def list_users(
    q: str | None = None,
    role: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User).options(joinedload(User.driver_profile))
    if q:
        like = f"%{q.strip().lower()}%"
        query = query.filter(func.lower(User.full_name).like(like) | func.lower(User.email).like(like))
    if role:
        query = query.filter(User.role == role)
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = []
    for user in users:
        data = UserOut.model_validate(user).model_dump()
        data["created_at"] = user.created_at
        if user.driver_profile:
            data["vehicle_type"] = user.driver_profile.vehicle_type
            data["license_plate"] = user.driver_profile.license_plate
            data["is_available"] = user.driver_profile.is_available
        items.append(data)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(payload: AdminUserCreate, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        phone=payload.phone,
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.flush()
    _ensure_driver(db, user, payload.vehicle_type, payload.license_plate)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id and payload.role and payload.role != UserRole.admin.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot remove your own admin access")
    if user.id == admin.id and payload.is_active is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own account")
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    _ensure_driver(db, user, payload.vehicle_type, payload.license_plate)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.delete("/users/{user_id}")
def deactivate_user(user_id: int, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own account")
    user.is_active = False
    db.commit()
    return {"message": "User deactivated"}


@router.get("/orders")
def admin_orders(
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Order)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    total = query.count()
    rows = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = []
    for row in rows:
        loaded = load_order(db, row.id)
        if loaded:
            item = serialize_order(loaded)
            customer = db.get(User, loaded.user_id)
            item["customer_name"] = customer.full_name if customer else ""
            item["customer_email"] = customer.email if customer else ""
            items.append(item)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/revenue")
def revenue(days: int = Query(30, ge=1, le=365), _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    since = datetime.now(UTC) - timedelta(days=days - 1)
    rows = (
        db.query(func.date(Payment.paid_at), func.coalesce(func.sum(Payment.amount), 0), func.count(Payment.id))
        .filter(Payment.status == PaymentStatus.paid.value, Payment.paid_at.is_not(None), Payment.paid_at >= since)
        .group_by(func.date(Payment.paid_at))
        .all()
    )
    return {
        "days": days,
        "points": [{"date": str(day), "amount": round(float(amount), 2), "payments": int(count)} for day, amount, count in rows],
        "total": round(sum(float(amount) for _day, amount, _count in rows), 2),
    }


@router.get("/drivers")
def list_drivers(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    drivers = db.query(Driver).options(joinedload(Driver.user)).order_by(Driver.id.asc()).all()
    active_orders = (
        db.query(Order)
        .filter(Order.driver_id.is_not(None), Order.status.notin_(["delivered", "cancelled"]))
        .all()
    )
    by_driver: dict[int, list[dict]] = {}
    for order in active_orders:
        loaded = load_order(db, order.id)
        if loaded:
            by_driver.setdefault(loaded.driver_id, []).append(
                {"id": loaded.id, "order_number": loaded.order_number, "status": loaded.status}
            )
    return [
        {
            "id": driver.id,
            "user_id": driver.user_id,
            "full_name": driver.user.full_name,
            "email": driver.user.email,
            "phone": driver.user.phone,
            "vehicle_type": driver.vehicle_type,
            "license_plate": driver.license_plate,
            "is_available": driver.is_available,
            "is_active": driver.user.is_active,
            "latitude": driver.current_latitude,
            "longitude": driver.current_longitude,
            "location_is_simulated": driver.location_is_simulated,
            "active_orders": by_driver.get(driver.id, []),
        }
        for driver in drivers
    ]


@router.get("/promotions", response_model=list[PromotionOut])
def list_promotions(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Promotion).order_by(Promotion.created_at.desc()).all()


@router.post("/promotions", response_model=PromotionOut, status_code=status.HTTP_201_CREATED)
def create_promotion(payload: PromotionIn, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    code = payload.code.strip().upper()
    if db.query(Promotion).filter(Promotion.code == code).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That code already exists")
    promo = Promotion(**payload.model_dump())
    promo.code = code
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


@router.put("/promotions/{promotion_id}", response_model=PromotionOut)
def update_promotion(
    promotion_id: int,
    payload: PromotionIn,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    promo = db.get(Promotion, promotion_id)
    if promo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    for key, value in payload.model_dump().items():
        setattr(promo, key, value)
    promo.code = promo.code.strip().upper()
    db.commit()
    db.refresh(promo)
    return promo


@router.delete("/promotions/{promotion_id}")
def delete_promotion(promotion_id: int, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    promo = db.get(Promotion, promotion_id)
    if promo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    db.delete(promo)
    db.commit()
    return {"message": "Promotion deleted"}


@router.get("/payments")
def list_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Payment).order_by(Payment.created_at.desc())
    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()
    items = []
    for payment in rows:
        order = db.get(Order, payment.order_id)
        items.append(
            {
                "id": payment.id,
                "order_id": payment.order_id,
                "order_number": order.order_number if order else None,
                "method": payment.method,
                "status": payment.status,
                "amount": payment.amount,
                "currency": payment.currency,
                "paid_at": payment.paid_at,
                "created_at": payment.created_at,
                "failure_reason": payment.failure_reason,
            }
        )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/upload")
async def upload_image(file: UploadFile = File(...), _: User = Depends(get_current_admin)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a JPG, PNG, WEBP, or GIF image")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Images must be 5 MB or smaller")
    name = f"{uuid.uuid4().hex}{suffix}"
    (UPLOAD_DIR / name).write_bytes(content)
    return {"url": f"/uploads/{name}"}
