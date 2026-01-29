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
BASE_URL = "https://doctor-patient-swap.preview.emergentagent.com/api"
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

def test_specific_provider_login(results):
    """Test specific provider login from review request"""
    print("\n🧪 Testing Specific Provider Login (testprovider_ui@example.com)...")
    
    login_data = {
        "email": "testprovider_ui@example.com",
        "password": "TestPass123!"
    }
    
    response = make_request("POST", "/auth/login", login_data)
    
    if not response:
        results.log_fail("Specific Provider Login", "Request failed")
        return None, None
        
    if response.status_code == 200:
        try:
            data = response.json()
            if "token" in data and "user" in data:
                user = data["user"]
                if user.get("userType") == "provider":
                    results.log_pass("Specific Provider Login")
                    return data["token"], user
                else:
                    results.log_fail("Specific Provider Login", "Invalid user type returned")
            else:
                results.log_fail("Specific Provider Login", "Missing token or user in response")
        except json.JSONDecodeError:
            results.log_fail("Specific Provider Login", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Specific Provider Login", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Specific Provider Login", f"HTTP {response.status_code}: {response.text}")
    
    return None, None

def test_get_provider_clients(results, provider_token):
    """Test getting provider's clients"""
    print("\n🧪 Testing Get Provider's Clients...")
    
    response = make_request("GET", "/provider/clients", auth_token=provider_token)
    
    if not response:
        results.log_fail("Get Provider Clients", "Request failed")
        return False
        
    if response.status_code == 200:
        try:
            data = response.json()
            if isinstance(data, list):
                # Check if Emily Thompson is in the list
                emily_found = False
                for client in data:
                    if "Emily Thompson" in client.get("name", ""):
                        emily_found = True
                        break
                
                if emily_found:
                    results.log_pass("Get Provider Clients (Emily Thompson found)")
                else:
                    results.log_pass("Get Provider Clients (no Emily Thompson, but API working)")
                    print("  Note: Emily Thompson not found in client list")
                return True
            else:
                results.log_fail("Get Provider Clients", "Response is not a list")
        except json.JSONDecodeError:
            results.log_fail("Get Provider Clients", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Get Provider Clients", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Get Provider Clients", f"HTTP {response.status_code}: {response.text}")
    
    return False

def test_specific_client_login(results):
    """Test specific client login from review request"""
    print("\n🧪 Testing Specific Client Login (testclient_ui@example.com)...")
    
    login_data = {
        "email": "testclient_ui@example.com",
        "password": "TestPass123!"
    }
    
    response = make_request("POST", "/auth/login", login_data)
    
    if not response:
        results.log_fail("Specific Client Login", "Request failed")
        return None, None
        
    if response.status_code == 200:
        try:
            data = response.json()
            if "token" in data and "user" in data:
                user = data["user"]
                if user.get("userType") == "client":
                    results.log_pass("Specific Client Login")
                    return data["token"], user
                else:
                    results.log_fail("Specific Client Login", "Invalid user type returned")
            else:
                results.log_fail("Specific Client Login", "Missing token or user in response")
        except json.JSONDecodeError:
            results.log_fail("Specific Client Login", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Specific Client Login", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Specific Client Login", f"HTTP {response.status_code}: {response.text}")
    
    return None, None

def test_get_client_provider(results, client_token):
    """Test getting client's assigned provider"""
    print("\n🧪 Testing Get Client's Assigned Provider...")
    
    response = make_request("GET", "/client/provider", auth_token=client_token)
    
    if not response:
        results.log_fail("Get Client Provider", "Request failed")
        return False
        
    if response.status_code == 200:
        try:
            data = response.json()
            if "name" in data:
                provider_name = data.get("name", "")
                if "Dr. Sarah Johnson" in provider_name:
                    results.log_pass("Get Client Provider (Dr. Sarah Johnson found)")
                else:
                    results.log_pass("Get Client Provider (API working)")
                    print(f"  Note: Provider name is '{provider_name}', not 'Dr. Sarah Johnson'")
                return True
            else:
                results.log_fail("Get Client Provider", "Missing provider name in response")
        except json.JSONDecodeError:
            results.log_fail("Get Client Provider", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Get Client Provider", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Get Client Provider", f"HTTP {response.status_code}: {response.text}")
    
    return False

