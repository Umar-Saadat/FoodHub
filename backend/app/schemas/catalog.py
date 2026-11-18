from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RestaurantIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str = ""
    cuisine: str = Field(default="", max_length=80)
    address: str = Field(min_length=3, max_length=255)
    city: str = Field(default="Lahore", max_length=80)
    phone: str | None = Field(default=None, max_length=20)
    image_url: str = ""
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    delivery_time_min: int = Field(default=30, ge=5, le=180)
    delivery_fee: float = Field(default=1.99, ge=0)
    min_order: float = Field(default=0, ge=0)
    is_active: bool = True
    is_featured: bool = False


class RestaurantOut(RestaurantIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    rating: float
    review_count: int
    created_at: datetime


class CategoryIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str = ""
    image_url: str = ""
    restaurant_id: int | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    description: str
    image_url: str
    restaurant_id: int | None


class FoodIn(BaseModel):
    restaurant_id: int
    category_id: int | None = None
    name: str = Field(min_length=2, max_length=160)
    description: str = ""
    price: float = Field(gt=0)
    discount_price: float | None = Field(default=None, ge=0)
    image_url: str = ""
    is_available: bool = True
    is_popular: bool = False
    is_featured: bool = False
    prep_time_min: int = Field(default=20, ge=1, le=180)


class FoodOut(FoodIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    effective_price: float
    restaurant_name: str | None = None


class ReviewIn(BaseModel):
    order_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=1000)
    food_id: int | None = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    restaurant_id: int
    food_id: int | None
    order_id: int
    rating: int
    comment: str
    created_at: datetime
    author_name: str | None = None
