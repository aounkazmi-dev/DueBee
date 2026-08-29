from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class BillCreate(BaseModel):
    vendor: str
    amount: float
    due_date: date
    billing_month: str
    category: str
    status: str = "unpaid"
    consumption: Optional[float] = None


class BillOut(BillCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str
    password: str


class BillOut(BillCreate):
    id: int
    created_at: datetime
    reminder_sent: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"