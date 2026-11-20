"""Import every model so SQLAlchemy metadata is complete."""

from app.models.address import Address
from app.models.cart import Cart, CartItem
from app.models.category import Category
from app.models.contact import ContactMessage
from app.models.driver import Driver
from app.models.food import Food
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.promotion import Promotion
from app.models.refresh_token import RefreshToken
from app.models.restaurant import Restaurant
from app.models.review import Review
from app.models.user import User

__all__ = [
    "Address",
    "Cart",
    "CartItem",
    "Category",
    "ContactMessage",
    "Driver",
    "Food",
    "Order",
    "OrderItem",
    "Payment",
    "Promotion",
    "RefreshToken",
    "Restaurant",
    "Review",
    "User",
]
