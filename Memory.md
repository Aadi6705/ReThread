# ReThread — Context & Progress Memory

## 1. Project Overview & Identity
- **Name**: ReThread
- **Concept**: Student-exclusive campus thrift marketplace.
- **Strict Business Constraints**: Offline campus transactions only. NO online payments, NO shipping/delivery, NO external couriers.
- **Monetary Unit**: Indian Rupees (₹ / INR). Numeric(10, 2) in database.
- **Account Model**: Single unified account for buying & selling. Persistent Buy/Sell mode toggle in header.

---

## 2. Completed Milestones

### Phase 1: Architecture & Foundation (COMPLETED)
- [x] Inspected all 21 UI designs (`s1` through `s21`).
- [x] Created `Rules.md`, `Phases.md`, `Design.md`, and `docs/architecture.md`.
- [x] Monorepo initialized (`frontend/`, `backend/`, `docs/`).
- [x] Next.js 14+ App Router, Tailwind CSS, Lucide React, Zustand, React Hook Form, Zod, TanStack Query, Axios.
- [x] FastAPI async backend, asyncpg, psycopg2-binary, passlib with Argon2.
- [x] PostgreSQL database `rethread` created.
- [x] Initial Alembic migrations executed (`c367a7a8c2ae` & `a0f921f5576c`). All 14 tables verified.
- [x] Health check endpoint `GET /api/v1/health` returning live status and DB ping.
- [x] Centralized API client `frontend/src/lib/api/client.ts` with HttpOnly credentials support.

### Phase 2: Authentication & Profile Management (COMPLETED)
- [x] Seeded Indian colleges (IIT Delhi, BITS Pilani, Delhi University, etc.) & 8 product categories (`backend/app/db/seed.py`).
- [x] Argon2 password hashing and secure token generation (`backend/app/core/security.py`).
- [x] Verification email dispatch simulation and SMTP integration (`backend/app/integrations/email.py`).
- [x] Full Auth Service (`backend/app/services/auth_service.py`):
  - Student registration with `.ac.in` / `.edu` college domain verification.
  - Email verification token generation, hashing, and one-time activation.
  - Login authentication with Argon2 password verification.
  - HttpOnly, Secure, SameSite=Lax JWT cookie issuance (`access_token` and `refresh_token`).
  - Refresh token rotation (`POST /auth/refresh`).
  - Password reset workflows (`POST /auth/forgot-password` & `POST /auth/reset-password`).
  - Logout endpoint with cookie clearance (`POST /auth/logout`).
- [x] Student Profile Service (`backend/app/services/user_service.py`):
  - Profile retrieval and `PATCH /users/me` updates (bio, department, academic year).
  - Public profile lookup `GET /users/{user_id}` with college information and verified student badge.
- [x] Automated pytest test suite (`backend/tests/test_auth.py`) passing 100% with `ASGITransport`.
- [x] Frontend Auth UI built faithful to Figma designs: `s1` (Login), `s2` (Register), `s3` (Email Verification), forgot-password, reset-password.

### Phase 3: Marketplace & Product Listings (COMPLETED)
- [x] Category API (`GET /api/v1/categories`) returning 8 active categories.
- [x] Cloudinary backend image upload service (`POST /api/v1/uploads/listing-images`, `DELETE /api/v1/uploads/listing-images/{public_id}`).
  - Validates format (JPEG, PNG, WebP) and 5 MB size limit.
  - Enforces maximum 5 photos per listing.
  - Local dev upload fallback if mock keys are present.
- [x] Public Marketplace Discovery & Search API (`GET /api/v1/listings`):
  - Scoped to student's campus by default.
  - Faceted filters: category slug, condition, min price in INR, max price in INR, query `q`.
  - Sorting: `recent`, `price_asc`, `price_desc`.
  - Paged pagination with total count and total_pages.
- [x] Product Details API (`GET /api/v1/listings/{id}`):
  - Preloads full seller profile, college context, category, and multi-image gallery.
- [x] Seller Listing Management API (`/api/v1/seller/listings`):
  - `POST /seller/listings`: Create draft or active listing.
  - `GET /seller/listings`: Fetch authenticated seller's inventory with status filtering.
  - `PATCH /seller/listings/{id}`: Edit details, photos, or pricing.
  - `DELETE /seller/listings/{id}`: Safe delete for draft listings only.
  - `POST /seller/listings/{id}/publish`: Publish draft to active marketplace.
  - `POST /seller/listings/{id}/archive`: Archive listing.
