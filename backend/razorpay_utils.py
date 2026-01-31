import os
import razorpay
from fastapi import HTTPException

# Initialize Razorpay Client
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def create_razorpay_order(amount: int, currency: str = "INR", receipt: str = None, notes: dict = None):
    """
    Create a Razorpay Order.
    amount: Amount in smallest currency unit (e.g., paise for INR)
    """
    if not client:
        # Mock Response
        import time
        return {
            "id": f"order_mock_{int(time.time())}",
            "entity": "order",
            "amount": amount,
            "currency": currency,
            "receipt": receipt,
            "status": "created",
            "mock": True
        }

    try:
        data = {
            "amount": amount,
            "currency": currency,
            "receipt": receipt,
            "notes": notes or {}
        }
        order = client.order.create(data=data)
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay Order Creation Failed: {str(e)}")

def verify_razorpay_signature(payment_id: str, order_id: str, signature: str):
    """
    Verify the payment signature.
    """
    if not client:
        # Mock Verification
        if order_id.startswith("order_mock_"):
            return True
        return False
        
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        return True
    except Exception:
        return False
