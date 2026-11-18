"""Discount code checks. Discount math is performed on the server."""

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.promotion import Promotion


def normalize_code(code: str | None) -> str:
    return (code or "").strip().upper()


def find_promo(db: Session, code: str | None) -> Promotion | None:
    normalized = normalize_code(code)
    if not normalized:
        return None
    return db.query(Promotion).filter(Promotion.code == normalized).one_or_none()


def quote_discount(promo: Promotion | None, subtotal: float, delivery_fee: float) -> tuple[float, float, str]:
    """Return (discount_on_subtotal, delivery_fee_after, message)."""
    if promo is None:
        return 0.0, delivery_fee, "Enter a discount code"
    now = datetime.now(UTC)
    expires = promo.expires_at
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=UTC)
    if not promo.is_active:
        return 0.0, delivery_fee, "This code is not active"
    if expires is not None and expires < now:
        return 0.0, delivery_fee, "This code has expired"
    if promo.max_uses is not None and promo.used_count >= promo.max_uses:
        return 0.0, delivery_fee, "This code has reached its usage limit"
    if subtotal < promo.min_order:
        return 0.0, delivery_fee, f"Minimum order for this code is {promo.min_order:.2f}"
    if promo.discount_type == "percent":
        discount = round(subtotal * (promo.discount_value / 100.0), 2)
        return min(discount, subtotal), delivery_fee, "Code applied"
    if promo.discount_type == "fixed":
        return min(round(promo.discount_value, 2), subtotal), delivery_fee, "Code applied"
    if promo.discount_type == "free_delivery":
        return 0.0, 0.0, "Delivery fee waived"
    return 0.0, delivery_fee, "This code cannot be applied"
