"""
Test suite for Pending Items API endpoints
Tests: GET /api/provider/pending-items/summary, GET /api/provider/pending-items,
       POST /api/provider/pending-items, PUT /api/provider/pending-items/{id},
       DELETE /api/provider/pending-items/{id}, POST /api/provider/pending-items/{id}/mark-paid,
       POST /api/provider/pending-items/{id}/mark-unpaid
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
PROVIDER_EMAIL = "testprovider@example.com"
PROVIDER_PASSWORD = "password123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def provider_token(api_client):
    """Get provider authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": PROVIDER_EMAIL,
        "password": PROVIDER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Provider authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def authenticated_client(api_client, provider_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {provider_token}"})
    return api_client


@pytest.fixture(scope="module")
def provider_info(authenticated_client):
    """Get provider user info"""
    response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
    if response.status_code == 200:
        return response.json()
    return {"userId": "unknown"}


class TestPendingItemsSummary:
    """Tests for GET /api/provider/pending-items/summary"""
    
    def test_get_summary_success(self, authenticated_client):
        """Test getting pending items summary"""
        response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items/summary")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "videoSessionsCount" in data, "Missing videoSessionsCount in response"
        assert "ordersCount" in data, "Missing ordersCount in response"
        assert "totalPending" in data, "Missing totalPending in response"
        assert "highUrgencyCount" in data, "Missing highUrgencyCount in response"
        
        # Verify data types
        assert isinstance(data["videoSessionsCount"], int), "videoSessionsCount should be int"
        assert isinstance(data["ordersCount"], int), "ordersCount should be int"
        assert isinstance(data["totalPending"], int), "totalPending should be int"
        assert isinstance(data["highUrgencyCount"], int), "highUrgencyCount should be int"
        
        print(f"Summary: {data}")
    
    def test_summary_requires_auth(self, api_client):
        """Test that summary endpoint requires authentication"""
        # Create a new session without auth
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.get(f"{BASE_URL}/api/provider/pending-items/summary")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"


class TestPendingItemsList:
    """Tests for GET /api/provider/pending-items"""
    
    def test_get_all_items(self, authenticated_client):
        """Test getting all pending items"""
        response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # If items exist, verify structure
        if len(data) > 0:
            item = data[0]
            assert "id" in item, "Item should have id"
            assert "type" in item, "Item should have type"
            assert "status" in item, "Item should have status"
            assert "title" in item, "Item should have title"
            assert "clientName" in item, "Item should have clientName"
            assert "urgency" in item, "Item should have urgency"
            print(f"Found {len(data)} items, first item: {item}")
        else:
            print("No pending items found")
    
    def test_filter_by_status_open(self, authenticated_client):
        """Test filtering items by status=open"""
        response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items?status=open")
        
        assert response.status_code == 200
        data = response.json()
        
        # All items should have status=open
        for item in data:
            assert item["status"] == "open", f"Expected status=open, got {item['status']}"
        print(f"Found {len(data)} open items")
    
    def test_filter_by_status_paid(self, authenticated_client):
        """Test filtering items by status=paid"""
        response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items?status=paid")
        
        assert response.status_code == 200
        data = response.json()
        
        for item in data:
            assert item["status"] == "paid", f"Expected status=paid, got {item['status']}"
        print(f"Found {len(data)} paid items")
    
    def test_filter_by_status_unpaid(self, authenticated_client):
        """Test filtering items by status=unpaid"""
        response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items?status=unpaid")
        
        assert response.status_code == 200
        data = response.json()
        
        for item in data:
            assert item["status"] == "unpaid", f"Expected status=unpaid, got {item['status']}"
        print(f"Found {len(data)} unpaid items")
    
    def test_filter_by_type_video_session(self, authenticated_client):
        """Test filtering items by type=video_session"""
        response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items?type=video_session")
        
        assert response.status_code == 200
        data = response.json()
        
        for item in data:
            assert item["type"] == "video_session", f"Expected type=video_session, got {item['type']}"
        print(f"Found {len(data)} video session items")
    
    def test_filter_by_type_order(self, authenticated_client):
        """Test filtering items by type=order"""
        response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items?type=order")
        
        assert response.status_code == 200
        data = response.json()
        
        for item in data:
            assert item["type"] == "order", f"Expected type=order, got {item['type']}"
        print(f"Found {len(data)} order items")
    
    def test_sort_by_date_desc(self, authenticated_client):
        """Test sorting by date descending"""
        response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items?sort_by=createdAt&sort_order=desc")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify items are sorted by date descending
        if len(data) > 1:
            for i in range(len(data) - 1):
                if data[i].get("createdAt") and data[i+1].get("createdAt"):
                    assert data[i]["createdAt"] >= data[i+1]["createdAt"], "Items should be sorted by date desc"
        print(f"Sorted {len(data)} items by date desc")
    
    def test_sort_by_amount(self, authenticated_client):
        """Test sorting by amount"""
        response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items?sort_by=amount&sort_order=desc")
        
        assert response.status_code == 200
        data = response.json()
        print(f"Sorted {len(data)} items by amount")


class TestPendingItemsCRUD:
    """Tests for CRUD operations on pending items"""
    
    def test_create_pending_item(self, authenticated_client, provider_info):
        """Test creating a new pending item"""
        provider_id = provider_info.get("userId", provider_info.get("user_id", "unknown"))
        
        # Create a test item
        item_data = {
            "type": "video_session",
            "title": "TEST_Video Session - Test Client",
            "clientId": "test-client-id",
            "providerId": provider_id,
            "amount": 150.00,
            "status": "open",
            "description": "Test video session for automated testing"
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/provider/pending-items", json=item_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain item id"
        assert "message" in data, "Response should contain message"
        
        print(f"Created item with id: {data['id']}")
        return data["id"]
    
    def test_create_and_verify_persistence(self, authenticated_client, provider_info):
        """Test creating item and verifying it persists via GET"""
        provider_id = provider_info.get("userId", provider_info.get("user_id", "unknown"))
        
        # Create item
        item_data = {
            "type": "order",
            "title": "TEST_Order - Persistence Test",
            "clientId": "test-client-id",
            "providerId": provider_id,
            "amount": 75.50,
            "status": "open",
            "description": "Testing persistence"
        }
        
        create_response = authenticated_client.post(f"{BASE_URL}/api/provider/pending-items", json=item_data)
        assert create_response.status_code == 200
        
        item_id = create_response.json()["id"]
        
        # Verify via GET
        get_response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items")
        assert get_response.status_code == 200
        
        items = get_response.json()
        found_item = next((i for i in items if i["id"] == item_id), None)
        
        assert found_item is not None, f"Created item {item_id} not found in list"
        assert found_item["title"] == item_data["title"], "Title mismatch"
        assert found_item["type"] == item_data["type"], "Type mismatch"
        assert found_item["amount"] == item_data["amount"], "Amount mismatch"
        
        print(f"Verified item {item_id} persisted correctly")
        
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/provider/pending-items/{item_id}")
    
    def test_update_pending_item(self, authenticated_client, provider_info):
        """Test updating a pending item"""
        provider_id = provider_info.get("userId", provider_info.get("user_id", "unknown"))
        
        # First create an item
        item_data = {
            "type": "video_session",
            "title": "TEST_Update Test Item",
            "clientId": "test-client-id",
            "providerId": provider_id,
            "amount": 100.00,
            "status": "open"
        }
        
        create_response = authenticated_client.post(f"{BASE_URL}/api/provider/pending-items", json=item_data)
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        
        # Update the item
        update_data = {
            "title": "TEST_Updated Title",
            "amount": 200.00,
            "description": "Updated description"
        }
        
        update_response = authenticated_client.put(f"{BASE_URL}/api/provider/pending-items/{item_id}", json=update_data)
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify update via GET
        get_response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items")
        items = get_response.json()
        updated_item = next((i for i in items if i["id"] == item_id), None)
        
        assert updated_item is not None, "Updated item not found"
        assert updated_item["title"] == update_data["title"], "Title not updated"
        assert updated_item["amount"] == update_data["amount"], "Amount not updated"
        
        print(f"Successfully updated item {item_id}")
        
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/provider/pending-items/{item_id}")
    
    def test_delete_pending_item(self, authenticated_client, provider_info):
        """Test deleting a pending item"""
        provider_id = provider_info.get("userId", provider_info.get("user_id", "unknown"))
        
        # First create an item
        item_data = {
            "type": "order",
            "title": "TEST_Delete Test Item",
            "clientId": "test-client-id",
            "providerId": provider_id,
            "amount": 50.00,
            "status": "open"
        }
        
        create_response = authenticated_client.post(f"{BASE_URL}/api/provider/pending-items", json=item_data)
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        
        # Delete the item
        delete_response = authenticated_client.delete(f"{BASE_URL}/api/provider/pending-items/{item_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify deletion via GET
        get_response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items")
        items = get_response.json()
        deleted_item = next((i for i in items if i["id"] == item_id), None)
        
        assert deleted_item is None, f"Item {item_id} should have been deleted"
        
        print(f"Successfully deleted item {item_id}")
    
    def test_delete_nonexistent_item(self, authenticated_client):
        """Test deleting a non-existent item returns 404"""
        fake_id = str(uuid.uuid4())
        response = authenticated_client.delete(f"{BASE_URL}/api/provider/pending-items/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404 for non-existent item, got {response.status_code}"


class TestPendingItemsQuickActions:
    """Tests for mark-paid and mark-unpaid quick actions"""
    
    def test_mark_item_paid(self, authenticated_client, provider_info):
        """Test marking an item as paid"""
        provider_id = provider_info.get("userId", provider_info.get("user_id", "unknown"))
        
        # Create an open item
        item_data = {
            "type": "video_session",
            "title": "TEST_Mark Paid Test",
            "clientId": "test-client-id",
            "providerId": provider_id,
            "amount": 100.00,
            "status": "open"
        }
        
        create_response = authenticated_client.post(f"{BASE_URL}/api/provider/pending-items", json=item_data)
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        
        # Mark as paid
        mark_paid_response = authenticated_client.post(f"{BASE_URL}/api/provider/pending-items/{item_id}/mark-paid")
        assert mark_paid_response.status_code == 200, f"Mark paid failed: {mark_paid_response.text}"
        
        # Verify status changed
        get_response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items")
        items = get_response.json()
        paid_item = next((i for i in items if i["id"] == item_id), None)
        
        assert paid_item is not None, "Item not found after marking paid"
        assert paid_item["status"] == "paid", f"Expected status=paid, got {paid_item['status']}"
        
        print(f"Successfully marked item {item_id} as paid")
        
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/provider/pending-items/{item_id}")
    
    def test_mark_item_unpaid(self, authenticated_client, provider_info):
        """Test marking a paid item as unpaid"""
        provider_id = provider_info.get("userId", provider_info.get("user_id", "unknown"))
        
        # Create a paid item
        item_data = {
            "type": "order",
            "title": "TEST_Mark Unpaid Test",
            "clientId": "test-client-id",
            "providerId": provider_id,
            "amount": 75.00,
            "status": "paid"
        }
        
        create_response = authenticated_client.post(f"{BASE_URL}/api/provider/pending-items", json=item_data)
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        
        # Mark as unpaid
        mark_unpaid_response = authenticated_client.post(f"{BASE_URL}/api/provider/pending-items/{item_id}/mark-unpaid")
        assert mark_unpaid_response.status_code == 200, f"Mark unpaid failed: {mark_unpaid_response.text}"
        
        # Verify status changed
        get_response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items")
        items = get_response.json()
        unpaid_item = next((i for i in items if i["id"] == item_id), None)
        
        assert unpaid_item is not None, "Item not found after marking unpaid"
        assert unpaid_item["status"] == "unpaid", f"Expected status=unpaid, got {unpaid_item['status']}"
        
        print(f"Successfully marked item {item_id} as unpaid")
        
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/provider/pending-items/{item_id}")
    
    def test_mark_paid_nonexistent_item(self, authenticated_client):
        """Test marking non-existent item as paid returns 404"""
        fake_id = str(uuid.uuid4())
        response = authenticated_client.post(f"{BASE_URL}/api/provider/pending-items/{fake_id}/mark-paid")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_mark_unpaid_nonexistent_item(self, authenticated_client):
        """Test marking non-existent item as unpaid returns 404"""
        fake_id = str(uuid.uuid4())
        response = authenticated_client.post(f"{BASE_URL}/api/provider/pending-items/{fake_id}/mark-unpaid")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestPendingItemsUrgency:
    """Tests for urgency calculation"""
    
    def test_urgency_in_response(self, authenticated_client):
        """Test that urgency field is included in item responses"""
        response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items")
        
        assert response.status_code == 200
        items = response.json()
        
        for item in items:
            assert "urgency" in item, f"Item {item.get('id')} missing urgency field"
            assert item["urgency"] in ["low", "medium", "high"], f"Invalid urgency value: {item['urgency']}"
        
        print(f"All {len(items)} items have valid urgency values")


# Cleanup fixture to remove test data after all tests
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(authenticated_client):
    """Cleanup TEST_ prefixed data after test module completes"""
    yield
    
    # Teardown: Delete all test-created data
    try:
        response = authenticated_client.get(f"{BASE_URL}/api/provider/pending-items")
        if response.status_code == 200:
            items = response.json()
            for item in items:
                if item.get("title", "").startswith("TEST_"):
                    authenticated_client.delete(f"{BASE_URL}/api/provider/pending-items/{item['id']}")
                    print(f"Cleaned up test item: {item['id']}")
    except Exception as e:
        print(f"Cleanup error: {e}")
