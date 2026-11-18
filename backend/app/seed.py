"""Database seed. Admin credentials come only from the environment."""

import re
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.database import SessionLocal, init_db
from app.models.category import Category
from app.models.food import Food
from app.models.promotion import Promotion
from app.models.restaurant import Restaurant
from app.models.user import User, UserRole

IMG = {
    "hero": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80",
    "spice": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
    "pasta": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
    "sushi": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
    "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
    "salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    "dessert": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80",
    "biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80",
    "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    "chicken": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=1200&q=80",
    "noodles": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
    "steak": "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80",
    "taco": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
    "coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
    "cake": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
    "bbq": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
}


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def seed_admin(db: Session) -> None:
    email = settings.ADMIN_EMAIL.strip().lower()
    password = settings.ADMIN_PASSWORD
    if not email or not password:
        print("Skipping admin seed: set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.")
        return
    if len(password) < 8:
        raise SystemExit("ADMIN_PASSWORD must be at least 8 characters.")
    existing = db.query(User).filter(User.email == email).one_or_none()
    if existing:
        print(f"Admin account already exists for {email}.")
        return
    db.add(
        User(
            email=email,
            password_hash=hash_password(password),
            full_name="Food Hub Admin",
            role=UserRole.admin.value,
            is_active=True,
        )
    )
    db.commit()
    print(f"Created admin account for {email}.")


