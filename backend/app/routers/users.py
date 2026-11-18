"""Customer profile extras: password and saved addresses."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import hash_password, verify_password
from app.database import get_db
from app.models.address import Address
from app.models.user import User
from app.schemas.auth import PasswordUpdate, UserOut
from app.schemas.user import AddressIn, AddressOut

router = APIRouter()


@router.put("/me/password", response_model=UserOut)
def change_password(payload: PasswordUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)
    return user


def _clear_default(db: Session, user_id: int) -> None:
    db.query(Address).filter(Address.user_id == user_id, Address.is_default.is_(True)).update({"is_default": False})


@router.get("/me/addresses", response_model=list[AddressOut])
def list_addresses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Address).filter(Address.user_id == user.id).order_by(Address.is_default.desc(), Address.id.desc()).all()


@router.post("/me/addresses", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(payload: AddressIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.is_default or db.query(Address).filter(Address.user_id == user.id).count() == 0:
        _clear_default(db, user.id)
        is_default = True
    else:
        is_default = False
    address = Address(user_id=user.id, **payload.model_dump())
    address.is_default = is_default
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.put("/me/addresses/{address_id}", response_model=AddressOut)
def update_address(
    address_id: int,
    payload: AddressIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = db.get(Address, address_id)
    if address is None or address.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    if payload.is_default:
        _clear_default(db, user.id)
    for key, value in payload.model_dump().items():
        setattr(address, key, value)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/me/addresses/{address_id}")
def delete_address(address_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.get(Address, address_id)
    if address is None or address.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    db.delete(address)
    db.commit()
    return {"message": "Address removed"}
