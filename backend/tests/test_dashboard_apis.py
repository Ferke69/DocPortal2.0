"""
Backend API Tests for DocPortal Dashboard Components
Tests all dashboard-related APIs for both client and provider portals
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CLIENT_EMAIL = "testclient_1769486748@example.com"
CLIENT_PASSWORD = "TestPass123!"
PROVIDER_EMAIL = "testprovider@example.com"
PROVIDER_PASSWORD = "TestPass123!"


class TestHealthCheck:
    """Health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "database" in data
        print("✓ Health endpoint working")


class TestClientDashboard:
    """Client dashboard API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get client token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200, f"Client login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.user_id = data["user"]["user_id"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_client_dashboard_stats(self):
        """Test client dashboard returns stats"""
        response = requests.get(f"{BASE_URL}/api/client/dashboard", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "upcomingAppointments" in data
        assert "pendingPayments" in data
        assert "unreadMessages" in data
        assert "completedSessions" in data
        print(f"✓ Client dashboard stats: {data}")
    
    def test_client_appointments(self):
        """Test client appointments endpoint"""
        response = requests.get(f"{BASE_URL}/api/client/appointments?status=pending", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Client appointments: {len(data)} pending appointments")
    
    def test_client_provider(self):
        """Test client provider endpoint (may return 404 if no provider assigned)"""
        response = requests.get(f"{BASE_URL}/api/client/provider", headers=self.headers)
        # 404 is acceptable if no provider assigned
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "name" in data
            print(f"✓ Client provider: {data.get('name')}")
        else:
            print("✓ Client provider: No provider assigned (expected)")


class TestProviderDashboard:
    """Provider dashboard API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get provider token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        assert response.status_code == 200, f"Provider login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.user_id = data["user"]["user_id"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_provider_dashboard_stats(self):
        """Test provider dashboard returns stats"""
        response = requests.get(f"{BASE_URL}/api/provider/dashboard", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "totalIncome" in data
        assert "monthlyIncome" in data
        assert "appointmentsToday" in data
        assert "appointmentsWeek" in data
        assert "pendingNotes" in data
        assert "activeClients" in data
        print(f"✓ Provider dashboard stats: {data}")
    
    def test_provider_appointments(self):
        """Test provider appointments endpoint"""
        response = requests.get(f"{BASE_URL}/api/provider/appointments", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Provider appointments: {len(data)} appointments")
    
    def test_provider_clients(self):
        """Test provider clients endpoint"""
        response = requests.get(f"{BASE_URL}/api/provider/clients", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Provider clients: {len(data)} clients")


class TestMessagesAPI:
    """Messages API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get client token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        self.token = data["token"]
        self.user_id = data["user"]["user_id"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_messages(self):
        """Test get messages endpoint"""
        response = requests.get(f"{BASE_URL}/api/messages", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Messages: {len(data)} messages")


class TestBillingAPI:
    """Billing API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get client token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        self.token = data["token"]
        self.user_id = data["user"]["user_id"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_invoices(self):
        """Test get invoices endpoint"""
        response = requests.get(f"{BASE_URL}/api/billing/invoices", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Invoices: {len(data)} invoices")


class TestAppointmentBooking:
    """Appointment booking API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get client token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        self.token = data["token"]
        self.user_id = data["user"]["user_id"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_providers_list(self):
        """Test get providers list for appointment booking"""
        response = requests.get(f"{BASE_URL}/api/auth/users/providers", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "No providers found"
        # Verify provider data structure
        provider = data[0]
        assert "user_id" in provider
        assert "name" in provider
        assert "userType" in provider
        assert provider["userType"] == "provider"
        print(f"✓ Providers list: {len(data)} providers")
    
    def test_create_appointment(self):
        """Test create appointment endpoint"""
        # Get a provider first
        providers_response = requests.get(f"{BASE_URL}/api/auth/users/providers", headers=self.headers)
        providers = providers_response.json()
        provider_id = providers[0]["user_id"]
        
        # Create appointment
        appointment_data = {
            "clientId": self.user_id,
            "providerId": provider_id,
            "date": "2026-03-01",
            "time": "11:00 AM",
            "duration": 60,
            "type": "Follow-up Session",
            "amount": 150
        }
        
        response = requests.post(f"{BASE_URL}/api/appointments", 
                                json=appointment_data, 
                                headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "videoLink" in data
        assert "status" in data
        assert data["status"] == "pending"
        print(f"✓ Appointment created: {data['id']}")
        print(f"  Video link: {data['videoLink']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
