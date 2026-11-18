from typing import Any
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class OrderCreate(BaseModel):
    address_id: int
    payment_method: str = Field(pattern="^(cod|card|cash)$")
    promo_code: str | None = Field(default=None, max_length=40)
    notes: str = Field(default="", max_length=500)

    @model_validator(mode="before")
    @classmethod
    def normalize_payment(cls, data: Any) -> Any:
        if isinstance(data, dict) and data.get("payment_method") == "cash":
            data["payment_method"] = "cod"
        return data


class OrderStatusUpdate(BaseModel):
    status: str = Field(
        pattern="^(pending|confirmed|preparing|ready_for_pickup|picked_up|out_for_delivery|delivered|cancelled)$"
    )


class AssignDriver(BaseModel):
    driver_id: int


class OrderItemOut(BaseModel):
    id: int
    food_id: int | None
    name: str
    quantity: int
    unit_price: float
    total_price: float


class PaymentOut(BaseModel):
    id: int
    method: str
    status: str
    amount: float
    currency: str
    stripe_payment_intent_id: str | None = None
    failure_reason: str | None = None
    paid_at: datetime | None = None


class AddressBrief(BaseModel):
    id: int
    label: str
    street: str
    city: str
    postal_code: str
    latitude: float | None
    longitude: float | None


class DriverBrief(BaseModel):
    id: int
    full_name: str
    phone: str | None
    vehicle_type: str
    latitude: float | None
    longitude: float | None
    location_is_simulated: bool = False
    last_location_at: datetime | None


class OrderOut(BaseModel):
    id: int
    order_number: str
    status: str
    subtotal: float
    delivery_fee: float
    discount: float
    total: float
    promo_code: str | None
    notes: str
    estimated_delivery_min: int | None
    created_at: datetime
    updated_at: datetime
    restaurant_id: int
    restaurant_name: str
    restaurant_latitude: float
    restaurant_longitude: float
    restaurant_address: str
    items: list[OrderItemOut]
    payment: PaymentOut | None
    address: AddressBrief
    driver: DriverBrief | None
    client_secret: str | None = None
