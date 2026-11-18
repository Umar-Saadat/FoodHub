"""Order creation, status transitions, and serialization."""

import math
import secrets
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.address import Address
from app.models.driver import Driver
from app.models.order import ALLOWED_TRANSITIONS, CUSTOMER_CANCELLABLE, Order, OrderItem, OrderStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.core.config import settings
from app.models.user import User
from app.services.cart_service import clear_cart, get_or_create_cart
from app.services.promo_service import find_promo, normalize_code, quote_discount


def _order_number() -> str:
    stamp = datetime.now(UTC).strftime("%Y%m%d")
    return f"FH-{stamp}-{secrets.token_hex(3).upper()}"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def estimate_minutes(restaurant_lat: float, restaurant_lng: float, dest_lat: float | None, dest_lng: float | None, prep: int) -> int | None:
    if dest_lat is None or dest_lng is None:
        return prep + 15
    distance = haversine_km(restaurant_lat, restaurant_lng, dest_lat, dest_lng)
    # City delivery speed assumption used only to estimate time from two known points.
    travel = max(5, int(round((distance / 25.0) * 60)))
    return prep + travel


def assign_available_driver(db: Session) -> Driver | None:
    return (
        db.query(Driver)
        .filter(Driver.is_available.is_(True))
        .order_by(Driver.id.asc())
        .first()
    )


def load_order(db: Session, order_id: int) -> Order | None:
    return (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.payment),
            joinedload(Order.address),
            joinedload(Order.restaurant),
            joinedload(Order.driver).joinedload(Driver.user),
        )
        .filter(Order.id == order_id)
        .one_or_none()
    )


def serialize_order(order: Order, client_secret: str | None = None) -> dict:
    driver = None
    if order.driver is not None and order.driver.user is not None:
        driver = {
            "id": order.driver.id,
            "full_name": order.driver.user.full_name,
            "phone": order.driver.user.phone,
            "vehicle_type": order.driver.vehicle_type,
            "latitude": order.driver.current_latitude,
            "longitude": order.driver.current_longitude,
            "location_is_simulated": order.driver.location_is_simulated,
            "last_location_at": order.driver.last_location_at,
        }
    payment = None
    if order.payment is not None:
        payment = {
            "id": order.payment.id,
            "method": order.payment.method,
            "status": order.payment.status,
            "amount": order.payment.amount,
            "currency": order.payment.currency,
            "stripe_payment_intent_id": order.payment.stripe_payment_intent_id,
            "failure_reason": order.payment.failure_reason,
            "paid_at": order.payment.paid_at,
        }
    address = order.address
    restaurant = order.restaurant
    return {
        "id": order.id,
        "order_number": order.order_number,
        "status": order.status,
        "subtotal": order.subtotal,
        "delivery_fee": order.delivery_fee,
        "discount": order.discount,
        "total": order.total,
        "promo_code": order.promo_code,
        "notes": order.notes,
        "estimated_delivery_min": order.estimated_delivery_min,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "restaurant_id": restaurant.id,
        "restaurant_name": restaurant.name,
        "restaurant_latitude": restaurant.latitude,
        "restaurant_longitude": restaurant.longitude,
        "restaurant_address": restaurant.address,
        "user_id": order.user_id,
        "items": [
            {
                "id": item.id,
                "food_id": item.food_id,
                "name": item.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price,
            }
            for item in order.items
        ],
        "payment": payment,
        "address": {
            "id": address.id,
            "label": address.label,
            "street": address.street,
            "city": address.city,
            "postal_code": address.postal_code,
            "latitude": address.latitude,
            "longitude": address.longitude,
        },
        "driver": driver,
        "client_secret": client_secret,
    }


