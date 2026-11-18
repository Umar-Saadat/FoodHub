"""Cart persistence. Prices always come from the database."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.cart import Cart, CartItem
from app.models.food import Food
from app.models.user import User


def get_or_create_cart(db: Session, user: User) -> Cart:
    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.food).joinedload(Food.restaurant))
        .filter(Cart.user_id == user.id)
        .one_or_none()
    )
    if cart is None:
        cart = Cart(user_id=user.id)
        db.add(cart)
        db.flush()
    return cart


def _restaurant_id(cart: Cart) -> int | None:
    for item in cart.items:
        if item.food is not None:
            return item.food.restaurant_id
    return None


def add_item(db: Session, user: User, food_id: int, quantity: int, instructions: str) -> Cart:
    food = db.get(Food, food_id)
    if food is None or not food.is_available:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food item is not available")
    cart = get_or_create_cart(db, user)
    current_restaurant = _restaurant_id(cart)
    if current_restaurant is not None and current_restaurant != food.restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Your cart already has items from another restaurant. Clear the cart to continue.",
        )
    existing = next((item for item in cart.items if item.food_id == food_id), None)
    if existing:
        existing.quantity = min(50, existing.quantity + quantity)
        if instructions:
            existing.special_instructions = instructions
    else:
        cart.items.append(CartItem(food_id=food_id, quantity=quantity, special_instructions=instructions))
    db.commit()
    db.refresh(cart)
    return get_or_create_cart(db, user)


def update_item(db: Session, user: User, item_id: int, quantity: int, instructions: str | None) -> Cart:
    cart = get_or_create_cart(db, user)
    item = next((row for row in cart.items if row.id == item_id), None)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    item.quantity = quantity
    if instructions is not None:
        item.special_instructions = instructions
    db.commit()
    return get_or_create_cart(db, user)


def remove_item(db: Session, user: User, item_id: int) -> Cart:
    cart = get_or_create_cart(db, user)
    item = next((row for row in cart.items if row.id == item_id), None)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return get_or_create_cart(db, user)


def clear_cart(db: Session, user: User) -> Cart:
    cart = get_or_create_cart(db, user)
    for item in list(cart.items):
        db.delete(item)
    db.commit()
    return get_or_create_cart(db, user)


def sync_cart(db: Session, user: User, items: list[tuple[int, int]]) -> Cart:
    """Replace the server cart with the guest cart after login. One restaurant only."""
    cart = get_or_create_cart(db, user)
    for item in list(cart.items):
        db.delete(item)
    db.flush()
    restaurant_id = None
    for food_id, quantity in items:
        food = db.get(Food, food_id)
        if food is None or not food.is_available:
            continue
        if restaurant_id is None:
            restaurant_id = food.restaurant_id
        if food.restaurant_id != restaurant_id:
            continue
        cart.items.append(CartItem(food_id=food.id, quantity=min(50, quantity)))
    db.commit()
    return get_or_create_cart(db, user)


def serialize_cart(cart: Cart) -> dict:
    items = []
    subtotal = 0.0
    restaurant = None
    for item in cart.items:
        food = item.food
        if food is None:
            continue
        unit = food.effective_price
        line = round(unit * item.quantity, 2)
        subtotal += line
        restaurant = food.restaurant
        items.append(
            {
                "id": item.id,
                "food_id": food.id,
                "name": food.name,
                "quantity": item.quantity,
                "unit_price": unit,
                "line_total": line,
                "image_url": food.image_url,
                "special_instructions": item.special_instructions,
                "restaurant_id": food.restaurant_id,
                "restaurant_name": restaurant.name if restaurant else "",
                "is_available": food.is_available,
            }
        )
    delivery_fee = float(restaurant.delivery_fee) if restaurant and items else 0.0
    min_order = float(restaurant.min_order) if restaurant else 0.0
    return {
        "id": cart.id,
        "items": items,
        "subtotal": round(subtotal, 2),
        "delivery_fee": round(delivery_fee, 2),
        "min_order": min_order,
        "restaurant_id": restaurant.id if restaurant else None,
        "restaurant_name": restaurant.name if restaurant else None,
        "total": round(subtotal + delivery_fee, 2),
    }
