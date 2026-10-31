import pytest
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"


@pytest.mark.asyncio
async def test_chat_and_notifications_lifecycle():
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

        # 3. Get an active listing owned by seller
        listings_res = await client.get("/listings")
        listings = listings_res.json()["items"]
        seller_listing = next((l for l in listings if l["seller_name"] == "Rohit Mehta"), listings[0])
        listing_id = seller_listing["id"]

        # 4. Buyer initiates a conversation with initial message
        init_res = await client.post(
            "/conversations",
            headers=buyer_headers,
            json={
                "listing_id": listing_id,
                "initial_message": "Hi Rohit! Is this item still available for meetup?",
            },
        )
        assert init_res.status_code == 201
        conv_data = init_res.json()
        conv_id = conv_data["id"]
        assert len(conv_data["messages"]) >= 1
        assert conv_data["messages"][0]["message_text"] == "Hi Rohit! Is this item still available for meetup?"

        # 5. Seller checks conversation inbox
        seller_inbox_res = await client.get("/conversations", headers=seller_headers)
        assert seller_inbox_res.status_code == 200
        seller_convs = seller_inbox_res.json()
        assert any(c["id"] == conv_id for c in seller_convs)
        matching_conv = next(c for c in seller_convs if c["id"] == conv_id)
        assert matching_conv["role"] == "selling"
        assert matching_conv["unread_count"] >= 1

        # 6. Seller replies to the conversation
        reply_res = await client.post(
            f"/conversations/{conv_id}/messages",
            headers=seller_headers,
            json={"message_text": "Yes Aarav, still available! I can meet at Student Center tomorrow."},
        )
        assert reply_res.status_code == 201
        reply_data = reply_res.json()
        assert reply_data["message_text"] == "Yes Aarav, still available! I can meet at Student Center tomorrow."

        # 7. Buyer views conversation detail (which clears unread status)
        detail_res = await client.get(f"/conversations/{conv_id}", headers=buyer_headers)
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert len(detail_data["messages"]) >= 2
        assert detail_data["role"] == "buying"

        # 8. Check notification dispatch for Buyer
        notifs_res = await client.get("/notifications", headers=buyer_headers)
        assert notifs_res.status_code == 200
        notifs = notifs_res.json()
        assert len(notifs) >= 1
        new_msg_notif = next((n for n in notifs if n["type"] == "new_message"), notifs[0])

        # 9. Mark notification as read
        read_res = await client.patch(f"/notifications/{new_msg_notif['id']}/read", headers=buyer_headers)
        assert read_res.status_code == 200
        assert read_res.json()["is_read"] is True

        # 10. Check unread count
        count_res = await client.get("/notifications/unread-count", headers=buyer_headers)
        assert count_res.status_code == 200
        assert "unread_count" in count_res.json()
