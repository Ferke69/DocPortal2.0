#!/usr/bin/env python3
"""
DocPortal Backend API Testing Suite
Tests the authentication and invite code system
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "https://progress-check-34.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def log_pass(self, test_name):
        print(f"✅ PASS: {test_name}")
        self.passed += 1
        
    def log_fail(self, test_name, error):
        print(f"❌ FAIL: {test_name} - {error}")
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        if self.errors:
            print(f"\nFAILED TESTS:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*60}")
        return self.failed == 0

def make_request(method, endpoint, data=None, headers=None, auth_token=None):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    request_headers = HEADERS.copy()
    
    if headers:
        request_headers.update(headers)
        
    if auth_token:
        request_headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=request_headers, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=request_headers, timeout=30)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=request_headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_provider_registration(results):
    """Test 1: Provider Registration"""
    print("\n🧪 Testing Provider Registration...")
    
    provider_data = {
        "email": f"provider_{int(time.time())}@docportal.com",
        "password": "SecurePass123!",
        "name": "Dr. Sarah Johnson",
        "userType": "provider",
        "specialty": "Family Medicine",
        "license": "MD123456",
        "bio": "Experienced family medicine physician",
        "hourlyRate": 150.0,
        "phone": "+1-555-0123"
    }
    
    response = make_request("POST", "/auth/register", provider_data)
    
    if not response:
        results.log_fail("Provider Registration", "Request failed")
        return None, None
        
    if response.status_code == 200 or response.status_code == 201:
        try:
            data = response.json()
            if "token" in data and "user" in data:
                user = data["user"]
                if user.get("userType") == "provider" and user.get("email") == provider_data["email"]:
                    results.log_pass("Provider Registration")
                    return data["token"], user
                else:
                    results.log_fail("Provider Registration", "Invalid user data returned")
            else:
                results.log_fail("Provider Registration", "Missing token or user in response")
        except json.JSONDecodeError:
            results.log_fail("Provider Registration", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Provider Registration", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Provider Registration", f"HTTP {response.status_code}: {response.text}")
    
    return None, None

def test_provider_login(results, provider_email, provider_password):
    """Test 2: Provider Login"""
    print("\n🧪 Testing Provider Login...")
    
    login_data = {
        "email": provider_email,
        "password": provider_password
    }
    
    response = make_request("POST", "/auth/login", login_data)
    
    if not response:
        results.log_fail("Provider Login", "Request failed")
        return None, None
        
    if response.status_code == 200:
        try:
            data = response.json()
            if "token" in data and "user" in data:
                user = data["user"]
                if user.get("userType") == "provider" and user.get("email") == provider_email:
                    results.log_pass("Provider Login")
                    return data["token"], user
                else:
                    results.log_fail("Provider Login", "Invalid user data returned")
            else:
                results.log_fail("Provider Login", "Missing token or user in response")
        except json.JSONDecodeError:
            results.log_fail("Provider Login", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Provider Login", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Provider Login", f"HTTP {response.status_code}: {response.text}")
    
    return None, None

def test_invite_code_generation(results, provider_token):
    """Test 3: Invite Code Generation"""
    print("\n🧪 Testing Invite Code Generation...")
    
    invite_data = {
        "expiresInDays": 7
    }
    
    response = make_request("POST", "/provider/invite-code", invite_data, auth_token=provider_token)
    
    if not response:
        results.log_fail("Invite Code Generation", "Request failed")
        return None
        
    if response.status_code == 200 or response.status_code == 201:
        try:
            data = response.json()
            if "code" in data and "expiresAt" in data:
                invite_code = data["code"]
                if len(invite_code) == 8:
                    results.log_pass("Invite Code Generation")
                    return invite_code
                else:
                    results.log_fail("Invite Code Generation", f"Invalid code length: {len(invite_code)}")
            else:
                results.log_fail("Invite Code Generation", "Missing code or expiresAt in response")
        except json.JSONDecodeError:
            results.log_fail("Invite Code Generation", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Invite Code Generation", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Invite Code Generation", f"HTTP {response.status_code}: {response.text}")
    
    return None

def test_list_invite_codes(results, provider_token):
    """Test 4: List Invite Codes"""
    print("\n🧪 Testing List Invite Codes...")
    
    response = make_request("GET", "/provider/invite-codes", auth_token=provider_token)
    
    if not response:
        results.log_fail("List Invite Codes", "Request failed")
        return
        
    if response.status_code == 200:
        try:
            data = response.json()
            if isinstance(data, list):
                results.log_pass("List Invite Codes")
            else:
                results.log_fail("List Invite Codes", "Response is not a list")
        except json.JSONDecodeError:
            results.log_fail("List Invite Codes", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("List Invite Codes", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("List Invite Codes", f"HTTP {response.status_code}: {response.text}")

def test_validate_invite_code(results, invite_code):
    """Test 5: Validate Invite Code"""
    print("\n🧪 Testing Validate Invite Code...")
    
    response = make_request("GET", f"/auth/validate-invite/{invite_code}")
    
    if not response:
        results.log_fail("Validate Invite Code", "Request failed")
        return False
        
    if response.status_code == 200:
        try:
            data = response.json()
            if "valid" in data and "provider" in data and data["valid"] is True:
                provider_info = data["provider"]
                if "name" in provider_info:
                    results.log_pass("Validate Invite Code")
                    return True
                else:
                    results.log_fail("Validate Invite Code", "Missing provider name in response")
            else:
                results.log_fail("Validate Invite Code", "Invalid validation response")
        except json.JSONDecodeError:
            results.log_fail("Validate Invite Code", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Validate Invite Code", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Validate Invite Code", f"HTTP {response.status_code}: {response.text}")
    
    return False

def test_client_registration_with_invite(results, invite_code, provider_id):
    """Test 6: Client Registration with Invite Code"""
    print("\n🧪 Testing Client Registration with Invite Code...")
    
    client_data = {
        "email": f"client_{int(time.time())}@docportal.com",
        "password": "ClientPass123!",
        "name": "John Smith",
        "userType": "client",
        "phone": "+1-555-0456",
        "dateOfBirth": "1985-06-15",
        "address": "123 Main St, Anytown, ST 12345",
        "insurance": "Blue Cross Blue Shield",
        "inviteCode": invite_code,
        "emergencyContact": {
            "name": "Jane Smith",
            "phone": "+1-555-0789",
            "relationship": "Spouse"
        }
    }
    
    response = make_request("POST", "/auth/register", client_data)
    
    if not response:
        results.log_fail("Client Registration with Invite Code", "Request failed")
        return None, None
        
    if response.status_code == 200 or response.status_code == 201:
        try:
            data = response.json()
            if "token" in data and "user" in data:
                user = data["user"]
                if (user.get("userType") == "client" and 
                    user.get("email") == client_data["email"] and
                    user.get("providerId") == provider_id):
                    results.log_pass("Client Registration with Invite Code")
                    return data["token"], user
                else:
                    results.log_fail("Client Registration with Invite Code", 
                                   f"Invalid user data: userType={user.get('userType')}, providerId={user.get('providerId')}")
            else:
                results.log_fail("Client Registration with Invite Code", "Missing token or user in response")
        except json.JSONDecodeError:
            results.log_fail("Client Registration with Invite Code", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Client Registration with Invite Code", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Client Registration with Invite Code", f"HTTP {response.status_code}: {response.text}")
    
    return None, None

def test_client_login(results, client_email, client_password):
    """Test 7: Client Login"""
    print("\n🧪 Testing Client Login...")
    
    login_data = {
        "email": client_email,
        "password": client_password
    }
    
    response = make_request("POST", "/auth/login", login_data)
    
    if not response:
        results.log_fail("Client Login", "Request failed")
        return None, None
        
    if response.status_code == 200:
        try:
            data = response.json()
            if "token" in data and "user" in data:
                user = data["user"]
                if user.get("userType") == "client" and user.get("email") == client_email:
                    results.log_pass("Client Login")
                    return data["token"], user
                else:
                    results.log_fail("Client Login", "Invalid user data returned")
            else:
                results.log_fail("Client Login", "Missing token or user in response")
        except json.JSONDecodeError:
            results.log_fail("Client Login", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Client Login", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Client Login", f"HTTP {response.status_code}: {response.text}")
    
    return None, None

def test_client_provider_link(results, client_user, provider_user):
    """Test 8: Verify Client is linked to Provider"""
    print("\n🧪 Testing Client-Provider Link...")
    
    client_provider_id = client_user.get("providerId")
    provider_id = provider_user.get("user_id")
    
    if client_provider_id == provider_id:
        results.log_pass("Client-Provider Link Verification")
        return True
    else:
        results.log_fail("Client-Provider Link Verification", 
                        f"Client providerId ({client_provider_id}) does not match provider ID ({provider_id})")
        return False

def test_api_health(results):
    """Test API Health Check"""
    print("\n🧪 Testing API Health...")
    
    response = make_request("GET", "/health")
    
    if not response:
        results.log_fail("API Health Check", "Request failed")
        return False
        
    if response.status_code == 200:
        try:
            data = response.json()
            if data.get("status") == "healthy":
                results.log_pass("API Health Check")
                return True
            else:
                results.log_fail("API Health Check", f"Unhealthy status: {data.get('status')}")
        except json.JSONDecodeError:
            results.log_fail("API Health Check", "Invalid JSON response")
    else:
        results.log_fail("API Health Check", f"HTTP {response.status_code}")
    
    return False

def main():
    """Main test execution"""
    print("🚀 Starting DocPortal Backend API Tests")
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = TestResults()
    
    # Test API Health first
    if not test_api_health(results):
        print("❌ API is not healthy, stopping tests")
        return False
    
    # Test 1: Provider Registration
    provider_token, provider_user = test_provider_registration(results)
    if not provider_token:
        print("❌ Provider registration failed, stopping tests")
        results.summary()
        return False
    
    provider_email = provider_user["email"]
    provider_password = "SecurePass123!"  # From registration
    provider_id = provider_user["user_id"]
    
    # Test 2: Provider Login
    provider_login_token, provider_login_user = test_provider_login(results, provider_email, provider_password)
    if not provider_login_token:
        print("❌ Provider login failed, continuing with registration token")
        provider_login_token = provider_token
        provider_login_user = provider_user
    
    # Test 3: Invite Code Generation
    invite_code = test_invite_code_generation(results, provider_login_token)
    if not invite_code:
        print("❌ Invite code generation failed, stopping tests")
        results.summary()
        return False
    
    # Test 4: List Invite Codes
    test_list_invite_codes(results, provider_login_token)
    
    # Test 5: Validate Invite Code
    if not test_validate_invite_code(results, invite_code):
        print("❌ Invite code validation failed, stopping tests")
        results.summary()
        return False
    
    # Test 6: Client Registration with Invite Code
    client_token, client_user = test_client_registration_with_invite(results, invite_code, provider_id)
    if not client_token:
        print("❌ Client registration failed, stopping tests")
        results.summary()
        return False
    
    client_email = client_user["email"]
    client_password = "ClientPass123!"  # From registration
    
    # Test 7: Client Login
    client_login_token, client_login_user = test_client_login(results, client_email, client_password)
    if not client_login_token:
        print("❌ Client login failed, continuing with registration data")
        client_login_user = client_user
    
    # Test 8: Verify Client-Provider Link
    test_client_provider_link(results, client_login_user, provider_login_user)
    
    # Final summary
    success = results.summary()
    
    if success:
        print("\n🎉 All tests passed! Authentication and invite code system is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)