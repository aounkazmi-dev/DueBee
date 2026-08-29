# DueBee

DueBee is a full-stack bill management and reminder application. Users create an account, add and track their utility bills, receive automated email reminders before a bill is due, and see simple statistical forecasts of upcoming bill amounts based on their own billing history.

**Live Frontend:** https://duebee-chi.vercel.app
**Live Backend API:** https://duebee-backend.onrender.com
**API Docs (Swagger):** https://duebee-backend.onrender.com/docs
**Repository:** https://github.com/aounkazmi-dev/DueBee

> **Note:** The backend is deployed on Render's free tier, which spins down after periods of inactivity. The first request after idle time may take 30–50 seconds to respond while the server wakes up.

---

## Overview

DueBee started as an idea for an OCR-based bill scanner, but the current implementation does **not** include OCR or image-based bill extraction. Bills are entered manually through the dashboard. The project focuses instead on three things: reliable bill tracking with per-user data isolation, an automated email reminder pipeline that runs independently of the frontend, and lightweight statistical analysis of a user's own spending history.

## Features

- User registration and login with JWT-based authentication
- Passwords hashed with bcrypt (via Passlib) — never stored in plain text
- All bill data scoped per user; one account cannot see or modify another's bills
- Bill creation, listing, and deletion
- Bill fields: vendor, amount, due date, billing month, category, status (unpaid/paid/overdue), optional consumption/units
- Dashboard showing upcoming bills sorted by due date, with status and reminder badges
- Automated daily email reminders for bills due today, sent via a scheduled backend endpoint
- Duplicate-send protection via a `reminder_sent` flag
- Simple statistical forecast of a category's next bill amount, based on the user's own bill history
- Rule-based spending insights (e.g. flagging unusually high or rising costs in a category)
- REST API built with FastAPI, interactive docs auto-generated at `/docs`

## What this project does *not* claim to be

To keep this accurate: the forecasting feature is a hand-written linear regression over a user's historical bill amounts — not a trained machine learning model, and not a deep learning system. The insights feature is threshold-based rule logic (percentage change checks), not an AI model. There is currently no LLM, RAG, or AI agent component in the deployed application.

---

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Fetch API for backend communication

### Backend
- Python
- FastAPI
- Uvicorn (ASGI server)
- SQLAlchemy (ORM)
- Pydantic (request/response validation)
- Passlib + bcrypt (password hashing)
- python-jose (JWT signing/verification)
- HTTPX (outbound HTTP calls to the email API)

