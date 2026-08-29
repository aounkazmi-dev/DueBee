from collections import defaultdict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Bill, User
from app.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


def linear_regression_forecast(amounts: list[float]):
    """Simple least-squares trend line, no external ML library needed."""
    n = len(amounts)
    xs = list(range(n))
    mean_x = sum(xs) / n
    mean_y = sum(amounts) / n

    numerator = sum((xs[i] - mean_x) * (amounts[i] - mean_y) for i in range(n))
    denominator = sum((xs[i] - mean_x) ** 2 for i in range(n))
    slope = numerator / denominator if denominator != 0 else 0
    intercept = mean_y - slope * mean_x

    predicted = slope * n + intercept  # next point in the sequence

    residuals = [amounts[i] - (slope * xs[i] + intercept) for i in range(n)]
    variance = sum(r ** 2 for r in residuals) / n
    std_dev = variance ** 0.5

    return predicted, std_dev, mean_y


@router.get("/forecast")
def forecast(
    category: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bills = (
        db.query(Bill)
        .filter(Bill.user_id == current_user.id, Bill.category == category)
        .order_by(Bill.billing_month)
        .all()
    )

    amounts = [float(b.amount) for b in bills]

    if len(amounts) < 3:
        return {
            "category": category,
            "enough_data": False,
            "message": f"Need at least 3 {category} bills to forecast — you have {len(amounts)}.",
        }

    predicted, std_dev, average = linear_regression_forecast(amounts)
    low = max(0, round(predicted - std_dev, 2))
    high = round(predicted + std_dev, 2)
    percent_change = round(((predicted - average) / average) * 100, 1) if average else 0

    return {
        "category": category,
        "enough_data": True,
        "predicted_low": low,
        "predicted_high": high,
        "percent_change_vs_average": percent_change,
    }


@router.get("/insights")
def insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bills = db.query(Bill).filter(Bill.user_id == current_user.id).order_by(Bill.billing_month).all()

    by_category: dict[str, list[float]] = defaultdict(list)
    for b in bills:
        by_category[b.category].append(float(b.amount))

    results = []
    for category, amounts in by_category.items():
        if len(amounts) < 2:
            continue

        latest = amounts[-1]
        previous = amounts[:-1]
        avg_previous = sum(previous) / len(previous)

        if avg_previous == 0:
            continue

        percent_diff = ((latest - avg_previous) / avg_previous) * 100

        # Rising trend: last 3 bills strictly increasing
        rising = len(amounts) >= 3 and amounts[-1] > amounts[-2] > amounts[-3]

        if percent_diff > 15:
            results.append({
                "category": category,
                "type": "warning",
                "message": f"{category} usage is unusually high ({percent_diff:.0f}% above average)",
            })
        elif rising:
            results.append({
                "category": category,
                "type": "warning",
                "message": f"{category} consumption is rising over recent bills",
            })
        elif abs(percent_diff) <= 10:
            results.append({
                "category": category,
                "type": "stable",
                "message": f"{category} expense is stable",
            })

    return {"insights": results}