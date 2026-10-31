import pytest
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"


@pytest.mark.asyncio
async def test_seller_dashboard_and_performance():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # 1. Login seller
        login_res = await client.post(
            "/auth/login",
            json={"email": "rohit.mehta@iitd.ac.in", "password": "CampusPass123!"},
        )
        assert login_res.status_code == 200, login_res.text
        seller_id = login_res.json()["user"]["id"]
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Seller Dashboard
        dash_res = await client.get("/seller/dashboard", headers=headers)
        assert dash_res.status_code == 200, dash_res.text
        dash_data = dash_res.json()

        assert "metrics" in dash_data
        metrics = dash_data["metrics"]
        assert "active_listings" in metrics
        assert "total_views" in metrics
        assert "buyer_enquiries" in metrics
        assert "items_sold" in metrics
        assert "total_earned_offline" in metrics
        assert "categories_count" in metrics
        assert isinstance(metrics["active_listings"], int)

        assert "listing_performance" in dash_data
        assert isinstance(dash_data["listing_performance"], list)

        assert "recent_activity" in dash_data
        assert isinstance(dash_data["recent_activity"], list)

        # 3. Get Listing Counts for filter pills
        counts_res = await client.get("/seller/listings/counts", headers=headers)
        assert counts_res.status_code == 200, counts_res.text
        counts_data = counts_res.json()
        assert "all" in counts_data
        assert "active" in counts_data
        assert "draft" in counts_data
        assert "reserved" in counts_data
        assert "sold" in counts_data
        assert "archived" in counts_data
        assert counts_data["all"] >= counts_data["active"]

        # 4. View a public listing and verify view_count increments
        if len(dash_data["listing_performance"]) > 0:
            first_listing = dash_data["listing_performance"][0]
            listing_id = first_listing["id"]
            views_before = first_listing["views"]

            detail_res = await client.get(f"/listings/{listing_id}")
            assert detail_res.status_code == 200
            assert detail_res.json()["view_count"] >= views_before + 1

        # 5. Fetch Seller Public Reputation Profile (Screen s18)
        rep_res = await client.get(f"/users/{seller_id}/reputation")
        assert rep_res.status_code == 200, rep_res.text
        rep_data = rep_res.json()
        assert "user" in rep_data
        assert "active_listings_count" in rep_data
        assert "completed_sales_count" in rep_data
        assert "total_earned_offline" in rep_data
        assert "community_rating" in rep_data
        assert "active_listings" in rep_data
        assert rep_data["user"]["id"] == seller_id
