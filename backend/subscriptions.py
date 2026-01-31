import os
import time
import razorpay
import hmac
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import User, SubscriptionPlan, SubscriptionStatus

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

# Env Variables
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Helper to get valid Plan ID
def get_or_create_plan_id():
    global client
    if not client: return None
    
    # Check env var first
    env_plan = os.getenv("RAZORPAY_PLAN_ID")
    if env_plan: return env_plan
    
    # Fallback: Check/Create default plan
    plan_name = "AI Counsellor Premium (7-Day Trial)"
    try:
        # We can't search plans easily by name in SDK, so we assume a known ID or just create new
        # For prototype, let's create a NEW plan if we haven't cached it in a local constant
        # BETTER: Just create one standard plan for the project and print it so user can save to env
        # OR: Just try to create standard plan.
        
        # Simplified: Create a plan every time? No.
        # Create a "Monthly" plan.
        
        # For MVP: Just Create a Plan and return ID.
        # Note: In production you'd store this ID.
        # We will create a fresh plan if one isn't found.
        
        plan_data = {
            "period": "monthly",
            "interval": 1,
            "item": {
                "name": plan_name,
                "amount": 2900,  # $29 in cents (approx 2900 INR or USD? Razorpay defaults to INR unless currency specified)
                "currency": "USD",
                "description": "Premium Subscription"
            }
        }
        plan = client.plan.create(plan_data)
        return plan['id']
    except Exception as e:
        print(f"Plan creation failed: {e}")
        return "plan_default_fallback"

PLAN_ID = None # Will init lazily

class CreateSubscriptionRequest(BaseModel):
    plan_id: Optional[str] = None

class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str

from auth import get_current_user

@router.post("/create")
def create_subscription(
    req: CreateSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # MOCK MODE verification
    if not client:
        # Simulate subscription creation
        mock_sub_id = f"sub_mock_{int(time.time())}"
        return {
            "subscription_id": mock_sub_id,
            "key_id": "rzp_test_mock",
            "mock": True
        }
    
    try:
        # Lazy Load Plan
        global PLAN_ID
        if not PLAN_ID:
             PLAN_ID = get_or_create_plan_id()

        # Real Razorpay Call with 7-day trial
        # start_at = int((datetime.now() + timedelta(days=7)).timestamp())
        # Note: Razorpay Live mode logic is strict.
        
        start_at = int((datetime.now() + timedelta(days=7)).timestamp())
        
        data = {
            "plan_id": PLAN_ID,
            "customer_notify": 1,
            "total_count": 120, # 10 years monthly
            "start_at": start_at, 
            "notes": {
                "user_id": current_user.id,
                "email": current_user.email
            }
        }
        
        subscription = client.subscription.create(data)
        return {
            "subscription_id": subscription['id'],
            "key_id": RAZORPAY_KEY_ID,
            "mock": False
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
def verify_payment(
    req: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not client:
        # Mock verification
        if req.razorpay_subscription_id.startswith("sub_mock_"):
            current_user.subscription_plan = SubscriptionPlan.PREMIUM
            current_user.subscription_status = SubscriptionStatus.TRIALING
            current_user.trial_ends_at = datetime.utcnow() + timedelta(days=7)
            db.commit()
            return {"status": "success", "message": "Trial activated (Mock)"}
        raise HTTPException(400, "Invalid mock subscription")

    try:
        # Verify signature
        data = {
            'razorpay_payment_id': req.razorpay_payment_id,
            'razorpay_subscription_id': req.razorpay_subscription_id,
            'razorpay_signature': req.razorpay_signature
        }
        client.utility.verify_payment_signature(data)
        
        # Update User
        current_user.subscription_plan = SubscriptionPlan.PREMIUM
        current_user.subscription_status = SubscriptionStatus.TRIALING
        current_user.trial_ends_at = datetime.utcnow() + timedelta(days=7)
        db.commit()
        
        return {"status": "success", "message": "Trial activated"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Signature verification failed")

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(500, "Webhook secret not configured")
        
    body = await request.body()
    
    try:
        # Verify Webhook Signature
        client.utility.verify_webhook_signature(
            body.decode(),
            x_razorpay_signature,
            RAZORPAY_KEY_SECRET
        )
    except Exception:
        raise HTTPException(400, "Invalid signature")
        
    data = await request.json()
    event = data.get('event')
    payload = data.get('payload', {})
    
    if event == 'subscription.activated':
        # Handle activation
        sub_entity = payload.get('subscription', {}).get('entity', {})
        notes = sub_entity.get('notes', {})
        user_id = notes.get('user_id')
        
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.subscription_plan = SubscriptionPlan.PREMIUM
                user.subscription_status = SubscriptionStatus.ACTIVE
                db.commit()

    return {"status": "ok"}