def create_order_from_cart(
    db: Session,
    user: User,
    address_id: int,
    payment_method: str,
    promo_code: str | None,
    notes: str,
) -> Order:
    address = db.get(Address, address_id)
    if address is None or address.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Choose a valid delivery address")
    cart = get_or_create_cart(db, user)
    if not cart.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Your cart is empty")

    restaurant = None
    subtotal = 0.0
    prep = 15
    line_payload = []
    for item in cart.items:
        food = item.food
        if food is None or not food.is_available:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An item in your cart is no longer available")
        if restaurant is None:
            restaurant = food.restaurant
        elif food.restaurant_id != restaurant.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cart contains items from multiple restaurants")
        unit = food.effective_price
        line_total = round(unit * item.quantity, 2)
        subtotal += line_total
        prep = max(prep, food.prep_time_min)
        line_payload.append((food, item.quantity, unit, line_total))

    subtotal = round(subtotal, 2)
    if subtotal < float(restaurant.min_order):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum order for {restaurant.name} is {restaurant.min_order:.2f}",
        )
    delivery_fee = float(restaurant.delivery_fee)
    promo = find_promo(db, promo_code) if promo_code else None
    discount, delivery_fee, message = quote_discount(promo, subtotal, delivery_fee)
    if promo_code and message != "Code applied" and message != "Delivery fee waived":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    total = round(max(0.0, subtotal - discount) + delivery_fee, 2)
    driver = assign_available_driver(db)
    order = Order(
        order_number=_order_number(),
        user_id=user.id,
        restaurant_id=restaurant.id,
        address_id=address.id,
        driver_id=driver.id if driver else None,
        status=OrderStatus.pending.value,
        subtotal=subtotal,
        delivery_fee=round(delivery_fee, 2),
        discount=discount,
        total=total,
        promo_code=normalize_code(promo_code) or None,
        notes=notes.strip(),
        estimated_delivery_min=estimate_minutes(
            restaurant.latitude, restaurant.longitude, address.latitude, address.longitude, prep
        ),
    )
    db.add(order)
    db.flush()
    for food, quantity, unit, line_total in line_payload:
        db.add(
            OrderItem(
                order_id=order.id,
                food_id=food.id,
                name=food.name,
                quantity=quantity,
                unit_price=unit,
                total_price=line_total,
            )
        )
    db.add(
        Payment(
            order_id=order.id,
            method=payment_method,
            status=PaymentStatus.pending.value,
            amount=total,
            currency=settings.CURRENCY,
        )
    )
    if promo is not None and (discount > 0 or delivery_fee == 0 and promo.discount_type == "free_delivery"):
        promo.used_count += 1
    if driver is not None:
        driver.is_available = False
    clear_cart(db, user)
    db.commit()
    loaded = load_order(db, order.id)
    assert loaded is not None
    return loaded


def assert_transition(current: str, target: str) -> None:
    if target not in ALLOWED_TRANSITIONS.get(current, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot change an order from {current.replace('_', ' ')} to {target.replace('_', ' ')}",
        )


def apply_status(db: Session, order: Order, target: str) -> Order:
    assert_transition(order.status, target)
    order.status = target
    if target == OrderStatus.delivered.value and order.payment and order.payment.method == PaymentMethod.card.value:
        # Card payments are marked paid by Stripe, not by the status change.
        pass
    if target == OrderStatus.cancelled.value and order.driver is not None:
        order.driver.is_available = True
    if target == OrderStatus.delivered.value and order.driver is not None:
        order.driver.is_available = True
    db.commit()
    loaded = load_order(db, order.id)
    assert loaded is not None
    return loaded


def cancel_order(db: Session, order: Order, user: User) -> Order:
    if order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot cancel this order")
    if order.status not in CUSTOMER_CANCELLABLE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This order can no longer be cancelled")
    return apply_status(db, order, OrderStatus.cancelled.value)


def confirm_cash(db: Session, order: Order) -> Order:
    if order.payment is None or order.payment.method != PaymentMethod.cod.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This order is not cash on delivery")
    if order.status != OrderStatus.delivered.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Confirm cash only after the order is delivered")
    order.payment.status = PaymentStatus.paid.value
    order.payment.paid_at = datetime.now(UTC)
    db.commit()
    loaded = load_order(db, order.id)
    assert loaded is not None
    return loaded
