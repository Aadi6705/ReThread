import pytest
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"


@pytest.mark.asyncio
async def test_wishlist_workflow():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # 1. Login as Aarav Sharma (buyer)
        login_res = await client.post(
            "/auth/login",
            json={"email": "test.student@iitd.ac.in", "password": "StrongPassword123!"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get an active listing
        listings_res = await client.get("/listings?limit=1")
        listing = listings_res.json()["items"][0]
        listing_id = listing["id"]

        # 3. Add to wishlist
        add_res = await client.post(f"/wishlist/{listing_id}", headers=headers)
        assert add_res.status_code == 201
        assert add_res.json()["is_wishlisted"] is True

        # 4. Check wishlist status
        check_res = await client.get(f"/wishlist/check/{listing_id}", headers=headers)
        assert check_res.status_code == 200
        assert check_res.json()["is_wishlisted"] is True

        # 5. Fetch wishlist items
        get_res = await client.get("/wishlist", headers=headers)
        assert get_res.status_code == 200
        items = get_res.json()
        assert any(item["listing_id"] == listing_id for item in items)

        # 6. Remove from wishlist
        del_res = await client.delete(f"/wishlist/{listing_id}", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["is_wishlisted"] is False


@pytest.mark.asyncio
async def test_purchase_request_and_atomic_reservation():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # 1. Login as Buyer (Aarav Sharma)
        buyer_login = await client.post(
            "/auth/login",
            json={"email": "test.student@iitd.ac.in", "password": "StrongPassword123!"},
        )
        buyer_token = buyer_login.json()["access_token"]
        buyer_headers = {"Authorization": f"Bearer {token}" if (token := buyer_token) else ""}

        # Ensure buyer email is verified
        # We also have demo seller (Rohit Mehta)
        seller_login = await client.post(
            "/auth/login",
            json={"email": "rohit.mehta@iitd.ac.in", "password": "CampusPass123!"},
        )
        seller_token = seller_login.json()["access_token"]
        seller_headers = {"Authorization": f"Bearer {seller_token}"}

        # 2. Seller creates a fresh active listing
        cats_res = await client.get("/categories")
        cat_id = cats_res.json()[0]["id"]

        create_res = await client.post(
            "/seller/listings",
            json={
                "category_id": cat_id,
                "title": "TI-84 Plus Graphing Calculator",
                "description": "Graphing calculator in working order. Fresh batteries installed.",
                "price": 1200.00,
                "original_price": 3000.00,
                "condition": "good",
                "brand": "Texas Instruments",
                "status": "active",
                "images": [
                    {
                        "image_url": "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800",
                        "cloudinary_public_id": "ti84_img",
                        "display_order": 0,
                    }
                ],
            },
            headers=seller_headers,
        )
        assert create_res.status_code == 201
        listing_id = create_res.json()["id"]

        # 3. Test self-purchase prevention: Seller tries to buy own listing
        self_buy = await client.post(
            "/transactions",
            json={"listing_id": listing_id, "buyer_message": "Buying my own item"},
            headers=seller_headers,
        )
        assert self_buy.status_code == 400
        assert "cannot submit a purchase request for your own listing" in self_buy.json()["detail"]

        # 4. First Buyer submits purchase request
        # Make sure test.student is verified
        from app.models.user import User
        from app.db.session import AsyncSessionLocal
        from sqlalchemy import update
        async with AsyncSessionLocal() as session:
            await session.execute(
                update(User)
                .where(User.email == "test.student@iitd.ac.in")
                .values(is_email_verified=True)
            )
            await session.commit()

        req_res = await client.post(
            "/transactions",
            json={"listing_id": listing_id, "buyer_message": "Interested! Can we meet at Library?"},
            headers=buyer_headers,
        )
        print("CREATE LISTING STATUS:", create_res.status_code, create_res.text)
        print("REQ RES STATUS:", req_res.status_code, req_res.text)
        assert req_res.status_code == 201
        tx_data = req_res.json()
        tx_id = tx_data["id"]
        assert tx_data["status"] == "requested"

        # 5. Seller views enquiries
        enquiries_res = await client.get("/transactions/seller", headers=seller_headers)
        assert enquiries_res.status_code == 200
        enquiries = enquiries_res.json()
        assert any(e["id"] == tx_id for e in enquiries)

        # 6. Seller accepts the purchase request (atomic reservation)
        accept_res = await client.post(
            f"/transactions/{tx_id}/accept",
            headers=seller_headers,
        )
        assert accept_res.status_code == 200
        accepted_tx = accept_res.json()
        assert accepted_tx["status"] == "accepted"

        # 7. Verify listing status automatically changed to 'reserved'
        listing_detail = await client.get(f"/listings/{listing_id}")
        assert listing_detail.status_code == 200
        assert listing_detail.json()["status"] == "reserved"

        # 8. CONCURRENCY & DOUBLE-SELLING TEST:
        # Accepting again or accepting on a reserved listing must be rejected
        second_accept = await client.post(
            f"/transactions/{tx_id}/accept",
            headers=seller_headers,
        )
        assert second_accept.status_code == 400
