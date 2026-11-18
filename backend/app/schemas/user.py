"""Address and admin user management schemas."""

from typing import Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class AddressIn(BaseModel):
    label: str = Field(default="Home", max_length=40)
    street: str = Field(min_length=3, max_length=255)
    city: str = Field(min_length=2, max_length=80)
    postal_code: str = Field(default="", max_length=20)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    is_default: bool = False

    @model_validator(mode="before")
    @classmethod
    def normalize_street(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "street" not in data or not data["street"]:
                for alias in ("address_line", "address", "line1"):
                    if data.get(alias):
                        data["street"] = data[alias]
                        break
        return data


class AddressOut(AddressIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int

    @property
    def address_line(self) -> str:
        return self.street


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=20)
    role: str = Field(pattern="^(admin|customer|driver)$")
    vehicle_type: str | None = Field(default="motorbike", max_length=40)
    license_plate: str | None = Field(default="", max_length=20)


class AdminUserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=20)
    role: str | None = Field(default=None, pattern="^(admin|customer|driver)$")
    is_active: bool | None = None
    vehicle_type: str | None = Field(default=None, max_length=40)
    license_plate: str | None = Field(default=None, max_length=20)