- [x] Automated Pytest Suite (`backend/tests/test_marketplace.py`) passing 100% (7/7 total tests passing).
- [x] Seeded 8 realistic campus thrift products with INR pricing and high-res imagery.
- [x] Frontend Marketplace Pages & Components:
  - `ProductCard.tsx`: INR formatted price, original price strikethrough, discount %, condition pill, wishlist heart toggle, verified student badge.
  - `ProductGrid.tsx`: Responsive 4/3/2 column grid with skeleton loading and empty state.
  - `FilterSidebar.tsx`: Faceted categories, price range inputs, condition pills, and reset button.
  - Discover page (`frontend/src/app/(marketplace)/discover/page.tsx`) adhering to `s4`.
  - Explore page (`frontend/src/app/(marketplace)/explore/page.tsx`) adhering to `s5`.
  - Product Details page (`frontend/src/app/(marketplace)/product/[id]/page.tsx`) adhering to `s6`.
  - 4-Step Listing Wizard (`frontend/src/app/(seller)/listings/create/page.tsx`) adhering to `s13`, `s14`, `s15`.
- [x] Verified complete Next.js production build (`npm run build`) with all 13 routes cleanly compiled.

---

## 3. Active Configuration & Ports
- **PostgreSQL**: `rethread` on `localhost:5432`
- **Backend API**: `http://localhost:8000/api/v1` (task-297 with `--reload`)
- **Frontend App**: `http://localhost:3000`

---

### Phase 4: Wishlist & Purchase Requests (COMPLETED)
- [x] Wishlist API endpoints (`GET /api/v1/wishlist`, `POST /api/v1/wishlist/{listing_id}`, `DELETE /api/v1/wishlist/{listing_id}`, `GET /api/v1/wishlist/check/{listing_id}`).
- [x] Self-wishlist prevention: Sellers cannot wishlist their own items.
- [x] Purchase request creation (`POST /api/v1/transactions`):
  - Validates verified student identity.
  - Prevents purchasing own listing.
  - Rejects requests on non-active listings.
  - Prevents duplicate pending requests from same buyer.
  - Captures optional student meetup landmark / notes.
- [x] Concurrency & Double-Selling Prevention:
  - PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) in `TransactionService.accept_request`.
  - Atomic state transitions: Transaction -> `accepted`, Listing -> `reserved`.
  - Automatic rejection of concurrent acceptance attempts if listing is no longer active.
- [x] Rejection workflow (`POST /api/v1/transactions/{id}/reject`).
- [x] Buyer transactions (`GET /api/v1/transactions/buyer`) & Seller enquiries (`GET /api/v1/transactions/seller?status_filter=...`).
- [x] Pytest suite (`backend/tests/test_transactions.py`):
  - Wishlist add, list, and removal test verified.
  - Purchase request, atomic `SELECT FOR UPDATE` reservation, and status transition test verified.
  - Total backend test suite: 9/9 tests passing (100%).
- [x] Frontend Wishlist Screen (`frontend/src/app/(marketplace)/wishlist/page.tsx`):
  - Matches Figma Screen `s7` ("Saved Items").
  - Real-time stock status badge (active/reserved), direct Buy Request CTA, and instant removal.
- [x] Frontend Seller Enquiries Screen (`frontend/src/app/(seller)/enquiries/page.tsx`):
  - Matches Figma Screen `s16` ("Buyer Enquiries").
  - Status filters (All, Pending, Accepted/Reserved, Declined), live accept & decline actions, buyer identity with verified badge, and meetup notes.
- [x] Frontend Product Details Page (`frontend/src/app/(marketplace)/product/[id]/page.tsx`):
  - Floating wishlist toggle with backend synchronization.
  - Purchase Request modal with optional meetup landmark note and feedback alerts.
- [x] Frontend Product Card (`frontend/src/components/products/ProductCard.tsx`):
  - Optimistic wishlist toggle with automatic API persistence for authenticated students.
- [x] Verified full Next.js production build (`npm run build`) with all 15 routes cleanly compiled.

---

## 3. Active Configuration & Ports
- **PostgreSQL**: `rethread` on `localhost:5432`
- **Backend API**: `http://localhost:8000/api/v1` (task-297 with `--reload`)
- **Frontend App**: `http://localhost:3000`
- **Pytest Suite**: 9/9 passed (`PYTHONPATH=. ./venv/bin/pytest tests/ -v`)

---

## 4. Next Milestone: Phase 5 — Messaging & Notifications
- [ ] Database schema validation & services for `conversations` and `messages`.
- [ ] Direct messaging endpoints (`GET /api/v1/conversations`, `POST /api/v1/conversations`, `GET /api/v1/conversations/{id}/messages`, `POST /api/v1/conversations/{id}/messages`).
- [ ] WebSocket connection manager (`/api/v1/ws`) with authenticated JWT connection and live message broadcasting.
- [ ] Notification service (`GET /api/v1/notifications`, `PATCH /api/v1/notifications/{id}/read`, `GET /api/v1/notifications/unread-count`).
- [ ] Frontend Messaging page (`frontend/src/app/(marketplace)/messages/page.tsx`) adhering to Screen `s8`.
- [ ] Frontend notification badge & real-time updates in main navigation.
