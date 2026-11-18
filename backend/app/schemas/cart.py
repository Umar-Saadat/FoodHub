from pydantic import BaseModel, Field


class CartItemIn(BaseModel):
    food_id: int
    quantity: int = Field(default=1, ge=1, le=50)
    special_instructions: str = Field(default="", max_length=240)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1, le=50)
    special_instructions: str | None = Field(default=None, max_length=240)


class CartSyncItem(BaseModel):
    food_id: int
    quantity: int = Field(ge=1, le=50)


class CartSync(BaseModel):
    items: list[CartSyncItem]


class PromoCheck(BaseModel):
    code: str = Field(min_length=2, max_length=40)
    subtotal: float = Field(default=0.0, ge=0)
    delivery_fee: float = Field(default=0.0, ge=0)
