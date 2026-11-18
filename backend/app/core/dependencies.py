"""Authentication and role dependencies. Authorization is enforced here, not only in the UI."""

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.driver import Driver
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def _user_from_credentials(
    credentials: HTTPAuthorizationCredentials | None,
    db: Session,
) -> User | None:
    if credentials is None or not credentials.credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, ValueError, KeyError):
        return None
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        return None
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    return _user_from_credentials(credentials, db)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    user = _user_from_credentials(credentials, db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    return user


def require_roles(*roles: UserRole):
    allowed = {role.value if isinstance(role, UserRole) else role for role in roles}

    def _checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this resource")
        return user

    return _checker


def get_current_admin(user: User = Depends(require_roles(UserRole.admin))) -> User:
    return user


def get_current_customer(user: User = Depends(require_roles(UserRole.customer))) -> User:
    return user


def get_current_driver_user(user: User = Depends(require_roles(UserRole.driver))) -> User:
    return user


def get_driver_profile(
    user: User = Depends(get_current_driver_user),
    db: Session = Depends(get_db),
) -> Driver:
    driver = db.query(Driver).filter(Driver.user_id == user.id).one_or_none()
    if driver is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Driver profile is not set up")
    return driver
