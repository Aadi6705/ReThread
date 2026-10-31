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

### Phase 5: Real-Time Messaging & Notifications (COMPLETED)
- [x] Schemas for conversations, messages, and student alerts (`backend/app/schemas/chat.py`, `backend/app/schemas/notification.py`).
- [x] WebSocket Connection Manager (`backend/app/websocket/manager.py`):
  - Multitab-safe connection registry mapped per student `user_id`.
  - Non-blocking personal dispatches and conversation-level broadcasts.
- [x] Authenticated WebSocket endpoint (`/api/v1/ws`) in `backend/app/api/v1/ws.py`:
  - Token authentication from URL query parameter or HttpOnly cookie.
  - Heartbeat ping/pong and live inbound message dispatch.
- [x] Chat Service & API (`backend/app/services/chat_service.py`, `backend/app/api/v1/chat.py`):
  - `GET /api/v1/conversations`: Fetch student conversation threads with preloaded item snippet, unread counter, role (`buying`/`selling`), and relative timestamps.
  - `POST /api/v1/conversations`: Start or get conversation for a listing; supports optional initial greeting message.
  - `GET /api/v1/conversations/{id}`: Detailed message stream with automatic `last_read_at` unread mark clearance.
  - `POST /api/v1/conversations/{id}/messages`: Message posting with live WebSocket broadcasting and instant recipient notifications.
- [x] Notification Service & API (`backend/app/services/notification_service.py`, `backend/app/api/v1/notifications.py`):
  - Notification persistence in PostgreSQL with type-based routing (`purchase_request`, `request_accepted`, `request_rejected`, `new_message`).
  - `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `PATCH /api/v1/notifications/{id}/read`, `POST /api/v1/notifications/mark-all-read`.
  - Deep transaction event integration: Automatically notifies sellers on new purchase requests and buyers upon request acceptance or decline.
- [x] Pytest Suite (`backend/tests/test_chat_and_notifications.py`):
  - Verified full buyer-seller chat lifecycle, message posting, unread counters, notification generation, and read state update.
  - 10/10 tests passing across the entire backend suite in 1.36s.
- [x] Frontend Campus Messaging Screen (`frontend/src/app/(marketplace)/messages/page.tsx`):
  - Faithful adherence to Figma Screen `s9`.
  - Responsive 2-column layout: Search people/products, All / Unread filter pills, active conversation context, product banner with price in INR, sent/received bubble styling, double checkmarks, and auto-scroll.
  - Real-time WebSocket listener with automatic reconnect and message synchronization.
- [x] Unified Global Header (`frontend/src/components/navigation/Header.tsx`):
  - Interactive notification bell with real-time unread badge and dropdown menu.
  - Real-time unread message counter badge.
  - Buy/Sell mode navigation switcher integration.
  - Suspense-safe client architecture satisfying Next.js 15+ App Router prerendering standards.
- [x] Verified complete Next.js production build (`npm run build`) with 16 routes cleanly compiled.

---

## 3. Active Configuration & Ports
- **PostgreSQL**: `rethread` on `localhost:5432`
- **Backend API**: `http://localhost:8000/api/v1` (task-297 with `--reload`)
- **Frontend App**: `http://localhost:3000`
- **Pytest Suite**: 12/12 passed (`PYTHONPATH=. ./venv/bin/pytest tests/ -v`)

---

### Phase 6: Meetup Coordination & Exchange Completion (COMPLETED)
- [x] Backend Transaction Schemas (`backend/app/schemas/transaction.py`):
  - `TransactionScheduleMeetup`, `TransactionCancel`, `TransactionDispute`, `SalesSummaryOut`, `TransactionOut`.
- [x] Transaction Coordination & Completion Service (`backend/app/services/transaction_service.py`):
  - `schedule_meetup`: validates participant, saves campus landmark & datetime, updates status to `meetup_scheduled`, dispatches real-time notification.
  - `confirm_exchange`: dual-confirmation logic. Enforces that both buyer and seller confirm physical exchange before atomic transition to `completed` and listing to `sold` with PostgreSQL `SELECT FOR UPDATE` locking.
  - `cancel_transaction`: cancels transaction and atomically releases listing from `reserved` back to `active`.
  - `report_dispute`: records dispute for campus review.
  - `get_seller_sales_history`: retrieves completed transactions for seller.
  - `get_seller_sales_summary`: computes live aggregations for completed sales, products sold, and total offline earnings.
- [x] API Endpoints in `backend/app/api/v1/transactions.py`:
  - `POST /transactions/{id}/schedule-meetup`
  - `POST /transactions/{id}/confirm-completion`
  - `POST /transactions/{id}/cancel`
  - `POST /transactions/{id}/report-dispute`
  - `GET /transactions/sales/history`
  - `GET /transactions/sales/summary`
