# ReThread — Campus Thrift Marketplace

ReThread is a student-exclusive campus thrift marketplace where students can buy and sell pre-owned items within their college community.

> **Important Business Constraint**: ReThread is an **offline campus marketplace**. There are NO online checkouts, payment gateways, credit/debit card processing, or courier shipping. Transactions are coordinated via messages, purchase requests, reservations, and fulfilled through in-person campus meetups.

---

## Architecture Overview

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, TanStack Query, Zustand, Lucide React
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0+ (async), Alembic, Pydantic v2, Passlib (Argon2), PostgreSQL
- **Media**: Cloudinary (backend authenticated uploads)
- **Real-Time**: WebSockets for messaging and notifications

---

## Repository Structure

```
ReThread/
├── frontend/               # Next.js 14+ Web Application
│   ├── src/
│   │   ├── app/            # App Router pages and layouts
│   │   ├── components/     # UI design system components
│   │   ├── lib/            # Centralized API client & utilities
│   │   └── store/          # Zustand global UI stores (Mode switcher)
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                # FastAPI Modular Backend
│   ├── app/
│   │   ├── main.py         # App entrypoint & CORS
│   │   ├── core/           # Configuration & security
│   │   ├── db/             # Database session & models
│   │   ├── models/         # SQLAlchemy 2.0 entities (13 tables)
│   │   ├── schemas/        # Pydantic v2 request/response contracts
│   │   ├── api/v1/         # Route controllers (Health, Auth, etc.)
│   │   └── services/       # Domain business logic & concurrency
│   ├── alembic/            # Database migrations
│   ├── requirements.txt
│   └── alembic.ini
│
├── docs/                   # Architectural blueprints & diagrams
│   └── architecture.md
├── Rules.md                # Strict operational and tech boundaries
├── Phases.md               # 9-Phase milestone roadmap
├── Design.md               # Canonical design tokens & typography
├── Memory.md               # Continuous project progress tracker
└── README.md
```

---

## Local Development Setup

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- PostgreSQL (running locally or remote connection)

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL connection string:
# DATABASE_URL=postgresql+asyncpg://<user>@localhost:5432/rethread
# SYNC_DATABASE_URL=postgresql+psycopg2://<user>@localhost:5432/rethread

# Run Alembic migrations
alembic -c alembic.ini upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```
- API Health Check: `http://localhost:8000/api/v1/health`
- Interactive OpenAPI Docs: `http://localhost:8000/api/v1/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local

# Run Next.js dev server
npm run dev
```
- Open `http://localhost:3000` to access ReThread.
