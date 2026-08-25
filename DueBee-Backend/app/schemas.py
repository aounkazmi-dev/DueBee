from datetime import date, datetime
from pydantic import BaseModel


class BillCreate(BaseModel):
    vendor: str
    amount: float
    due_date: date


class BillOut(BillCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True