### Database
- PostgreSQL, hosted on [Neon](https://neon.tech) (serverless Postgres, free tier)

### Analytics
- Manually implemented least-squares linear regression for bill amount forecasting
- Threshold-based rule logic for spending insights (no external ML library required)

### Email
- [Resend](https://resend.com) API for transactional reminder emails

### Deployment & Automation
- Vercel — frontend hosting
- Render — backend hosting (free tier)
- Neon — hosted PostgreSQL (free tier)
- GitHub Actions — scheduled daily workflow that triggers the reminder-check endpoint

---

## Architecture

```mermaid
flowchart LR
    User((User)) --> FE[React Frontend<br/>Vercel]
    FE --> BE[FastAPI Backend<br/>Render]
    BE --> DB[(PostgreSQL<br/>Neon)]

    GH[GitHub Actions<br/>Daily Schedule] --> Endpoint[POST /bills/check-reminders]
    Endpoint --> BE
    BE --> Resend[Resend Email API]
    Resend --> UserEmail([User's Email Inbox])
```

The reminder path is intentionally decoupled from the frontend: it works whether or not any user has the app open, because a scheduled GitHub Actions job — not a browser — triggers the check.

---

## Reminder System

The backend exposes a protected endpoint:

```
POST /bills/check-reminders
```

Each time it's called, it:
1. Queries the database for unpaid bills where `due_date` equals the current date and `reminder_sent` is still `false`.
2. Sends a reminder email to each bill's owner via the Resend API.
3. Marks `reminder_sent = true` for any bill that was successfully emailed, preventing duplicate sends on the next run.

This endpoint is protected by a shared secret, sent as an `X-Cron-Secret` header and checked against a `CRON_SECRET` environment variable. It is not tied to a logged-in user's JWT, since it's meant to be called by an automated process rather than a person.

A GitHub Actions workflow (`.github/workflows/reminder-check.yml`) calls this endpoint once per day on a cron schedule, so reminders go out automatically without anyone needing to keep the app open or trigger anything manually.

---

## Analytics & Forecasting

```
GET /analytics/forecast?category=Electricity
```
Takes a user's bill history for a given category and fits a simple linear trend line to the amounts over time. Returns a predicted low/high range for the next bill and the percentage change versus that category's historical average. Requires at least 3 bills in a category to produce a forecast.

```
GET /analytics/insights
```
Scans a user's bills grouped by category and flags simple patterns: a bill significantly above its category average, or a category with three consecutive rising bills. Returns plain-language messages describing what it found.

Both endpoints are exposed by the API; the forecast is currently the one surfaced in the dashboard UI.

---

## Project Structure

```
DueBee/
├── .github/
│   └── workflows/
│       └── reminder-check.yml
├── DueBee-Backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py           # signup / login endpoints
│   │   │   ├── bills.py          # bill CRUD endpoints
│   │   │   ├── analytics.py      # forecast / insights endpoints
│   │   │   └── reminders.py      # scheduled reminder-check endpoint
│   │   ├── auth.py               # password hashing + JWT helpers
│   │   ├── database.py           # SQLAlchemy engine/session setup
│   │   ├── dependencies.py       # get_current_user auth dependency
│   │   ├── email_service.py      # Resend API integration
│   │   ├── main.py               # FastAPI app, CORS, router registration
│   │   ├── models.py             # SQLAlchemy models (User, Bill)
│   │   └── schemas.py            # Pydantic request/response schemas
│   ├── requirements.txt
│   └── .env.example
├── DueBee-frontend/
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── SignIn.jsx
│   │   │   ├── SignUp.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## Environment Variables

**Never commit `.env` files, API keys, JWT secrets, or database credentials to the repository.** `.gitignore` is configured to exclude `.env`, `venv/`, `node_modules/`, and Python cache files.

### Backend (`DueBee-Backend/.env`)
```env
DATABASE_URL=postgresql://user:password@your-neon-host/dbname?sslmode=require
JWT_SECRET=replace-with-a-long-random-string
RESEND_API_KEY=your-resend-api-key
CRON_SECRET=replace-with-a-long-random-string
```

### GitHub Actions (repository secrets)
```
CRON_SECRET   — must match the backend's CRON_SECRET value
```

> Note: the frontend currently has the backend URL set directly as a constant inside each component file rather than read from an environment variable. Moving this to a `VITE_API_URL` environment variable is listed under Future Improvements below.

---

## Local Development

### Backend
```bash
cd DueBee-Backend
python -m venv venv
```

Activate the virtual environment:
```powershell
# Windows
venv\Scripts\activate
```
```bash
# macOS/Linux
source venv/bin/activate
```

Install dependencies and run:
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```
The API will be available at `http://localhost:8001`, with interactive docs at `http://localhost:8001/docs`.

### Frontend
```bash
cd DueBee-frontend
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Create a new user account |
| POST | `/auth/login` | Authenticate and receive a JWT access token |
| GET | `/bills` | List the current user's bills |
| POST | `/bills` | Create a new bill |
| DELETE | `/bills/{bill_id}` | Delete a bill owned by the current user |
| POST | `/bills/check-reminders` | Check for bills due today and send reminder emails (protected by `X-Cron-Secret`) |
| GET | `/analytics/forecast` | Get a predicted amount range for a bill category |
| GET | `/analytics/insights` | Get rule-based spending insight messages |

Full interactive documentation, generated automatically by FastAPI, is available at `/docs` on both local and deployed instances.

---

## Deployment

1. **Frontend** is deployed on Vercel, built from `DueBee-frontend/` via Vite's standard build process.
2. **Backend** is deployed on Render as a web service, built from `DueBee-Backend/` with `pip install -r requirements.txt` and started via `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. **Database** is hosted on Neon (serverless PostgreSQL).
4. Environment variables are configured separately in each platform's dashboard (Vercel, Render) and as GitHub repository secrets for Actions — never committed to the repo.
5. CORS on the backend is explicitly restricted to the deployed Vercel frontend origin.
6. A GitHub Actions workflow triggers the reminder-check endpoint on a daily schedule, independent of both the frontend and backend being actively used by anyone at that moment.

---

## Security Notes

- Authentication uses JWTs signed with a server-side secret; tokens are required on all bill and analytics endpoints.
- Passwords are hashed with bcrypt before storage — plain-text passwords are never persisted.
- Every bill query and mutation is filtered by the authenticated user's ID, so one account cannot access another's data.
- CORS is configured to only accept requests from the deployed frontend origin (plus localhost during development).
- The reminder-check endpoint is not tied to user authentication, since it's called by an automated process — it is instead protected by a separate shared secret header.
- Secrets and dependency folders are excluded from version control via `.gitignore`.

## Known Limitations

- Render's free tier causes a cold-start delay after inactivity.
- GitHub Actions' free-tier cron scheduling is not guaranteed to run at the exact minute specified — a few minutes of drift is normal and acceptable for a daily bill reminder.
- The email service (Resend) is used without a verified custom domain, which restricts delivery to the account owner's own email address in its current sandbox configuration.
- The frontend's backend URL is currently hardcoded rather than configured via environment variable.

## Screenshots

<!-- Add screenshots below as the project is finalized -->
<!-- ![Login Page](./screenshots/login.png) -->
<!-- ![Signup Page](./screenshots/signup.png) -->
<!-- ![Dashboard](./screenshots/dashboard.png) -->
<!-- ![Add Bill](./screenshots/add-bill.png) -->
<!-- ![Analytics / Forecast](./screenshots/analytics.png) -->
<!-- ![Reminder Email](./screenshots/reminder-email.png) -->

## Future Improvements

- Move the frontend's API base URL into a `VITE_API_URL` environment variable instead of a hardcoded constant
- Support for recurring bill templates instead of manual re-entry each cycle
- Additional notification channels (browser push, SMS)
- More advanced forecasting (e.g. seasonal adjustment, more historical data points)
- Richer historical spending visualizations and charts
- Verified custom email domain to allow reminders to any user's address
- Additional login providers (e.g. Google OAuth)

