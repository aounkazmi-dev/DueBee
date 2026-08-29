import os
from datetime import date
from fastapi import APIRouter, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Bill, User
from app.email_service import send_reminder_email

router = APIRouter(prefix="/bills", tags=["reminders"])

CRON_SECRET = os.getenv("CRON_SECRET")


@router.post("/check-reminders")
async def check_reminders(x_cron_secret: str = Header(None)):
    if not CRON_SECRET or x_cron_secret != CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid or missing cron secret")

    db: Session = SessionLocal()
    try:
        today = date.today()

        due_today = (
            db.query(Bill, User)
            .join(User, Bill.user_id == User.id)
            .filter(
                Bill.due_date == today,
                Bill.reminder_sent == False,  # noqa: E712
                Bill.status != "paid",
            )
            .all()
        )

        sent_count = 0
        for bill, user in due_today:
            status_code, _ = await send_reminder_email(
                to_email=user.email,
                vendor=bill.vendor,
                amount=float(bill.amount),
                due_date=str(bill.due_date),
            )
            if status_code == 200:
                bill.reminder_sent = True
                sent_count += 1

        db.commit()
        return {"checked": len(due_today), "emails_sent": sent_count}
    finally:
        db.close()