def test_send_message_provider_to_client(results, provider_token, provider_user, client_user):
    """Test sending message from provider to client"""
    print("\n🧪 Testing Send Message (Provider to Client)...")
    
    message_data = {
        "senderId": provider_user["user_id"],
        "receiverId": client_user["user_id"],
        "senderType": "provider",
        "message": "Hello! This is a test message from your provider. How are you feeling today?"
    }
    
    response = make_request("POST", "/messages", message_data, auth_token=provider_token)
    
    if not response:
        results.log_fail("Send Message (Provider to Client)", "Request failed")
        return None
        
    if response.status_code == 200 or response.status_code == 201:
        try:
            data = response.json()
            if "message" in data and "id" in data:
                results.log_pass("Send Message (Provider to Client)")
                return data["id"]
            else:
                results.log_fail("Send Message (Provider to Client)", "Missing message or id in response")
        except json.JSONDecodeError:
            results.log_fail("Send Message (Provider to Client)", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Send Message (Provider to Client)", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Send Message (Provider to Client)", f"HTTP {response.status_code}: {response.text}")
    
    return None

def test_send_message_client_to_provider(results, client_token, client_user, provider_user):
    """Test sending message from client to provider"""
    print("\n🧪 Testing Send Message (Client to Provider)...")
    
    message_data = {
        "senderId": client_user["user_id"],
        "receiverId": provider_user["user_id"],
        "senderType": "client",
        "message": "Thank you for your message! I'm doing well and looking forward to our next appointment."
    }
    
    response = make_request("POST", "/messages", message_data, auth_token=client_token)
    
    if not response:
        results.log_fail("Send Message (Client to Provider)", "Request failed")
        return None
        
    if response.status_code == 200 or response.status_code == 201:
        try:
            data = response.json()
            if "message" in data and "id" in data:
                results.log_pass("Send Message (Client to Provider)")
                return data["id"]
            else:
                results.log_fail("Send Message (Client to Provider)", "Missing message or id in response")
        except json.JSONDecodeError:
            results.log_fail("Send Message (Client to Provider)", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Send Message (Client to Provider)", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Send Message (Client to Provider)", f"HTTP {response.status_code}: {response.text}")
    
    return None

