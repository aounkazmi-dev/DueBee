from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import Bill, User
from app.schemas import BillCreate, BillOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/bills", tags=["bills"])


@router.post("", response_model=BillOut)
def create_bill(
    bill: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_bill = Bill(**bill.model_dump(), user_id=current_user.id)
    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)
    return new_bill


@router.get("", response_model=list[BillOut])
def list_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Bill)
        .filter(Bill.user_id == current_user.id)
        .order_by(desc(Bill.due_date))
        .all()
    )