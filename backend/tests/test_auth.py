"""
Backend API Tests for DocPortal Authentication
Tests registration, login, and user management endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health check endpoint tests - run first"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "database" in data
        print(f"Health check passed: {data}")


class TestClientRegistration:
    """Client registration flow tests"""
    
    def test_register_client_success(self):
        """Test successful client registration"""
        timestamp = int(time.time())
        payload = {
            "email": f"TEST_client_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": "Test Client",
            "userType": "client",
            "phone": "(555) 123-4567"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=payload
        )
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Token missing from response"
        assert "user" in data, "User data missing from response"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == payload["email"]
        assert user["name"] == payload["name"]
        assert user["userType"] == "client"
        assert "user_id" in user
        
        print(f"Client registration successful: {user['email']}")
        return data
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email fails"""
        timestamp = int(time.time())
        payload = {
            "email": f"TEST_duplicate_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": "Test User",
            "userType": "client"
        }
        
        # First registration should succeed
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response1.status_code == 200
        
        # Second registration with same email should fail
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response2.status_code == 400
        
        data = response2.json()
        assert "already registered" in data.get("detail", "").lower()
        print("Duplicate email rejection working correctly")


class TestProviderRegistration:
    """Provider registration flow tests"""
    
    def test_register_provider_success(self):
        """Test successful provider registration"""
        timestamp = int(time.time())
        payload = {
            "email": f"TEST_provider_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": "Dr. Test Provider",
            "userType": "provider",
            "phone": "(555) 987-6543",
            "specialty": "Clinical Psychologist",
            "license": "PSY-12345",
            "hourlyRate": 150
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=payload
        )
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data
        assert "user" in data
        
        # Verify user data
        user = data["user"]
        assert user["email"] == payload["email"]
        assert user["name"] == payload["name"]
        assert user["userType"] == "provider"
        assert user.get("specialty") == payload["specialty"]
        
        print(f"Provider registration successful: {user['email']}")
        return data


class TestLogin:
    """Login flow tests"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        # First register a user
        timestamp = int(time.time())
        email = f"TEST_login_{timestamp}@example.com"
        password = "TestPass123!"
        
        register_payload = {
            "email": email,
            "password": password,
            "name": "Test Login User",
            "userType": "client"
        }
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
        assert reg_response.status_code == 200
        
        # Now test login
        login_payload = {
            "email": email,
            "password": password
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == email
        
        print(f"Login successful for: {email}")
        return data
    
    def test_login_invalid_password(self):
        """Test login with invalid password fails"""
        # First register a user
        timestamp = int(time.time())
        email = f"TEST_invalid_pwd_{timestamp}@example.com"
        
        register_payload = {
            "email": email,
            "password": "CorrectPass123!",
            "name": "Test User",
            "userType": "client"
        }
        
        requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
        
        # Try login with wrong password
        login_payload = {
            "email": email,
            "password": "WrongPassword123!"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert response.status_code == 401
        print("Invalid password rejection working correctly")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email fails"""
        login_payload = {
            "email": "nonexistent_user_12345@example.com",
            "password": "SomePassword123!"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert response.status_code == 401
        print("Non-existent user rejection working correctly")


class TestAuthenticatedEndpoints:
    """Tests for authenticated endpoints"""
    
    def test_get_me_with_valid_token(self):
        """Test /auth/me endpoint with valid token"""
        # Register and get token
        timestamp = int(time.time())
        email = f"TEST_me_{timestamp}@example.com"
        
        register_payload = {
            "email": email,
            "password": "TestPass123!",
            "name": "Test Me User",
            "userType": "client"
        }
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
        assert reg_response.status_code == 200
        token = reg_response.json()["token"]
        
        # Test /auth/me
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email
        assert "password" not in data  # Password should not be returned
        
        print(f"Auth/me endpoint working for: {email}")
    
    def test_get_me_without_token(self):
        """Test /auth/me endpoint without token fails"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        # Accept both 401 (Unauthorized) and 403 (Forbidden) as valid rejection responses
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
        print(f"Unauthorized access rejection working correctly (status: {response.status_code})")
    
    def test_get_me_with_invalid_token(self):
        """Test /auth/me endpoint with invalid token fails"""
        headers = {"Authorization": "Bearer invalid_token_12345"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 401
        print("Invalid token rejection working correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
