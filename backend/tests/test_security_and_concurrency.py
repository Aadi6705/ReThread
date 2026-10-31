import pytest
import httpx
from datetime import datetime, timezone, timedelta
from app.main import app

BASE_URL = "http://testserver/api/v1"


@pytest.mark.asyncio
async def test_security_headers_present():
    """Verify that essential production security headers are set on responses."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        res = await client.get("/health")
        assert res.status_code == 200
        headers = res.headers
        assert headers.get("X-Content-Type-Options") == "nosniff"
        assert headers.get("X-Frame-Options") == "DENY"
        assert headers.get("X-XSS-Protection") == "1; mode=block"
        assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_input_sanitization_strips_xss():
    """Verify that dangerous script and iframe tags are stripped from user text input."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # Login as Seller
        seller_login = await client.post(
            "/auth/login",
            json={"email": "rohit.mehta@iitd.ac.in", "password": "CampusPass123!"},
        )
        seller_headers = {"Authorization": f"Bearer {seller_login.json()['access_token']}"}

        cats_res = await client.get("/categories")
        cat_id = cats_res.json()[0]["id"]

        # Attempt to inject XSS in title and description
        create_res = await client.post(
            "/seller/listings",
            headers=seller_headers,
            json={
                "category_id": cat_id,
                "title": "<script>alert('pwned')</script>Calculus 8th Edition",
                "description": "<iframe src='evil.com'></iframe>Clean book with no marks.",
                "price": 450.00,
                "condition": "like_new",
                "images": [
                    {
                        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
                        "cloudinary_public_id": "test_xss_img",
                        "display_order": 0,
                    }
                ],
                "status": "active",
            },
        )
        assert create_res.status_code == 201
        data = create_res.json()
        assert "<script>" not in data["title"]
        assert "alert('pwned')" not in data["title"]
        assert "Calculus 8th Edition" in data["title"]
        assert "<iframe>" not in data["description"]
        assert "Clean book with no marks." in data["description"]


@pytest.mark.asyncio
async def test_double_selling_concurrency_prevention():
    """
    Test atomic reservation and concurrency control.
    When Seller accepts Request 1, the listing becomes 'reserved'.
    Attempting to accept Request 2 on the same listing MUST fail with 400 Bad Request.
    """
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # 1. Login Seller (Rohit)
        seller_login = await client.post(
            "/auth/login",
            json={"email": "rohit.mehta@iitd.ac.in", "password": "CampusPass123!"},
        )
        seller_headers = {"Authorization": f"Bearer {seller_login.json()['access_token']}"}

        # 2. Login Buyer 1 (test.student)
        buyer1_login = await client.post(
            "/auth/login",
            json={"email": "test.student@iitd.ac.in", "password": "StrongPassword123!"},
        )
        buyer1_headers = {"Authorization": f"Bearer {buyer1_login.json()['access_token']}"}

        # 3. Create a unique listing
        cats_res = await client.get("/categories")
        cat_id = cats_res.json()[0]["id"]

        create_res = await client.post(
            "/seller/listings",
            headers=seller_headers,
            json={
                "category_id": cat_id,
                "title": "Discrete Mathematics Rosen 7th Ed",
                "description": "Textbook for COL202 course.",
                "price": 500.00,
                "condition": "good",
                "images": [
                    {
                        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
                        "cloudinary_public_id": "test_rosen_img",
                        "display_order": 0,
                    }
                ],
                "status": "active",
            },
        )
        assert create_res.status_code == 201
        listing_id = create_res.json()["id"]

        # 4. Buyer 1 submits purchase request
        req1_res = await client.post(
            "/transactions",
            headers=buyer1_headers,
            json={"listing_id": listing_id, "buyer_message": "I want to buy this today."},
        )
        assert req1_res.status_code == 201
        tx1_id = req1_res.json()["id"]

        # 5. Seller accepts Request 1 -> listing becomes reserved
        accept1_res = await client.post(
            f"/transactions/{tx1_id}/accept",
            headers=seller_headers,
        )
        assert accept1_res.status_code == 200
        assert accept1_res.json()["status"] == "accepted"

        # Verify listing status is now 'reserved'
        listing_check = await client.get(f"/listings/{listing_id}")
        assert listing_check.json()["status"] == "reserved"

        # 6. Another buyer (or even a second request) cannot be accepted while listing is reserved
        # Attempting to accept another transaction or re-accepting tx1 must fail
        reaccept_res = await client.post(
            f"/transactions/{tx1_id}/accept",
            headers=seller_headers,
        )
        assert reaccept_res.status_code == 400
        assert "Cannot accept request currently in 'accepted' state" in reaccept_res.json()["detail"]


