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


class UserCreate(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"