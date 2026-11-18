from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LocationUpdate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    order_id: int | None = None
    # Explicit opt-in. The server rejects this unless DEMO_TRACKING is enabled.
    simulated: bool = False


class AvailabilityUpdate(BaseModel):
    is_available: bool


class PromotionIn(BaseModel):
    code: str = Field(min_length=2, max_length=40)
    description: str = ""
    discount_type: str = Field(pattern="^(percent|fixed|free_delivery)$")
    discount_value: float = Field(default=0, ge=0)
    min_order: float = Field(default=0, ge=0)
    max_uses: int | None = Field(default=None, ge=1)
    is_active: bool = True
    expires_at: datetime | None = None


class PromotionOut(PromotionIn):
    model_config = ConfigDict(from_attributes=True)

    id: int
    used_count: int