def test_get_messages(results, provider_token, client_token, provider_user, client_user):
    """Test getting messages between provider and client"""
    print("\n🧪 Testing Get Messages...")
    
    # Test provider getting messages
    response = make_request("GET", f"/messages?conversationWith={client_user['user_id']}", auth_token=provider_token)
    
    if not response:
        results.log_fail("Get Messages (Provider)", "Request failed")
        return False
        
    if response.status_code == 200:
        try:
            messages = response.json()
            if isinstance(messages, list):
                # Check if we have messages between provider and client
                found_messages = len(messages) > 0
                if found_messages:
                    results.log_pass("Get Messages (Provider)")
                else:
                    results.log_pass("Get Messages (Provider) - No messages found but API working")
            else:
                results.log_fail("Get Messages (Provider)", "Response is not a list")
                return False
        except json.JSONDecodeError:
            results.log_fail("Get Messages (Provider)", "Invalid JSON response")
            return False
    else:
        try:
            error_data = response.json()
            results.log_fail("Get Messages (Provider)", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Get Messages (Provider)", f"HTTP {response.status_code}: {response.text}")
        return False
    
    # Test client getting messages
    response = make_request("GET", f"/messages?conversationWith={provider_user['user_id']}", auth_token=client_token)
    
    if not response:
        results.log_fail("Get Messages (Client)", "Request failed")
        return False
        
    if response.status_code == 200:
        try:
            messages = response.json()
            if isinstance(messages, list):
                results.log_pass("Get Messages (Client)")
                return True
            else:
                results.log_fail("Get Messages (Client)", "Response is not a list")
        except json.JSONDecodeError:
            results.log_fail("Get Messages (Client)", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Get Messages (Client)", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Get Messages (Client)", f"HTTP {response.status_code}: {response.text}")
    
    return False

def test_create_appointment(results, client_token, client_user, provider_user):
    """Test creating appointment from client"""
    print("\n🧪 Testing Create Appointment (Client booking)...")
    
    appointment_data = {
        "clientId": client_user["user_id"],
        "providerId": provider_user["user_id"],
        "date": "2025-01-20",
        "time": "14:00",
        "duration": 60,
        "type": "Consultation",
        "notes": "Follow-up appointment to discuss treatment progress",
        "amount": 150.0
    }
    
    response = make_request("POST", "/appointments", appointment_data, auth_token=client_token)
    
    if not response:
        results.log_fail("Create Appointment", "Request failed")
        return None
        
    if response.status_code == 200 or response.status_code == 201:
        try:
            data = response.json()
            if "id" in data and "videoLink" in data:
                results.log_pass("Create Appointment")
                return data["id"]
            else:
                results.log_fail("Create Appointment", "Missing id or videoLink in response")
        except json.JSONDecodeError:
            results.log_fail("Create Appointment", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Create Appointment", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Create Appointment", f"HTTP {response.status_code}: {response.text}")
    
    return None

def test_get_appointment(results, appointment_id, client_token, provider_token):
    """Test getting appointment details"""
    print("\n🧪 Testing Get Appointment Details...")
    
    # Test client getting appointment
    response = make_request("GET", f"/appointments/{appointment_id}", auth_token=client_token)
    
    if not response:
        results.log_fail("Get Appointment (Client)", "Request failed")
        return False
        
    if response.status_code == 200:
        try:
            appointment = response.json()
            if "videoLink" in appointment and "status" in appointment:
                results.log_pass("Get Appointment (Client)")
                print(f"  ✓ Video link generated: {appointment['videoLink']}")
                print(f"  ✓ Status: {appointment['status']}")
            else:
                results.log_fail("Get Appointment (Client)", "Missing videoLink or status in response")
                return False
        except json.JSONDecodeError:
            results.log_fail("Get Appointment (Client)", "Invalid JSON response")
            return False
    else:
        try:
            error_data = response.json()
            results.log_fail("Get Appointment (Client)", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Get Appointment (Client)", f"HTTP {response.status_code}: {response.text}")
        return False
    
    # Test provider getting appointment
    response = make_request("GET", f"/appointments/{appointment_id}", auth_token=provider_token)
    
    if not response:
        results.log_fail("Get Appointment (Provider)", "Request failed")
        return False
        
    if response.status_code == 200:
        try:
            appointment = response.json()
            if "videoLink" in appointment and "status" in appointment:
                results.log_pass("Get Appointment (Provider)")
                return True
            else:
                results.log_fail("Get Appointment (Provider)", "Missing videoLink or status in response")
        except json.JSONDecodeError:
            results.log_fail("Get Appointment (Provider)", "Invalid JSON response")
    else:
        try:
            error_data = response.json()
            results.log_fail("Get Appointment (Provider)", f"HTTP {response.status_code}: {error_data.get('detail', 'Unknown error')}")
        except:
            results.log_fail("Get Appointment (Provider)", f"HTTP {response.status_code}: {response.text}")
    
    return False

def test_review_request_scenario(results):
    """Test the specific review request scenario"""
    print("🚀 Starting Review Request Scenario Test")
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("\nTesting complete provider-client workflow:")
    print("1. Login as provider: testdoctor85487@example.com")
    print("2. Generate a new invite code if needed")
    print("3. Register a new client using that invite code")
    print("4. Login as the client")
    print("5. Send a message from client to provider")
    print("6. Get provider's messages to verify")
    print("7. Book an appointment as the client")
    print("8. Verify the appointment appears")
    
    # Test API Health first
    if not test_api_health(results):
        print("❌ API is not healthy, stopping tests")
        return False
    
    # Step 1: Login as the specific provider
    print("\n🧪 Step 1: Login as provider testdoctor85487@example.com...")
    login_data = {
        "email": "testdoctor85487@example.com",
        "password": "TestPass123!"
    }
    
    response = make_request("POST", "/auth/login", login_data)
    if not response or response.status_code != 200:
        results.log_fail("Provider Login (testdoctor85487@example.com)", "Login failed - provider may not exist")
        return False
    
    try:
        provider_data = response.json()
        provider_token = provider_data["token"]
        provider_user = provider_data["user"]
        results.log_pass("Provider Login (testdoctor85487@example.com)")
    except:
        results.log_fail("Provider Login (testdoctor85487@example.com)", "Invalid response format")
        return False
    
    # Step 2: Generate invite code
    print("\n🧪 Step 2: Generate invite code...")
    invite_code = test_invite_code_generation(results, provider_token)
    if not invite_code:
        print("❌ Invite code generation failed, stopping tests")
        return False
    
    # Step 3: Register new client with invite code
    print("\n🧪 Step 3: Register new client with invite code...")
    client_email = f"newclient_{int(time.time())}@example.com"
    client_password = "ClientPass123!"
    
    client_data = {
        "email": client_email,
        "password": client_password,
        "name": "Test Client User",
        "userType": "client",
        "phone": "+1-555-9999",
        "dateOfBirth": "1990-05-15",
        "address": "456 Test St, Test City, TC 54321",
        "insurance": "Test Insurance",
        "inviteCode": invite_code,
        "emergencyContact": {
            "name": "Emergency Contact",
            "phone": "+1-555-8888",
            "relationship": "Friend"
        }
    }
    
    response = make_request("POST", "/auth/register", client_data)
    if not response or (response.status_code != 200 and response.status_code != 201):
        results.log_fail("Client Registration with Invite Code", "Registration failed")
        return False
    
    try:
        client_reg_data = response.json()
        results.log_pass("Client Registration with Invite Code")
    except:
        results.log_fail("Client Registration with Invite Code", "Invalid response format")
        return False
    
    # Step 4: Login as the client
    print("\n🧪 Step 4: Login as the client...")
    client_login_data = {
        "email": client_email,
        "password": client_password
    }
    
    response = make_request("POST", "/auth/login", client_login_data)
    if not response or response.status_code != 200:
        results.log_fail("Client Login", "Login failed")
        return False
    
    try:
        client_data = response.json()
        client_token = client_data["token"]
        client_user = client_data["user"]
        results.log_pass("Client Login")
    except:
        results.log_fail("Client Login", "Invalid response format")
        return False
    
    # Step 5: Send message from client to provider
    print("\n🧪 Step 5: Send message from client to provider...")
    message_data = {
        "senderId": client_user["user_id"],
        "receiverId": provider_user["user_id"],
        "senderType": "client",
        "message": "Hello Dr. Johnson! I hope you're doing well. I wanted to reach out about scheduling our next appointment and discuss my recent symptoms."
    }
    
    response = make_request("POST", "/messages", message_data, auth_token=client_token)
    if not response or (response.status_code != 200 and response.status_code != 201):
        results.log_fail("Send Message (Client to Provider)", "Message sending failed")
        return False
    
    try:
        message_response = response.json()
        results.log_pass("Send Message (Client to Provider)")
    except:
        results.log_fail("Send Message (Client to Provider)", "Invalid response format")
        return False
    
    # Step 6: Get provider's messages to verify
    print("\n🧪 Step 6: Get provider's messages to verify...")
    response = make_request("GET", f"/messages?conversationWith={client_user['user_id']}", auth_token=provider_token)
    if not response or response.status_code != 200:
        results.log_fail("Get Provider Messages", "Failed to retrieve messages")
        return False
    
    try:
        messages = response.json()
        if isinstance(messages, list) and len(messages) > 0:
            results.log_pass("Get Provider Messages")
            print(f"  ✓ Found {len(messages)} message(s) in conversation")
        else:
            results.log_fail("Get Provider Messages", "No messages found")
            return False
    except:
        results.log_fail("Get Provider Messages", "Invalid response format")
        return False
    
    # Step 7: Book appointment as client
    print("\n🧪 Step 7: Book appointment as client...")
    appointment_data = {
        "clientId": client_user["user_id"],
        "providerId": provider_user["user_id"],
        "date": "2025-01-25",
        "time": "10:00",
        "duration": 60,
        "type": "Follow-up Consultation",
        "notes": "Follow-up appointment to discuss treatment progress and review test results",
        "amount": 200.0
    }
    
    response = make_request("POST", "/appointments", appointment_data, auth_token=client_token)
    if not response or (response.status_code != 200 and response.status_code != 201):
        results.log_fail("Create Appointment", "Appointment booking failed")
        return False
    
    try:
        appointment_response = response.json()
        appointment_id = appointment_response["id"]
        results.log_pass("Create Appointment")
        print(f"  ✓ Appointment ID: {appointment_id}")
        print(f"  ✓ Video Link: {appointment_response.get('videoLink', 'N/A')}")
    except:
        results.log_fail("Create Appointment", "Invalid response format")
        return False
    
    # Step 8: Verify appointment appears
    print("\n🧪 Step 8: Verify appointment appears...")
    
    # Check from client perspective
    response = make_request("GET", f"/appointments/{appointment_id}", auth_token=client_token)
    if not response or response.status_code != 200:
        results.log_fail("Verify Appointment (Client)", "Failed to retrieve appointment")
        return False
    
    try:
        client_appointment = response.json()
        results.log_pass("Verify Appointment (Client)")
    except:
        results.log_fail("Verify Appointment (Client)", "Invalid response format")
        return False
    
    # Check from provider perspective
    response = make_request("GET", f"/appointments/{appointment_id}", auth_token=provider_token)
    if not response or response.status_code != 200:
        results.log_fail("Verify Appointment (Provider)", "Failed to retrieve appointment")
        return False
    
    try:
        provider_appointment = response.json()
        results.log_pass("Verify Appointment (Provider)")
        print(f"  ✓ Status: {provider_appointment.get('status', 'N/A')}")
        print(f"  ✓ Date/Time: {provider_appointment.get('date', 'N/A')} at {provider_appointment.get('time', 'N/A')}")
    except:
        results.log_fail("Verify Appointment (Provider)", "Invalid response format")
        return False
    
    return True

def main():
    """Main test execution - Review Request Scenario"""
    results = TestResults()
    
    # Run the specific review request scenario
    success = test_review_request_scenario(results)
    
    # Final summary
    results.summary()
    
    if success:
        print("\n🎉 Review Request Scenario Test PASSED!")
        print("✅ Complete provider-client workflow is working correctly!")
        print("✅ All 8 steps completed successfully:")
        print("  1. ✅ Provider login")
        print("  2. ✅ Invite code generation")
        print("  3. ✅ Client registration with invite code")
        print("  4. ✅ Client login")
        print("  5. ✅ Message sending (client → provider)")
        print("  6. ✅ Message retrieval (provider)")
        print("  7. ✅ Appointment booking (client)")
        print("  8. ✅ Appointment verification (both sides)")
    else:
        print("\n⚠️  Review Request Scenario Test FAILED!")
        print("❌ Some steps in the workflow are not working correctly.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)