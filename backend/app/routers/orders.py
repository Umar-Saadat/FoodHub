"""Customer orders and authorized status changes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_admin, get_current_user
from app.database import get_db
from app.models.driver import Driver
from app.models.order import Order
from app.models.user import User, UserRole
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.services.order_service import apply_status, cancel_order, confirm_cash, create_order_from_cart, load_order, serialize_order
from app.services.payment_service import create_payment_intent, refund_if_possible
from app.websocket.tracking import manager

router = APIRouter()


def _can_view(user: User, order: Order, db: Session) -> bool:
    if user.role == UserRole.admin.value or order.user_id == user.id:
        return True
    if user.role == UserRole.driver.value and order.driver is not None and order.driver.user_id == user.id:
        return True
    return False


async def _publish(order: Order, event_type: str) -> dict:
    data = serialize_order(order)
    await manager.broadcast_order(order.id, order.user_id, {"type": event_type, "order": data})
    return data


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != UserRole.customer.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only customers can place orders")
    if payload.payment_method == "card" and not settings.stripe_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Online card payments are not configured. Choose cash on delivery or add Stripe test keys.",
        )
    order = create_order_from_cart(db, user, payload.address_id, payload.payment_method, payload.promo_code, payload.notes)
    secret = None
    if payload.payment_method == "card":
        secret = create_payment_intent(db, order)
        order = load_order(db, order.id)
    data = await _publish(order, "order_created")
    data["client_secret"] = secret
    return data


@router.get("")
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status_filter: str | None = Query(default=None, alias="status"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Order).filter(Order.user_id == user.id)
    if user.role == UserRole.admin.value:
        query = db.query(Order)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    total = query.count()
    rows = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = []
    for row in rows:
        loaded = load_order(db, row.id)
        if loaded:
            items.append(serialize_order(loaded))
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{order_id}")
def get_order(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = load_order(db, order_id)
    if order is None or not _can_view(user, order, db):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return serialize_order(order)


@router.put("/{order_id}/cancel")
async def put_cancel(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = load_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    order = cancel_order(db, order, user)
    try:
        refund_if_possible(order)
        db.commit()
        order = load_order(db, order.id)
    except Exception as exc:  # Stripe refused the refund; the cancellation still stands.
        db.rollback()
        order = load_order(db, order_id)
        if order and order.payment:
            order.payment.failure_reason = f"Refund failed: {exc}"[:255]
            db.commit()
            order = load_order(db, order_id)
    return await _publish(order, "order_status")


@router.put("/{order_id}/status")
async def put_status(
    order_id: int,
    payload: OrderStatusUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = load_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if user.role == UserRole.admin.value:
        pass
    elif user.role == UserRole.driver.value:
        if order.driver is None or order.driver.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This delivery is not assigned to you")
        if payload.status not in {"picked_up", "out_for_delivery", "delivered"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Drivers can only update pickup and delivery progress")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot update this order")
    order = apply_status(db, order, payload.status)
    if payload.status == "cancelled":
        try:
            refund_if_possible(order)
            db.commit()
            order = load_order(db, order.id)
        except Exception:
            db.rollback()
            order = load_order(db, order.id)
    return await _publish(order, "order_status")


@router.post("/{order_id}/confirm-cash")
async def post_confirm_cash(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = load_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    allowed = user.role == UserRole.admin.value or (
        user.role == UserRole.driver.value and order.driver is not None and order.driver.user_id == user.id
    )
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot confirm this payment")
    order = confirm_cash(db, order)
    return await _publish(order, "payment_update")


@router.put("/{order_id}/driver")
async def assign_driver(
    order_id: int,
    payload: dict,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    driver_id = payload.get("driver_id")
    if not isinstance(driver_id, int):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="driver_id is required")
    order = load_order(db, order_id)
    driver = db.get(Driver, driver_id)
    if order is None or driver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order or driver not found")
    if order.status in {"delivered", "cancelled"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This order is already closed")
    previous = order.driver
    order.driver_id = driver.id
    driver.is_available = False
    db.commit()
    if previous is not None and previous.id != driver.id:
        still_active = (
            db.query(Order)
            .filter(Order.driver_id == previous.id, Order.status.notin_(["delivered", "cancelled"]), Order.id != order.id)
            .count()
        )
        if still_active == 0:
            previous.is_available = True
            db.commit()
    order = load_order(db, order.id)
    return await _publish(order, "order_status")
