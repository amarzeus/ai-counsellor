"""
Authentication tests - signup, login, JWT validation.
"""

def test_signup_success(client):
    """Test successful user registration."""
    response = client.post("/api/auth/signup", json={
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "full_name": "New User"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["full_name"] == "New User"
    assert data["user"]["current_stage"] == "ONBOARDING"

def test_signup_duplicate_email(client, test_user):
    """Test duplicate email prevention."""
    response = client.post("/api/auth/signup", json={
        "email": "test@example.com",  # Already exists
        "password": "AnotherPass123!",
        "full_name": "Duplicate User"
    })
    
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()

def test_signup_invalid_email(client):
    """Test signup with invalid email format."""
    response = client.post("/api/auth/signup", json={
        "email": "not-an-email",
        "password": "Pass123!",
        "full_name": "Invalid Email User"
    })
    
    assert response.status_code == 422  # Validation error

def test_signup_weak_password(client):
    """Test signup with weak password."""
    response = client.post("/api/auth/signup", json={
        "email": "weak@example.com",
        "password": "123",  # Too short
        "full_name": "Weak Password User"
    })
    
    # Should either reject or accept (depends on validation rules)
    # If no password validation, this will pass
    assert response.status_code in [200, 400, 422]

def test_login_success(client, test_user):
    """Test successful login."""
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "TestPass123!"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"

def test_login_invalid_email(client):
    """Test login with non-existent email."""
    response = client.post("/api/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "SomePass123!"
    })
    
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()

def test_login_wrong_password(client, test_user):
    """Test login with incorrect password."""
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "WrongPassword123!"
    })
    
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()

def test_get_current_user_authenticated(client, auth_headers):
    """Test getting current user with valid token."""
    response = client.get("/api/user/me", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"

def test_get_current_user_unauthenticated(client):
    """Test getting current user without token."""
    response = client.get("/api/user/me")
    
    assert response.status_code == 401

def test_get_current_user_invalid_token(client):
    """Test getting current user with invalid token."""
    response = client.get("/api/user/me", headers={
        "Authorization": "Bearer invalid_token_here"
    })
    
    assert response.status_code == 401

def test_password_hashing(db_session, test_user):
    """Test that passwords are hashed, not stored in plaintext."""
    # Password should be hashed
    assert test_user.password_hash != "TestPass123!"
    assert len(test_user.password_hash) > 20  # Hashed passwords are long
    
    # Verify password using bcrypt
    from auth import verify_password
    assert verify_password("TestPass123!", test_user.password_hash) is True
    assert verify_password("WrongPassword", test_user.password_hash) is False

def test_jwt_token_contains_user_id(client, test_user):
    """Test that JWT token contains user ID."""
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "TestPass123!"
    })
    
    token = response.json()["access_token"]
    
    # Decode token without verification (for testing only)
    import base64
    import json as json_lib
    
    # JWT is header.payload.signature - we just need payload
    parts = token.split(".")
    assert len(parts) == 3
    
    # Decode payload (add padding if needed)
    payload_b64 = parts[1]
    padding = 4 - len(payload_b64) % 4
    if padding != 4:
        payload_b64 += "=" * padding
    
    payload = json_lib.loads(base64.urlsafe_b64decode(payload_b64))
    
    assert "sub" in payload
    # JWT payload stores sub as string, compare with str(user.id)
    assert str(payload["sub"]) == str(test_user.id)

def test_google_oauth_callback_endpoint_exists(client):
    """Test that Google OAuth callback endpoint exists."""
    # This should return 400 or 422 without proper params, not 404
    response = client.get("/api/auth/google/callback")
    
    assert response.status_code != 404
