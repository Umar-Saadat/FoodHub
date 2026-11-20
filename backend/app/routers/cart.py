"""Authenticated shopping cart stored in the database."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.cart import CartItemIn, CartItemUpdate, CartSync, PromoCheck
from app.services.cart_service import add_item, clear_cart, get_or_create_cart, remove_item, serialize_cart, sync_cart, update_item
from app.services.promo_service import find_promo, quote_discount

router = APIRouter()


@router.get("")
def get_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize_cart(get_or_create_cart(db, user))


@router.post("/items")
def post_item(payload: CartItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = add_item(db, user, payload.food_id, payload.quantity, payload.special_instructions)
    return serialize_cart(cart)


@router.put("/items/{item_id}")
def put_item(item_id: int, payload: CartItemUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = update_item(db, user, item_id, payload.quantity, payload.special_instructions)
    return serialize_cart(cart)


@router.delete("/items/{item_id}")
def delete_item(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize_cart(remove_item(db, user, item_id))


@router.delete("")
def delete_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize_cart(clear_cart(db, user))


@router.post("/sync")
def post_sync(payload: CartSync, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = sync_cart(db, user, [(item.food_id, item.quantity) for item in payload.items])
    return serialize_cart(cart)


@router.post("/promo-check")
def promo_check(payload: PromoCheck, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = serialize_cart(get_or_create_cart(db, user))
    promo = find_promo(db, payload.code)
    discount, delivery_fee, message = quote_discount(promo, cart["subtotal"], cart["delivery_fee"])
    valid = message in {"Code applied", "Delivery fee waived"}
    return {
        "valid": valid,
        "message": message,
        "discount": discount,
        "delivery_fee": delivery_fee,
        "subtotal": cart["subtotal"],
        "total": round(max(0.0, cart["subtotal"] - discount) + delivery_fee, 2),
    }
