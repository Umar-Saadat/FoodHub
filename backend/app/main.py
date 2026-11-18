"""Food Hub API entrypoint."""

from contextlib import asynccontextmanager
import logging

import jwt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.security import decode_access_token
from app.database import SessionLocal, UPLOAD_DIR, init_db
from app.models.order import Order
from app.models.user import User, UserRole
from app.routers import admin, auth, cart, categories, drivers, foods, orders, payments, restaurants, users
from app.seed import seed_admin, seed_catalog
from app.websocket.tracking import manager

logger = logging.getLogger("foodhub")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if not settings.SECRET_KEY:
        raise RuntimeError("SECRET_KEY is missing. Copy backend/.env.example to backend/.env and set a random secret.")
    init_db()
    db = SessionLocal()
    try:
        seed_admin(db)
        seed_catalog(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Food Hub API", version="1.0.0", lifespan=lifespan)

origins = {
    settings.FRONTEND_URL.rstrip("/"),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(restaurants.router, prefix="/api/restaurants", tags=["Restaurants"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(foods.router, prefix="/api/foods", tags=["Foods"])
app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["Drivers"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/config")
def public_config():
    return {
        "app_name": "Food Hub",
        "stripe_enabled": settings.stripe_enabled,
        "demo_tracking": settings.DEMO_TRACKING,
        "currency": settings.CURRENCY,
    }


def _actor_from_ws_token(token: str | None) -> tuple[int, str] | None:
    if not token:
        return None
    db = SessionLocal()
    try:
        payload = decode_access_token(token)
        user = db.get(User, int(payload["sub"]))
        if user is None or not user.is_active:
            return None
        return user.id, user.role
    except (jwt.InvalidTokenError, ValueError, KeyError):
        return None
    finally:
        db.close()


@app.websocket("/ws/notifications")
async def notifications(websocket: WebSocket):
    actor = _actor_from_ws_token(websocket.query_params.get("token"))
    if actor is None:
        await websocket.close(code=4401)
        return
    user_id, _role = actor
    await manager.connect_user(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.websocket("/ws/tracking/{order_id}")
async def tracking(websocket: WebSocket, order_id: int):
    actor = _actor_from_ws_token(websocket.query_params.get("token"))
    if actor is None:
        await websocket.close(code=4401)
        return
    user_id, role = actor
    db = SessionLocal()
    try:
        order = db.get(Order, order_id)
        if order is None:
            await websocket.close(code=4404)
            return
        allowed = role == UserRole.admin.value or order.user_id == user_id
        if not allowed and role == UserRole.driver.value and order.driver_id:
            driver = order.driver
            allowed = driver is not None and driver.user_id == user_id
        if not allowed:
            await websocket.close(code=4403)
            return
    finally:
        db.close()
    await manager.connect_order(order_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request, exc: RequestValidationError):
    messages = []
    for error in exc.errors():
        loc = " ".join(str(part) for part in error.get("loc", []) if part != "body")
        messages.append(f"{loc}: {error.get('msg')}".strip())
    return JSONResponse(status_code=422, content={"detail": messages[0] if messages else "Invalid input", "errors": exc.errors()})


@app.exception_handler(IntegrityError)
async def integrity_exception_handler(_request, _exc: IntegrityError):
    return JSONResponse(status_code=409, content={"detail": "That record conflicts with existing data"})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request, exc: Exception):
    logger.exception("Unhandled error", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})