- [x] Pytest Suite (`backend/tests/test_meetup_and_exchange.py`):
  - Tested meetup scheduling, single confirmation vs dual confirmation (`completed`, `sold`), sales history & summary.
  - Tested cancellation releasing listing back to `active`.
  - Full suite passing: 12/12 tests passing in 2.38s.
- [x] Frontend Sales History Screen (`frontend/src/app/(seller)/sales/page.tsx`):
  - Strictly adhering to Figma Screen `s17` ("Seven finds, seven new chapters.").
  - Dynamic heading: `{count} finds, {count} new chapters.`
  - Subtitle: `Your Sales History · Completed exchanges with your campus community.`
  - 3 Stat Cards calling `GET /transactions/sales/summary`: `Completed sales`, `Total earned offline` (formatted in ₹ INR), `Products sold`.
  - In-person payment notice: "Paid in person. Recorded here. These totals include only exchanges confirmed by both students. ReThread doesn't process payments..."
  - Table calling `GET /transactions/sales/history` with columns: `PRODUCT`, `BUYER`, `AGREED PRICE`, `COMPLETED ON`, `TRANSACTION` (pill: `Completed`).
- [x] Frontend Seller Enquiries Screen (`frontend/src/app/(seller)/enquiries/page.tsx`):
  - Added Campus Meetup scheduling modal with common landmarks and datetime picker.
  - Added Dual-confirmation Handover & Payment action buttons with live status tracking.
  - Added Cancel Transaction modal with reason input and instant listing release.
- [x] Frontend Messages Screen (`frontend/src/app/(marketplace)/messages/page.tsx`):
  - Contextual listing banner updated with quick Meetup & Handover button.
- [x] Global Navigation Header (`frontend/src/components/navigation/Header.tsx`):
  - Added `My Listings` and `Sales History` links to Sell mode nav.
- [x] Verified full Next.js production build (`npm run build`) with 17 routes cleanly compiled.

---

### Phase 7: Seller Dashboard & Listing Performance (COMPLETED)
- [x] Database Schema Migration:
  - Added `view_count` mapped column to `Listing` model (`28fd3bae603e_add_view_count_to_listings`).
  - Automatic `view_count` increment on public listing detail access (`GET /api/v1/listings/{id}`).
- [x] Backend Seller Schemas (`backend/app/schemas/seller.py`):
  - `SellerListingPerformance`, `SellerRecentActivity`, `SellerPendingNotice`, `SellerDashboardMetrics`, `SellerDashboardOut`, `SellerListingCounts`, `SellerReputationOut`.
- [x] Backend Analytics & Reputation Service (`backend/app/services/seller_service.py`):
  - `get_seller_dashboard`: Live SQL aggregation of active listings, total views, buyer enquiries, total/unread conversations, items sold, and offline earnings in ₹ INR.
  - Generates actionable pending enquiry notice for seller.
  - Detailed listing performance with individual views and enquiries.
  - Recent buyer activity feed with timestamps and formatted snippets.
  - `get_seller_listing_counts`: Computes listing inventory grouped by status (`all`, `active`, `draft`, `reserved`, `sold`, `archived`) for filter pills.
  - `get_seller_reputation`: Queries student profile, verified status, college context, graduation year, community rating, completed sales, and active listings.
- [x] API Endpoints:
  - `GET /api/v1/seller/dashboard` in `backend/app/api/v1/seller.py`
  - `GET /api/v1/seller/listings/counts` in `backend/app/api/v1/seller.py`
  - `GET /api/v1/users/{id}/reputation` in `backend/app/api/v1/users.py`
- [x] Pytest Suite (`backend/tests/test_seller_dashboard_and_performance.py`):
  - Tested dashboard metrics, listing performance, filter counts, view count incrementing on public views, and public reputation endpoint.
  - Full suite: 13/13 tests passing cleanly in 2.55s.
- [x] Frontend Seller Dashboard (`frontend/src/app/(seller)/dashboard/page.tsx`):
  - Strictly adhering to Figma Screen `s11`.
  - Welcome greeting: `Welcome back, {FirstName}.`
  - 4 Stat Cards: `Active Listings`, `Product Views`, `Buyer Enquiries`, `Items Sold`.
  - Interactive Action Notice banner for pending buyer purchase requests.
  - 2-Column layout: `Listing performance` table with view/enquiry counts, and `Recent buyer activity` stream.
