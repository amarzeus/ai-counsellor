import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"
EMAIL = "payment_test@example.com"
PASSWORD = "Password123!"

def test_payment_flow():
    # 1. Signup
    print("Creating User for Payment Test...")
    token = None
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json={"email": EMAIL, "password": PASSWORD, "full_name": "Pay Test"})
        if resp.status_code == 200:
            token = resp.json()["access_token"]
        elif resp.status_code == 400: # Exists
            resp = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
            token = resp.json()["access_token"]
    except Exception as e:
        print(f"Auth failed: {e}")
        return False
        
    if not token:
        print("Could not get token")
        return False

    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create Order (Mock)
    print("Creating Order...")
    order_resp = requests.post(f"{BASE_URL}/subscriptions/create-order", headers=headers, json={"amount": 2900})
    if order_resp.status_code != 200:
        print(f"Create Order Failed: {order_resp.text}")
        return False
        
    order_data = order_resp.json()
    print(f"Order Created: {order_data}")
    
    if not order_data.get("mock"):
        print("WARNING: Not in Mock mode. Cannot proceed with automated test unless we have valid payment credentials.") 
        # But wait, razorpay_utils returns mock=True if no keys.
        # If keys are present, it returns real order.
        # Assuming dev environment has no keys or mock keys.
        
    # 3. Verify Payment (Mock)
    print("Verifying Payment...")
    # If mock, we use mock IDs. If real, we can't easily test without manual intervention.
    # The frontend logic handles this branching. The backend verify endpoint checks signature.
    # In mock mode (no client), verify_payment accepts 'order_mock_' ID.
    
    verify_payload = {
        "razorpay_order_id": order_data.get("order_id", "order_mock_test"),
        "razorpay_payment_id": "pay_mock_123",
        "razorpay_signature": "sig_mock_123"
    }
    
    verify_resp = requests.post(f"{BASE_URL}/subscriptions/verify-payment", headers=headers, json=verify_payload)
    
    if verify_resp.status_code == 200:
        print("Payment Verification Successful!")
        print(verify_resp.json())
        return True
    else:
        print(f"Payment Verification Failed: {verify_resp.text}")
        return False

if __name__ == "__main__":
    if test_payment_flow():
        sys.exit(0)
    else:
        sys.exit(1)
