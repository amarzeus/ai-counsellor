import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User, SubscriptionPlan, SubscriptionStatus
from auth import get_current_user
from razorpay_utils import create_razorpay_order, verify_razorpay_signature

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

class CreateOrderRequest(BaseModel):
    amount: int = 2900 # Default to 2900 paise (Rs 29) or cents
    currency: str = "INR"

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/create-order")
def create_subscription_order(
    req: CreateOrderRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        # Create Order via Utils
        order = create_razorpay_order(
            amount=req.amount,
            currency=req.currency,
            receipt=f"receipt_{current_user.id}",
            notes={"user_id": current_user.id, "email": current_user.email}
        )
        
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": os.getenv("RAZORPAY_KEY_ID"),
            "mock": order.get("mock", False)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-payment")
def verify_subscription_payment(
    req: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_valid = verify_razorpay_signature(
        req.razorpay_payment_id,
        req.razorpay_order_id,
        req.razorpay_signature
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Payment Signature")
    
    # Upgrade User
    current_user.subscription_plan = SubscriptionPlan.PREMIUM
    current_user.subscription_status = SubscriptionStatus.ACTIVE
    current_user.trial_ends_at = datetime.utcnow() + timedelta(days=30) # Example: 30 days
    db.commit()
    
    return {"status": "success", "message": "Upgraded to Premium"}

@router.post("/webhook")
async def razorpay_webhook_handler(request: Request):
    # Webhook handling logic usually requires verifying signature again
    # keeping it minimal for now as we focus on checkout flow
    return {"status": "ok"}
