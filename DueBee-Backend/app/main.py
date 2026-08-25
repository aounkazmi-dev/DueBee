from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes import bills

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DueBee API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          # local Vite dev server
        "https://your-frontend.vercel.app",  # replace after you deploy
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bills.router)


@app.get("/")
def health_check():
    return {"status": "ok"}