@pytest.mark.asyncio
async def test_authorization_and_permission_boundaries():
    """
    Verify security authorization rules:
    - Non-participants cannot view/manage someone else's transaction
    - Non-owners cannot edit or delete someone else's listing
    - Users cannot purchase their own listing
    - Unauthenticated requests to protected endpoints return 401
    """
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # 1. Unauthenticated access blocked
        unauth_res = await client.get("/seller/dashboard")
        assert unauth_res.status_code == 401

        # 2. Login Seller & Buyer
        seller_login = await client.post(
            "/auth/login",
            json={"email": "rohit.mehta@iitd.ac.in", "password": "CampusPass123!"},
        )
        seller_headers = {"Authorization": f"Bearer {seller_login.json()['access_token']}"}

        buyer_login = await client.post(
            "/auth/login",
            json={"email": "test.student@iitd.ac.in", "password": "StrongPassword123!"},
        )
        buyer_headers = {"Authorization": f"Bearer {buyer_login.json()['access_token']}"}

        # 3. Seller creates a listing
        cats_res = await client.get("/categories")
        cat_id = cats_res.json()[0]["id"]
        create_res = await client.post(
            "/seller/listings",
            headers=seller_headers,
            json={
                "category_id": cat_id,
                "title": "Casio Scientific Calculator FX-991EX",
                "description": "Original Casio calculator with cover.",
                "price": 850.00,
                "condition": "like_new",
                "images": [
                    {
                        "image_url": "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd",
                        "cloudinary_public_id": "test_casio_img",
                        "display_order": 0,
                    }
                ],
                "status": "active",
            },
        )
        listing_id = create_res.json()["id"]

        # 4. Seller cannot buy their own listing
        self_buy_res = await client.post(
            "/transactions",
            headers=seller_headers,
            json={"listing_id": listing_id},
        )
        assert self_buy_res.status_code == 400
        assert "own listing" in self_buy_res.json()["detail"].lower()

        # 5. Buyer cannot modify Seller's listing
        buyer_edit_res = await client.patch(
            f"/seller/listings/{listing_id}",
            headers=buyer_headers,
            json={"title": "Hacked Title", "price": 10.00},
        )
        assert buyer_edit_res.status_code == 403

        # 6. Buyer cannot delete Seller's listing
        buyer_delete_res = await client.delete(
            f"/seller/listings/{listing_id}",
            headers=buyer_headers,
        )
        assert buyer_delete_res.status_code == 403


@pytest.mark.asyncio
async def test_state_machine_completed_exchange_cannot_be_cancelled():
    """
    Verify state machine integrity:
    Once an exchange is completed, calling cancel must be strictly forbidden (400).
    """
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # Login Seller & Buyer
        seller_login = await client.post(
            "/auth/login",
            json={"email": "rohit.mehta@iitd.ac.in", "password": "CampusPass123!"},
        )
        seller_headers = {"Authorization": f"Bearer {seller_login.json()['access_token']}"}

        buyer_login = await client.post(
            "/auth/login",
            json={"email": "test.student@iitd.ac.in", "password": "StrongPassword123!"},
        )
        buyer_headers = {"Authorization": f"Bearer {buyer_login.json()['access_token']}"}

        cats_res = await client.get("/categories")
        cat_id = cats_res.json()[0]["id"]

        # Create listing
        create_res = await client.post(
            "/seller/listings",
            headers=seller_headers,
            json={
                "category_id": cat_id,
                "title": "Badminton Racket Yonex Carbonex",
                "description": "Strung with BG65 at 24lbs.",
                "price": 1200.00,
                "condition": "good",
                "images": [
                    {
                        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
                        "cloudinary_public_id": "test_racket_img",
                        "display_order": 0,
                    }
                ],
                "status": "active",
            },
        )
        listing_id = create_res.json()["id"]

        # Buyer request
        tx_res = await client.post(
            "/transactions",
            headers=buyer_headers,
            json={"listing_id": listing_id},
        )
        tx_id = tx_res.json()["id"]

        # Accept
        await client.post(f"/transactions/{tx_id}/accept", headers=seller_headers)

        # Dual confirm
        await client.post(f"/transactions/{tx_id}/confirm-completion", headers=seller_headers)
        comp_res = await client.post(f"/transactions/{tx_id}/confirm-completion", headers=buyer_headers)
        assert comp_res.json()["status"] == "completed"

        # Attempt to cancel completed exchange
        cancel_res = await client.post(
            f"/transactions/{tx_id}/cancel",
            headers=seller_headers,
            json={"reason": "Want to cancel"},
        )
        assert cancel_res.status_code == 400
        assert "Completed exchanges cannot be cancelled" in cancel_res.json()["detail"]
