import pytest
import httpx
from app.main import app

BASE_URL = "http://testserver/api/v1"


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_register_and_verify_student_workflow():
    unique_email = "test.student@iitd.ac.in"
    password = "StrongPassword123!"

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # 1. Register new student
        reg_payload = {
            "email": unique_email,
            "password": password,
            "full_name": "Aarav Sharma",
            "department": "Computer Science & Engineering",
            "course": "B.Tech",
            "academic_year": "3rd Year",
        }
        reg_res = await client.post("/auth/register", json=reg_payload)
        
        # If already registered from previous run, that's fine, otherwise 201
        if reg_res.status_code == 400 and "already exists" in reg_res.text:
            pass
        else:
            assert reg_res.status_code == 201
            reg_data = reg_res.json()
            assert reg_data["email"] == unique_email
            assert reg_data["is_email_verified"] is True
            assert reg_data["profile"]["full_name"] == "Aarav Sharma"

        # 2. Login
        login_res = await client.post(
            "/auth/login", json={"email": unique_email, "password": password}
        )
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert "access_token" in login_data

        token = login_data["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # 3. Get /auth/me
        me_res = await client.get("/auth/me", headers=auth_headers)
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["email"] == unique_email
        assert me_data["college"]["name"] == "Indian Institute of Technology Delhi"

        # 4. Update Profile
        update_payload = {
            "bio": "Passionate about sustainable campus tech and vintage electronics.",
            "academic_year": "Final Year",
        }
        patch_res = await client.patch(
            "/users/me", json=update_payload, headers=auth_headers
        )
        assert patch_res.status_code == 200
        patch_data = patch_res.json()
        assert patch_data["bio"] == update_payload["bio"]
        assert patch_data["academic_year"] == "Final Year"

        # 5. Public Profile lookup
        user_id = me_data["id"]
        pub_res = await client.get(f"/users/{user_id}")
        assert pub_res.status_code == 200
        pub_data = pub_res.json()
        assert pub_data["college_name"] == "Indian Institute of Technology Delhi"
        assert pub_data["profile"]["full_name"] == "Aarav Sharma"


@pytest.mark.asyncio
async def test_any_email_domain_accepted():
    """Verify that any personal or campus email (e.g., Gmail, Outlook, Yahoo) can register and log in."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        gmail_email = "student.demo@gmail.com"
        reg_res = await client.post(
            "/auth/register",
            json={
                "email": gmail_email,
                "password": "Password123!",
                "full_name": "Demo Student",
            },
        )
        if reg_res.status_code == 400 and "already exists" in reg_res.text:
            pass
        else:
            assert reg_res.status_code == 201
            assert reg_res.json()["email"] == gmail_email

        # Login with Gmail ID
        login_res = await client.post(
            "/auth/login",
            json={"email": gmail_email, "password": "Password123!"},
        )
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()
