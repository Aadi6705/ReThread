import pytest
import httpx
from datetime import datetime, timezone, timedelta
from app.main import app

BASE_URL = "http://testserver/api/v1"


@pytest.mark.asyncio
async def test_meetup_scheduling_and_dual_confirmation():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # 1. Login as Buyer (test.student@iitd.ac.in)
        buyer_login = await client.post(
            "/auth/login",
            json={"email": "test.student@iitd.ac.in", "password": "StrongPassword123!"},
        )
        buyer_token = buyer_login.json()["access_token"]
        buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

        # 2. Login as Demo Seller (rohit.mehta@iitd.ac.in)
        seller_login = await client.post(
            "/auth/login",
            json={"email": "rohit.mehta@iitd.ac.in", "password": "CampusPass123!"},
        )
        seller_token = seller_login.json()["access_token"]
        seller_headers = {"Authorization": f"Bearer {seller_token}"}

        # 3. Seller creates a fresh listing for testing
        cats_res = await client.get("/categories")
        cat_id = cats_res.json()[0]["id"]

        create_res = await client.post(
            "/seller/listings",
            headers=seller_headers,
            json={
                "category_id": cat_id,
                "title": "Engineering Physics Lab Manual",
                "description": "Complete lab manual with clean observations and verified graph sheets.",
                "price": 350.00,
                "original_price": 600.00,
                "condition": "like_new",
                "images": [
                    {
                        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
                        "cloudinary_public_id": "test_manual_img",
                        "display_order": 0,
                    }
                ],
                "status": "active",
            },
        )
        assert create_res.status_code == 201
        listing_id = create_res.json()["id"]

        # 4. Buyer requests to buy
        req_res = await client.post(
            "/transactions",
            headers=buyer_headers,
            json={
                "listing_id": listing_id,
                "buyer_message": "Can we meet near Bharti Building tomorrow?",
            },
        )
        assert req_res.status_code == 201
        tx = req_res.json()
        tx_id = tx["id"]
        assert tx["status"] == "requested"

        # 5. Seller accepts request -> listing becomes reserved
        accept_res = await client.post(
            f"/transactions/{tx_id}/accept",
            headers=seller_headers,
        )
        assert accept_res.status_code == 200
        assert accept_res.json()["status"] == "accepted"
        assert accept_res.json()["listing"]["status"] == "reserved"

        # 6. Schedule physical campus meetup
        meetup_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        meetup_res = await client.post(
            f"/transactions/{tx_id}/schedule-meetup",
            headers=seller_headers,
            json={
                "meetup_location": "Student Activity Centre (SAC) Main Foyer",
                "meetup_datetime": meetup_time,
            },
        )
        assert meetup_res.status_code == 200
        meetup_data = meetup_res.json()
        assert meetup_data["status"] == "meetup_scheduled"
        assert meetup_data["meetup_location"] == "Student Activity Centre (SAC) Main Foyer"

        # 7. First confirmation (Seller confirms exchange handover)
        confirm1_res = await client.post(
            f"/transactions/{tx_id}/confirm-completion",
            headers=seller_headers,
        )
        assert confirm1_res.status_code == 200
        c1_data = confirm1_res.json()
        assert c1_data["seller_confirmed"] is True
        assert c1_data["buyer_confirmed"] is False
        assert c1_data["status"] == "meetup_scheduled"  # Not yet completed!

        # 8. Dual confirmation (Buyer confirms handover and in-person payment)
        confirm2_res = await client.post(
            f"/transactions/{tx_id}/confirm-completion",
            headers=buyer_headers,
        )
        assert confirm2_res.status_code == 200
        c2_data = confirm2_res.json()
        assert c2_data["seller_confirmed"] is True
        assert c2_data["buyer_confirmed"] is True
        assert c2_data["status"] == "completed"
        assert c2_data["completed_at"] is not None

        # Verify listing status transitioned to 'sold'
        listing_check = await client.get(f"/listings/{listing_id}")
        assert listing_check.status_code == 200
        assert listing_check.json()["status"] == "sold"

        # 9. Verify Seller's Sales History
        history_res = await client.get("/transactions/sales/history", headers=seller_headers)
        assert history_res.status_code == 200
        history_items = history_res.json()
        assert any(item["id"] == tx_id for item in history_items)

        # 10. Verify Seller's Sales Summary
        summary_res = await client.get("/transactions/sales/summary", headers=seller_headers)
        assert summary_res.status_code == 200
        summary = summary_res.json()
        assert summary["completed_sales"] >= 1
        assert float(summary["total_earned_offline"]) >= 350.00


@pytest.mark.asyncio
async def test_cancellation_releases_listing_to_active():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # Login buyer & seller
        buyer_login = await client.post(
            "/auth/login",
            json={"email": "test.student@iitd.ac.in", "password": "StrongPassword123!"},
        )
        buyer_headers = {"Authorization": f"Bearer {buyer_login.json()['access_token']}"}

        seller_login = await client.post(
            "/auth/login",
            json={"email": "rohit.mehta@iitd.ac.in", "password": "CampusPass123!"},
        )
        seller_headers = {"Authorization": f"Bearer {seller_login.json()['access_token']}"}

        # Create item & request
        cats_res = await client.get("/categories")
        cat_id = cats_res.json()[0]["id"]

        create_res = await client.post(
            "/seller/listings",
            headers=seller_headers,
            json={
                "category_id": cat_id,
                "title": "TI-84 Plus Graphing Calculator",
                "description": "Clean graphing calculator with batteries.",
                "price": 1800.00,
                "condition": "good",
                "images": [
                    {
                        "image_url": "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd",
                        "cloudinary_public_id": "test_calc_img",
                        "display_order": 0,
                    }
                ],
                "status": "active",
            },
        )
        assert create_res.status_code == 201
        listing_id = create_res.json()["id"]

        req_res = await client.post(
            "/transactions",
            headers=buyer_headers,
            json={"listing_id": listing_id},
        )
        tx_id = req_res.json()["id"]

        # Accept
        await client.post(f"/transactions/{tx_id}/accept", headers=seller_headers)

        # Listing is reserved
        listing_res = await client.get(f"/listings/{listing_id}")
        assert listing_res.json()["status"] == "reserved"

        # Cancel transaction
        cancel_res = await client.post(
            f"/transactions/{tx_id}/cancel",
            headers=buyer_headers,
            json={"reason": "Schedule conflict with exams, cannot meet."},
        )
        assert cancel_res.status_code == 200
        assert cancel_res.json()["status"] == "cancelled"

        # Listing must now be released back to 'active'
        listing_recheck = await client.get(f"/listings/{listing_id}")
        assert listing_recheck.json()["status"] == "active"
