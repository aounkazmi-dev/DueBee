from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy import Boolean 

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bills = relationship("Bill", back_populates="owner")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    vendor = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    billing_month = Column(String, nullable=False)   # "2026-08" format
    category = Column(String, nullable=False)         # Electricity, Gas, Water, Internet, etc.
    status = Column(String, nullable=False, default="unpaid")  # unpaid, paid, overdue
    consumption = Column(Numeric(10, 2), nullable=True)  # optional: units/kWh consumed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="bills")
    reminder_sent = Column(Boolean, nullable=False, default=False)