def seed_catalog(db: Session) -> None:
    if db.query(Restaurant).count() > 0:
        print("Catalog already seeded.")
        return

    categories = [
        ("Burgers", "Stacked, juicy, and made to order.", IMG["burger"]),
        ("Pizza", "Wood-fired favorites and classic slices.", IMG["pizza"]),
        ("Biryani", "Slow-cooked rice, saffron, and spice.", IMG["biryani"]),
        ("Sushi", "Fresh rolls and Japanese bowls.", IMG["sushi"]),
        ("Pasta", "Italian sauces and handmade noodles.", IMG["pasta"]),
        ("Healthy", "Salads, bowls, and lighter plates.", IMG["salad"]),
        ("Desserts", "Cakes, cookies, and sweet finishes.", IMG["dessert"]),
        ("Drinks", "Coffee, coolers, and shakes.", IMG["coffee"]),
    ]
    category_rows: dict[str, Category] = {}
    for name, description, image in categories:
        row = Category(name=name, slug=slugify(name), description=description, image_url=image)
        db.add(row)
        category_rows[name] = row
    db.flush()

    restaurants = [
        {
            "name": "Spice Route",
            "cuisine": "Pakistani",
            "description": "Karahi, biryani, and charcoal grills from a Gulberg kitchen.",
            "address": "MM Alam Road, Gulberg III",
            "city": "Lahore",
            "phone": "+92 42 111 000 101",
            "image_url": IMG["spice"],
            "latitude": 31.5204,
            "longitude": 74.3587,
            "delivery_time_min": 35,
            "delivery_fee": 1.49,
            "min_order": 8,
            "is_featured": True,
            "rating": 4.7,
            "review_count": 128,
        },
        {
            "name": "Bella Pasta",
            "cuisine": "Italian",
            "description": "Fresh pasta, wood-fired pizza, and weekday lunch specials.",
            "address": "Phase 5, DHA",
            "city": "Lahore",
            "phone": "+92 42 111 000 102",
            "image_url": IMG["pasta"],
            "latitude": 31.4697,
            "longitude": 74.4100,
            "delivery_time_min": 30,
            "delivery_fee": 1.99,
            "min_order": 10,
            "is_featured": True,
            "rating": 4.6,
            "review_count": 96,
        },
        {
            "name": "Tokyo Bowl",
            "cuisine": "Japanese",
            "description": "Sushi rolls, ramen, and bento boxes packed for the ride.",
            "address": "Liberty Market",
            "city": "Lahore",
            "phone": "+92 42 111 000 103",
            "image_url": IMG["sushi"],
            "latitude": 31.5102,
            "longitude": 74.3441,
            "delivery_time_min": 40,
            "delivery_fee": 2.49,
            "min_order": 12,
            "is_featured": True,
            "rating": 4.8,
            "review_count": 154,
        },
        {
            "name": "Burger Barn",
            "cuisine": "American",
            "description": "Smash burgers, loaded fries, and thick shakes.",
            "address": "Johar Town",
            "city": "Lahore",
            "phone": "+92 42 111 000 104",
            "image_url": IMG["burger"],
            "latitude": 31.4697,
            "longitude": 74.2728,
            "delivery_time_min": 25,
            "delivery_fee": 0.99,
            "min_order": 6,
            "is_featured": True,
            "rating": 4.5,
            "review_count": 210,
        },
        {
            "name": "Green Leaf",
            "cuisine": "Healthy",
            "description": "Grain bowls, seasonal salads, and cold-pressed juices.",
            "address": "Model Town",
            "city": "Lahore",
            "phone": "+92 42 111 000 105",
            "image_url": IMG["salad"],
            "latitude": 31.4832,
            "longitude": 74.3230,
            "delivery_time_min": 28,
            "delivery_fee": 1.49,
            "min_order": 7,
            "is_featured": False,
            "rating": 4.4,
            "review_count": 73,
        },
        {
            "name": "Sweet Spot",
            "cuisine": "Desserts",
            "description": "Cakes by the slice, brownies, and evening coffee.",
            "address": "Main Boulevard, Gulberg",
            "city": "Lahore",
            "phone": "+92 42 111 000 106",
            "image_url": IMG["dessert"],
            "latitude": 31.5165,
            "longitude": 74.3420,
            "delivery_time_min": 22,
            "delivery_fee": 1.29,
            "min_order": 5,
            "is_featured": False,
            "rating": 4.9,
            "review_count": 188,
        },
    ]
    rows = []
    for payload in restaurants:
        row = Restaurant(**payload, is_active=True)
        db.add(row)
        rows.append(row)
    db.flush()
    by_name = {row.name: row for row in rows}

    foods = [
        ("Spice Route", "Biryani", "Chicken Biryani", "Saffron rice, tender chicken, and fried onions.", 11.5, 9.99, IMG["biryani"], True, True, 35),
        ("Spice Route", "Biryani", "Beef Nihari", "Slow-cooked beef stew with warm naan on the side.", 12.0, None, IMG["spice"], True, False, 30),
        ("Spice Route", None, "Charcoal Seekh Kebab", "Minced beef kebabs finished over charcoal.", 9.5, None, IMG["bbq"], True, True, 25),
        ("Spice Route", "Drinks", "Mango Lassi", "Chilled yogurt drink blended with mango.", 3.25, None, IMG["coffee"], False, False, 8),
        ("Bella Pasta", "Pasta", "Truffle Cream Fettuccine", "Fettuccine in a light truffle cream sauce.", 14.5, 12.5, IMG["pasta"], True, True, 22),
        ("Bella Pasta", "Pizza", "Margherita Pizza", "San Marzano tomato, mozzarella, and basil.", 13.0, None, IMG["pizza"], True, True, 20),
        ("Bella Pasta", "Pasta", "Spicy Arrabbiata", "Penne with garlic, chili, and tomato.", 11.0, None, IMG["pasta"], False, False, 18),
        ("Tokyo Bowl", "Sushi", "Salmon Roll Set", "Eight pieces of fresh salmon maki.", 16.0, 14.0, IMG["sushi"], True, True, 18),
        ("Tokyo Bowl", None, "Tonkotsu Ramen", "Rich pork broth, noodles, and soft egg.", 13.5, None, IMG["noodles"], True, True, 20),
        ("Tokyo Bowl", "Healthy", "Salmon Poke Bowl", "Rice, salmon, avocado, and sesame.", 15.0, None, IMG["salad"], False, False, 15),
        ("Burger Barn", "Burgers", "Classic Smash Burger", "Double smashed beef, cheddar, and pickles.", 9.99, 8.49, IMG["burger"], True, True, 15),
        ("Burger Barn", "Burgers", "Crispy Chicken Burger", "Buttermilk chicken, slaw, and spicy mayo.", 8.99, None, IMG["chicken"], True, False, 16),
        ("Burger Barn", None, "Loaded Fries", "Fries with cheese sauce and scallions.", 4.5, None, IMG["taco"], False, True, 10),
        ("Burger Barn", "Drinks", "Vanilla Milkshake", "Thick vanilla shake with whipped cream.", 4.25, None, IMG["coffee"], False, False, 8),
        ("Green Leaf", "Healthy", "Garden Crunch Salad", "Greens, seeds, feta, and citrus dressing.", 8.75, None, IMG["salad"], True, True, 12),
        ("Green Leaf", "Healthy", "Chicken Grain Bowl", "Grilled chicken, quinoa, and roasted vegetables.", 11.25, 9.75, IMG["chicken"], True, True, 16),
        ("Green Leaf", "Drinks", "Cold Brew", "Slow-steeped coffee over ice.", 3.5, None, IMG["coffee"], False, False, 5),
        ("Sweet Spot", "Desserts", "Chocolate Lava Cake", "Warm cake with a molten center.", 6.5, None, IMG["cake"], True, True, 12),
        ("Sweet Spot", "Desserts", "New York Cheesecake", "Baked cheesecake with berry compote.", 5.75, 4.99, IMG["dessert"], True, True, 8),
        ("Sweet Spot", "Desserts", "Brownie Box", "Four fudge brownies, boxed for sharing.", 7.5, None, IMG["dessert"], False, False, 8),
        ("Bella Pasta", None, "Grilled Ribeye", "Ribeye with herb butter and greens.", 22.0, None, IMG["steak"], False, False, 28),
        ("Spice Route", None, "Chicken Karahi", "Tomato karahi cooked to order, serves one.", 10.5, None, IMG["chicken"], True, False, 25),
        ("Tokyo Bowl", "Sushi", "Crispy Prawn Roll", "Prawn tempura roll with spicy mayo.", 12.5, None, IMG["sushi"], False, False, 16),
        ("Burger Barn", "Burgers", "Mushroom Swiss Burger", "Beef patty, Swiss, and roasted mushrooms.", 10.5, None, IMG["burger"], False, False, 16),
    ]
    for restaurant_name, category_name, name, description, price, discount, image, popular, featured, prep in foods:
        db.add(
            Food(
                restaurant_id=by_name[restaurant_name].id,
                category_id=category_rows[category_name].id if category_name else None,
                name=name,
                description=description,
                price=price,
                discount_price=discount,
                image_url=image,
                is_available=True,
                is_popular=popular,
                is_featured=featured,
                prep_time_min=prep,
            )
        )

    db.add(
        Promotion(
            code="WELCOME10",
            description="10% off your first kitchen run.",
            discount_type="percent",
            discount_value=10,
            min_order=10,
            max_uses=500,
            is_active=True,
            expires_at=datetime.now(UTC) + timedelta(days=365),
        )
    )
    db.add(
        Promotion(
            code="FREESHIP",
            description="Waive the delivery fee.",
            discount_type="free_delivery",
            discount_value=0,
            min_order=8,
            max_uses=500,
            is_active=True,
            expires_at=datetime.now(UTC) + timedelta(days=365),
        )
    )
    db.commit()
    print("Seeded restaurants, categories, foods, and promotions.")


def run_seed() -> None:
    if not settings.SECRET_KEY:
        raise SystemExit("SECRET_KEY is missing. Copy backend/.env.example to backend/.env and set a random secret.")
    init_db()
    db = SessionLocal()
    try:
        seed_admin(db)
        seed_catalog(db)
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
