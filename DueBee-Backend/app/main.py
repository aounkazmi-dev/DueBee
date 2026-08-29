from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes import bills, auth, analytics, reminders

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DueBee API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-frontend.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(bills.router)
app.include_router(analytics.router)
app.include_router(reminders.router)


@app.get("/")
def health_check():
    return {"status": "ok"}