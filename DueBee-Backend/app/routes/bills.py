from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import Bill
from app.schemas import BillCreate, BillOut

router = APIRouter(prefix="/bills", tags=["bills"])


@router.post("", response_model=BillOut)
def create_bill(bill: BillCreate, db: Session = Depends(get_db)):
    new_bill = Bill(**bill.model_dump())
    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)
    return new_bill


@router.get("", response_model=list[BillOut])
def list_bills(db: Session = Depends(get_db)):
    return db.query(Bill).order_by(desc(Bill.due_date)).all()