"""In-memory WebSocket fan-out for order status and driver location."""

import json
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.order_rooms: dict[int, set[WebSocket]] = {}
        self.user_rooms: dict[int, set[WebSocket]] = {}

    async def connect_order(self, order_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.order_rooms.setdefault(order_id, set()).add(websocket)

    async def connect_user(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.user_rooms.setdefault(user_id, set()).add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        for room in list(self.order_rooms.values()):
            room.discard(websocket)
        for room in list(self.user_rooms.values()):
            room.discard(websocket)

    async def _send(self, sockets: set[WebSocket], payload: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        message = json.dumps(payload, default=str)
        for socket in list(sockets):
            try:
                await socket.send_text(message)
            except Exception:
                stale.append(socket)
        for socket in stale:
            self.disconnect(socket)

    async def broadcast_order(self, order_id: int, user_id: int | None, payload: dict[str, Any]) -> None:
        await self._send(self.order_rooms.get(order_id, set()), payload)
        if user_id is not None:
            await self._send(self.user_rooms.get(user_id, set()), payload)


manager = ConnectionManager()
