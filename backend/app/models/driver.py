"""Delivery drivers. Coordinates are written only from a real location update."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(40), default="motorbike", nullable=False)
    license_plate: Mapped[str] = mapped_column(String(20), default="", nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    current_latitude: Mapped[float | None] = mapped_column(Float)
    current_longitude: Mapped[float | None] = mapped_column(Float)
    location_is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_location_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rating: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="driver_profile")
    orders = relationship("Order", back_populates="driver")
