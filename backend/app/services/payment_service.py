"""Stripe payment intents. Card data never touches this database."""

from datetime import UTC, datetime

import stripe
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.services.order_service import load_order


def _require_stripe() -> None:
    if not settings.stripe_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Online card payments are not configured. Choose cash on delivery or add Stripe test keys.",
        )
    stripe.api_key = settings.STRIPE_SECRET_KEY


def create_payment_intent(db: Session, order: Order) -> str:
    _require_stripe()
    if order.payment is None or order.payment.method != PaymentMethod.card.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This order is not a card payment")
    if order.payment.status == PaymentStatus.paid.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This order is already paid")
    amount_cents = int(round(order.total * 100))
    if amount_cents < 50:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Card payments must be at least 0.50")
    if order.payment.stripe_payment_intent_id:
        intent = stripe.PaymentIntent.retrieve(order.payment.stripe_payment_intent_id)
        return intent.client_secret
    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency=settings.CURRENCY,
        metadata={"order_id": str(order.id), "order_number": order.order_number},
        automatic_payment_methods={"enabled": True},
    )
    order.payment.stripe_payment_intent_id = intent.id
    db.commit()
    return intent.client_secret


def mark_paid_from_intent(db: Session, intent_id: str) -> Order | None:
    payment = db.query(Payment).filter(Payment.stripe_payment_intent_id == intent_id).one_or_none()
    if payment is None:
        return None
    payment.status = PaymentStatus.paid.value
    payment.paid_at = datetime.now(UTC)
    payment.failure_reason = None
    order = load_order(db, payment.order_id)
    if order and order.status == OrderStatus.pending.value:
        order.status = OrderStatus.confirmed.value
    db.commit()
    return load_order(db, payment.order_id)


def mark_failed_from_intent(db: Session, intent_id: str, reason: str | None) -> Order | None:
    payment = db.query(Payment).filter(Payment.stripe_payment_intent_id == intent_id).one_or_none()
    if payment is None:
        return None
    if payment.status != PaymentStatus.paid.value:
        payment.status = PaymentStatus.failed.value
        payment.failure_reason = (reason or "Payment failed")[:255]
        db.commit()
    return load_order(db, payment.order_id)


def refund_if_possible(order: Order) -> None:
    """Best-effort refund when a paid card order is cancelled. Failures are stored, not hidden."""
    payment = order.payment
    if payment is None or payment.method != PaymentMethod.card.value or payment.status != PaymentStatus.paid.value:
        return
    if not settings.stripe_enabled or not payment.stripe_payment_intent_id:
        return
    stripe.api_key = settings.STRIPE_SECRET_KEY
    stripe.Refund.create(payment_intent=payment.stripe_payment_intent_id)
    payment.status = PaymentStatus.refunded.value
