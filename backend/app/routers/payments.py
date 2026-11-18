"""Card payments through Stripe test mode, plus payment status lookups."""

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.order import OrderStatus
from app.models.payment import Payment
from app.models.user import User, UserRole
from app.services.order_service import load_order, serialize_order
from app.services.payment_service import create_payment_intent, mark_failed_from_intent, mark_paid_from_intent
from app.websocket.tracking import manager

router = APIRouter()


class IntentRequest(BaseModel):
    order_id: int


def _can_view(user: User, order) -> bool:
    if user.role == UserRole.admin.value or order.user_id == user.id:
        return True
    return bool(order.driver and order.driver.user_id == user.id)


@router.post("/create-intent")
async def create_intent(payload: IntentRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = load_order(db, payload.order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status == OrderStatus.cancelled.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This order was cancelled")
    try:
        secret = create_payment_intent(db, order)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe could not start this payment. No charge was marked successful.",
        ) from None
    order = load_order(db, order.id)
    data = serialize_order(order, client_secret=secret)
    return data


@router.post("/confirm")
async def confirm_intent(payload: IntentRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Ask Stripe for the real PaymentIntent status. This never marks a payment paid on its own."""
    if not settings.stripe_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Online card payments are not configured.",
        )
    order = load_order(db, payload.order_id)
    if order is None or order.user_id != user.id or order.payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    intent_id = order.payment.stripe_payment_intent_id
    if not intent_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This order has no card payment to confirm")
    stripe.api_key = settings.STRIPE_SECRET_KEY
    intent = stripe.PaymentIntent.retrieve(intent_id)
    if intent.status == "succeeded":
        order = mark_paid_from_intent(db, intent_id)
    elif intent.status in {"canceled", "requires_payment_method"}:
        message = None
        if intent.last_payment_error:
            message = intent.last_payment_error.get("message") if isinstance(intent.last_payment_error, dict) else getattr(intent.last_payment_error, "message", None)
        order = mark_failed_from_intent(db, intent_id, message or "Payment was not completed")
    else:
        return {"stripe_status": intent.status, "order": serialize_order(load_order(db, order.id))}
    await manager.broadcast_order(order.id, order.user_id, {"type": "payment_update", "order": serialize_order(order)})
    return {"stripe_status": intent.status, "order": serialize_order(order)}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not settings.stripe_enabled or not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Online card payments are not configured.",
        )
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, signature, settings.STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe webhook signature") from None

    event_type = event["type"]
    intent = event["data"]["object"]
    order = None
    if event_type == "payment_intent.succeeded":
        order = mark_paid_from_intent(db, intent["id"])
    elif event_type == "payment_intent.payment_failed":
        reason = None
        last_error = intent.get("last_payment_error") or {}
        reason = last_error.get("message")
        order = mark_failed_from_intent(db, intent["id"], reason)
    if order is not None:
        await manager.broadcast_order(order.id, order.user_id, {"type": "payment_update", "order": serialize_order(order)})
    return {"received": True}


@router.get("/{order_id}")
def get_payment(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = load_order(db, order_id)
    if order is None or not _can_view(user, order):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if order.payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    payment = db.get(Payment, order.payment.id)
    return serialize_order(order)["payment"] if payment else None
