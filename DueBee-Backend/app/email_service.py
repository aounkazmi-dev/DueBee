import os
import httpx

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = "DueBee <onboarding@resend.dev>"  # sandbox sender — works without a verified domain


async def send_reminder_email(to_email: str, vendor: str, amount: float, due_date: str):
    if not RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is not set")

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={
                "from": FROM_EMAIL,
                "to": [to_email],
                "subject": f"DueBee reminder: {vendor} bill due today",
                "html": f"""
                    <p>Hi,</p>
                    <p>Your <strong>{vendor}</strong> bill of <strong>Rs {amount:,.2f}</strong>
                    is due <strong>today ({due_date})</strong>.</p>
                    <p>— DueBee</p>
                """,
            },
        )
    return response.status_code, response.text