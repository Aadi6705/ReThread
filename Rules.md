# ReThread — AI Development Rules & Operational Boundaries

This document defines the strict architectural, operational, and implementation boundaries for all AI agents working on the ReThread codebase.

---

## 1. Absolute Business Constraints (Non-Negotiable)

1. **Strictly Offline Campus Marketplace**:
   - ❌ **NO** online checkout, payment gateways (Stripe, Razorpay, etc.), credit/debit card processing, or digital wallets.
   - ❌ **NO** delivery, parcel shipping, or courier integration.
   - ❌ **NO** delivery tracking or address logistics.
   - All transactions occur strictly via campus in-person meetups coordinated between verified students.

2. **Single User Account, Dual Navigational Modes**:
   - ❌ **NO** separate buyer and seller accounts or separate registration flows.
   - Every student account supports both buying and selling seamlessly.
   - Buy Mode and Sell Mode are client-side navigational states (controlled via a persistent mode toggle), **NOT** backend security roles.
   - Mode switching must not require logging out or re-authenticating.

3. **Campus-Gated Verification**:
   - Access is restricted to students with approved institutional `.ac.in` / college domain emails.
   - College email verification establishes email ownership, not guaranteed ongoing enrollment.

4. **Monetary System**:
   - Currency is strictly **Indian Rupees (₹ / INR)**.
   - Database representation must strictly use PostgreSQL `NUMERIC` / `DECIMAL(10, 2)` (never floating point).

---

## 2. Technology Stack & Library Policies

### Frontend Approved Stack:
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS (matching typography and tokens in `Design.md`) + Vanilla CSS variables
- **State Management**:
  - Server state: TanStack Query (React Query)
  - Global UI state: Zustand (lightweight, minimal stores)
- **Forms & Validation**: React Hook Form + Zod
- **Icons**: Lucide React
- **Real-Time Client**: Native WebSocket client / Socket.IO client
- ❌ **Forbidden**: Storing sensitive auth tokens or passwords in `localStorage`, using Next.js API routes as a database-backed backend, mocking API responses with fake timers instead of connecting real endpoints.

### Backend Approved Stack:
- **Language**: Python 3.11+
- **Framework**: FastAPI (async routes)
- **ORM**: SQLAlchemy 2.0+ (declarative 2.0 style with `Mapped` and `mapped_column`)
- **Database**: PostgreSQL
- **Migrations**: Alembic (mandatory for all schema changes)
- **Validation & Serialization**: Pydantic v2
- **Authentication**: JWT (Access + Refresh tokens) stored in secure `HttpOnly`, `SameSite=Lax`, `Secure` cookies
- **Password Hashing**: Passlib with Argon2 or bcrypt
- **Image Storage**: Cloudinary SDK (authenticated server-side uploads only)
- **Real-Time**: FastAPI WebSockets
- ❌ **Forbidden**: Raw unparameterized SQL queries, bypassing Alembic for table creation in production/dev, putting business logic in route handlers, returning hardcoded dummy metrics.

---

## 3. Architecture & Code Quality Principles

1. **Decoupled Architecture**:
   - The frontend and backend communicate strictly via REST APIs and WebSockets.
   - Frontend code never touches the database directly.
   - Cloudinary API secrets and DB credentials must never leak to the client.

2. **Layered Backend Structure**:
   - `api/v1/`: Routing, request parsing, dependency injection, and HTTP status codes only.
   - `services/`: All domain rules, workflows, validation logic, and authorization checks.
   - `repositories/`: Database queries and transactions using SQLAlchemy 2.0.
   - `models/`: Database entities.
   - `schemas/`: Pydantic request and response schemas (strictly decoupled from models).

3. **Concurrency & Double-Selling Prevention**:
   - When accepting purchase requests, execute operations inside atomic database transactions.
   - Use `SELECT FOR UPDATE` on the listing record to ensure row-level locking.
   - Only one accepted reservation may exist for any listing at any given time.

4. **Error Handling & Resilience**:
   - Return RFC 7807 compliant JSON error responses with clear `detail` messages.
   - Never expose raw database exceptions, internal stack traces, or sensitive environment details in API responses.
   - Frontend must handle loading, empty, error, and retry states for every network request.

5. **Modifications & Refactoring**:
   - Always read and inspect existing files before making edits.
   - Do not overwrite working code without understanding its context.
   - Work in small, verifiable steps according to `Phases.md`.