- [x] Frontend My Listings Management (`frontend/src/app/(seller)/listings/page.tsx`):
  - Strictly adhering to Figma Screen `s12`.
  - Inventory filter pills: `All`, `Active`, `Draft`, `Reserved`, `Sold`, `Archived`.
  - Real-time search filter for listings by title and category.
  - Table: `PRODUCT / CATEGORY`, `PRICE` in ₹ INR, `VIEWS`, `ENQUIRIES`, `LISTED`, `STATUS`, `ACTIONS`.
  - Full management actions: View, Edit, Manage Enquiries, Archive, Publish, Delete draft.
- [x] Frontend Seller Profile & Reputation (`frontend/src/app/(seller)/profile/page.tsx`):
  - Strictly adhering to Figma Screen `s18`.
  - Header: `A trusted face in your campus circle.`
  - Hero card: avatar, student name, verified student badge, college context, graduation year, community star rating.
  - 3 Stat Cards: `Active listings`, `Completed sales` (with offline earnings in ₹ INR), `Community rating` (`4.9 / 5`).
  - Tabbed interface: `Selling activity` (active listings showcase), `Reviews` (peer exchange reviews), `Account settings` (profile editor).
- [x] Frontend Public Member Profile (`frontend/src/app/(marketplace)/users/[id]/page.tsx`):
  - Publicly accessible student reputation page with Suspense-safe client architecture.
- [x] Global Navigation Header:
  - Added `Profile` link in Sell mode nav.
- [x] Verified full Next.js production build (`npm run build`) with all 21 routes cleanly compiled.

---

### Phase 8: Testing, Security Hardening & Polish (COMPLETED)
- [x] Security Middleware & Hardening (`backend/app/core/middleware.py`):
  - `SecurityHeadersMiddleware`: Injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
  - `RateLimitMiddleware`: Sliding-window client IP rate limiter with `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers; stricter rate limiting on auth endpoints.
  - CORS Origin lockdown strictly enforcing allowed origins without wildcard credentials.
- [x] Input Sanitization (`backend/app/core/sanitizer.py`):
  - Strips dangerous `<script>`, `<iframe>`, `<style>`, and `javascript:` URIs from user input.
  - Applied across listing creation/updating, transaction requests/meetups/cancellations, and chat messages.
- [x] Backend Security & Concurrency Test Suite (`backend/tests/test_security_and_concurrency.py`):
  - Verified security headers presence on responses.
  - Tested XSS input sanitization stripping script/iframe tags.
  - Tested double-selling concurrency prevention (`SELECT FOR UPDATE` atomic locks).
  - Tested authorization boundaries: non-participants blocked from viewing/managing transactions (403), non-owners blocked from editing/deleting listings (403), self-purchase prevention (400), unauthenticated access blocked (401).
  - Tested state machine integrity: completed exchanges cannot be cancelled (400).
  - All 18/18 backend tests passing cleanly.
- [x] Frontend Vitest Suite (`frontend/src/test/core_flows.test.tsx`):
  - Configured `vitest.config.ts`, `src/test/setup.ts`, and `npm test` script.
  - Tests Indian Rupee (₹ INR) currency formatting rules.
  - Tests collegiate email domain verification (`.ac.in`, `.edu`).
  - Tests campus landmarks for meetup coordination.
  - Tests dual-confirmation state machine logic.
  - All 5/5 frontend tests passing cleanly.
- [x] Responsive Mobile Navigation (390px screens):
  - Added mobile hamburger menu toggle and expandable mobile navigation drawer in `frontend/src/components/navigation/Header.tsx`.
  - Accessible on mobile screens (< 768px) with route highlighting and real-time unread badges for both Buy Mode and Sell Mode.

---

### Phase 9: Production Deployment & Orchestration (COMPLETED)
- [x] Backend Containerization:
  - `backend/Dockerfile`: Multi-stage Python 3.12-slim container with system dependencies.
  - `backend/entrypoint.sh`: Automates `alembic upgrade head` before booting Uvicorn server.
  - `backend/.dockerignore`: Prevents local virtual environments and caches from polluting build context.
- [x] Frontend Containerization:
  - `frontend/next.config.ts`: Configured `output: "standalone"` for minimal container footprint.
  - `frontend/Dockerfile`: Multi-stage Node 20-alpine runner using standalone server.
  - `frontend/.dockerignore`: Excludes local modules and build cache.
- [x] Full-Stack Docker Compose (`docker-compose.yml`):
  - Orchestrates PostgreSQL 16 (`db`), FastAPI API server (`backend`), and Next.js frontend (`frontend`).
  - Automated database health checks and service dependencies.
- [x] Cloud Deployment Configuration:
  - `render.yaml`: Blueprint for one-click deployment on Render / Railway with managed PostgreSQL.
  - `frontend/vercel.json`: Configuration for Next.js frontend deployment on Vercel.
- [x] Verified full production build (`npm run build` with standalone bundle) and backend pytest suite (18/18 passing).

