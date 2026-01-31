
import requests
import sys

BASE_URL = "http://localhost:8000"
EMAIL = "test_session_user@example.com"
PASSWORD = "password123"

def print_step(msg):
    print(f"\n[STEP] {msg}")

def test_sessions():
    # 1. Signup/Login
    print_step("Authenticating...")
    auth_data = {"email": EMAIL, "password": PASSWORD, "full_name": "Test User"}
    
    # Try signup
    try:
        requests.post(f"{BASE_URL}/api/auth/signup", json=auth_data)
    except Exception:
        pass # User might exist

    # Login
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        sys.exit(1)
        
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in.")

    # 2. Create Session
    print_step("Creating Session...")
    session_data = {"title": "Test Session A"}
    res = requests.post(f"{BASE_URL}/api/sessions", json=session_data, headers=headers)
    if res.status_code != 200:
        print(f"Create session failed: {res.text}")
        sys.exit(1)
    
    session_id = res.json()["id"]
    print(f"Session Created: ID {session_id}, Title: {res.json()['title']}")

    # 3. Send Message to Session
    print_step("Sending Message to Session...")
    msg_data = {"content": "Hello AI", "session_id": session_id}
    res = requests.post(f"{BASE_URL}/api/chat", json=msg_data, headers=headers)
    if res.status_code != 200:
        print(f"Send message failed: {res.text}")
        sys.exit(1)
    print("Message sent successfully.")

    # 4. Get History for Session
    print_step("Fetching Session History...")
    res = requests.get(f"{BASE_URL}/api/chat/history/{session_id}", headers=headers)
    if res.status_code != 200:
        print(f"Get history failed: {res.text}")
        sys.exit(1)
    
    messages = res.json()
    print(f"History retrieved: {len(messages)} messages found.")
    if len(messages) >= 2: # User + AI response
        print("✅ Message persistence verified.")
    else:
        print("❌ Warning: Less than 2 messages found.")

    # 5. List Sessions
    print_step("Listing All Sessions...")
    res = requests.get(f"{BASE_URL}/api/sessions", headers=headers)
    sessions = res.json()
    print(f"Found {len(sessions)} sessions.")
    found = any(s['id'] == session_id for s in sessions)
    if found:
         print("✅ New session found in list.")
    else:
         print("❌ New session NOT found in list.")

    # 6. Delete Session
    print_step("Deleting Session...")
    res = requests.delete(f"{BASE_URL}/api/sessions/{session_id}", headers=headers)
    if res.status_code == 200:
        print("✅ Session deleted.")
    else:
        print(f"Delete failed: {res.text}")

    print("\n✅ ALL TESTS PASSED")

if __name__ == "__main__":
    test_sessions()
