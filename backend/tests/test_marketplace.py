import pytest
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"


@pytest.mark.asyncio
async def test_get_categories():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        res = await client.get("/categories")
        assert res.status_code == 200
        cats = res.json()
        assert len(cats) >= 8
        slugs = [c["slug"] for c in cats]
        assert "electronics" in slugs
        assert "books" in slugs
        assert "apparel" in slugs


@pytest.mark.asyncio
async def test_search_and_filter_listings():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # 1. Broad search
        res = await client.get("/listings?limit=20")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 8
        assert len(data["items"]) >= 8

        # 2. Filter by category: electronics
        res_elec = await client.get("/listings?category=electronics")
        assert res_elec.status_code == 200
        elec_data = res_elec.json()
        assert all(item["category_slug"] == "electronics" for item in elec_data["items"])

        # 3. Filter by search query: "Calculator"
        res_calc = await client.get("/listings?q=Calculator")
        assert res_calc.status_code == 200
        calc_data = res_calc.json()
        assert any("Calculator" in item["title"] for item in calc_data["items"])

        # 4. Filter by price range: max_price = 1000
        res_price = await client.get("/listings?max_price=1000")
        assert res_price.status_code == 200
        for item in res_price.json()["items"]:
            assert float(item["price"]) <= 1000.0


@pytest.mark.asyncio
async def test_get_listing_detail():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # Fetch first item
        list_res = await client.get("/listings?limit=1")
        item_id = list_res.json()["items"][0]["id"]

        detail_res = await client.get(f"/listings/{item_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == item_id
        assert "category" in detail
        assert "college" in detail
        assert "seller" in detail
        assert len(detail["images"]) >= 1


@pytest.mark.asyncio
async def test_seller_create_and_manage_listing():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # 1. Login as demo seller
        login_res = await client.post(
            "/auth/login",
            json={"email": "rohit.mehta@iitd.ac.in", "password": "CampusPass123!"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get categories for ID
        cats_res = await client.get("/categories")
        cat_id = cats_res.json()[0]["id"]

        # 3. Create a new listing
        create_payload = {
            "category_id": cat_id,
            "title": "Scientific Lab Apron (Size M)",
            "description": "Standard 100% white cotton chemistry lab apron with pocket. Mandatory for CY110 lab sessions.",
            "price": 250.00,
            "original_price": 500.00,
            "condition": "like_new",
            "brand": "Campus Essentials",
            "status": "active",
            "images": [
                {
                    "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
                    "cloudinary_public_id": "test_apron_img",
                    "display_order": 0,
                }
            ],
        }
        create_res = await client.post(
            "/seller/listings", json=create_payload, headers=headers
        )
        assert create_res.status_code == 201
        created_listing = create_res.json()
        listing_id = created_listing["id"]
        assert created_listing["title"] == "Scientific Lab Apron (Size M)"

        # 4. Update the listing
        update_res = await client.patch(
            f"/seller/listings/{listing_id}",
            json={"price": 220.00},
            headers=headers,
        )
        assert update_res.status_code == 200
        assert float(update_res.json()["price"]) == 220.00

        # 5. Archive the listing
        archive_res = await client.post(
            f"/seller/listings/{listing_id}/archive",
            headers=headers,
        )
        assert archive_res.status_code == 200
        assert archive_res.json()["status"] == "archived"
