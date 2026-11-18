"""Driver assignments, availability, and GPS updates."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_driver_profile
from app.database import get_db
from app.models.driver import Driver
from app.models.order import Order
from app.schemas.driver import AvailabilityUpdate, LocationUpdate
from app.services.order_service import load_order, serialize_order
from app.websocket.tracking import manager

router = APIRouter()

ACTIVE = ("pending", "confirmed", "preparing", "ready_for_pickup", "picked_up", "out_for_delivery")


@router.get("/assignments")
def assignments(driver: Driver = Depends(get_driver_profile), db: Session = Depends(get_db)):
    rows = (
        db.query(Order)
        .filter(Order.driver_id == driver.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    items = []
    for row in rows:
        loaded = load_order(db, row.id)
        if loaded:
            items.append(serialize_order(loaded))
    return {
        "driver": {
            "id": driver.id,
            "is_available": driver.is_available,
            "vehicle_type": driver.vehicle_type,
            "license_plate": driver.license_plate,
            "latitude": driver.current_latitude,
            "longitude": driver.current_longitude,
            "location_is_simulated": driver.location_is_simulated,
            "last_location_at": driver.last_location_at,
        },
        "demo_tracking": settings.DEMO_TRACKING,
        "items": items,
    }


@router.put("/availability")
def set_availability(payload: AvailabilityUpdate, driver: Driver = Depends(get_driver_profile), db: Session = Depends(get_db)):
    active = db.query(Order).filter(Order.driver_id == driver.id, Order.status.in_(ACTIVE)).count()
    if payload.is_available and active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Finish the active delivery before marking yourself available",
        )
    driver.is_available = payload.is_available
    db.commit()
    return {"is_available": driver.is_available}


@router.post("/location")
async def update_location(payload: LocationUpdate, driver: Driver = Depends(get_driver_profile), db: Session = Depends(get_db)):
    if payload.simulated and not settings.DEMO_TRACKING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Simulated tracking is turned off. Share a device GPS location instead.",
        )
    driver.current_latitude = payload.latitude
    driver.current_longitude = payload.longitude
    driver.location_is_simulated = payload.simulated
    driver.last_location_at = datetime.now(UTC)
    targets: list[Order] = []
    if payload.order_id is not None:
        order = load_order(db, payload.order_id)
        if order is None or order.driver_id != driver.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active delivery not found")
        if order.status in {"delivered", "cancelled"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This delivery is already closed")
        targets = [order]
    else:
        rows = db.query(Order).filter(Order.driver_id == driver.id, Order.status.in_(ACTIVE)).all()
        targets = [load_order(db, row.id) for row in rows]
    db.commit()
    message = {
        "type": "driver_location",
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "simulated": payload.simulated,
        "recorded_at": driver.last_location_at.isoformat(),
        "driver_id": driver.id,
    }
    for order in targets:
        if order is None:
            continue
        await manager.broadcast_order(order.id, order.user_id, {**message, "order_id": order.id})
    return {"saved": True, "simulated": payload.simulated, "orders": [order.id for order in targets if order]}
