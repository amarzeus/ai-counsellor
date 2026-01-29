import os
import httpx
from oauthlib.oauth2 import WebApplicationClient
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

REPLIT_DEV_DOMAIN = os.environ.get("REPLIT_DEV_DOMAIN", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")

if REPLIT_DEV_DOMAIN:
    DEV_REDIRECT_URL = f"https://{REPLIT_DEV_DOMAIN}/api/auth/google/callback"
    print(f"""
Google OAuth Setup:
Add this redirect URI to your Google Cloud Console:
{DEV_REDIRECT_URL}
""")

client = None
if GOOGLE_CLIENT_ID:
    client = WebApplicationClient(GOOGLE_CLIENT_ID)

google_router = APIRouter(prefix="/api/auth/google", tags=["google-auth"])


def get_google_provider_cfg():
    response = httpx.get(GOOGLE_DISCOVERY_URL)
    return response.json()


def get_redirect_uri():
    """Get the correct redirect URI for the environment"""
    if REPLIT_DEV_DOMAIN:
        return f"https://{REPLIT_DEV_DOMAIN}/api/auth/google/callback"
    return None

@google_router.get("/login")
async def google_login(request: Request):
    if not client or GOOGLE_CLIENT_ID == "YOUR_GOOGLE_CLIENT_ID_HERE":
        raise HTTPException(
            status_code=500, 
            detail="Google OAuth not configured. Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in backend/.env"
        )
    
    google_provider_cfg = get_google_provider_cfg()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]
    
    redirect_uri = get_redirect_uri()
    if not redirect_uri:
        redirect_uri = str(request.url_for("google_callback")).replace("http://", "https://")
    
    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=redirect_uri,
        scope=["openid", "email", "profile"],
    )
    return RedirectResponse(url=request_uri)


@google_router.get("/callback", name="google_callback")
async def google_callback(request: Request, code: str = None):
    from database import SessionLocal
    from models import User, UserStage
    from auth import create_access_token
    
    if not client or not code:
        raise HTTPException(status_code=400, detail="Invalid callback")
    
    google_provider_cfg = get_google_provider_cfg()
    token_endpoint = google_provider_cfg["token_endpoint"]
    
    redirect_uri = get_redirect_uri()
    if not redirect_uri:
        redirect_uri = str(request.url_for("google_callback")).replace("http://", "https://")
    
    authorization_response = str(request.url).replace("http://", "https://")
    
    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response=authorization_response,
        redirect_url=redirect_uri,
        code=code,
    )
    
    async with httpx.AsyncClient() as http_client:
        token_response = await http_client.post(
            token_url,
            headers=headers,
            content=body,
            auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
        )
    
    client.parse_request_body_response(token_response.text)
    
    userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
    uri, headers, body = client.add_token(userinfo_endpoint)
    
    async with httpx.AsyncClient() as http_client:
        userinfo_response = await http_client.get(uri, headers=headers)
    
    userinfo = userinfo_response.json()
    
    if not userinfo.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email not verified by Google")
    
    users_email = userinfo["email"]
    users_name = userinfo.get("name", userinfo.get("given_name", "User"))
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == users_email).first()
        
        if not user:
            user = User(
                email=users_email,
                password_hash="",
                full_name=users_name,
                current_stage=UserStage.ONBOARDING,
                onboarding_completed=False,
                google_id=userinfo.get("sub")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not user.google_id:
            user.google_id = userinfo.get("sub")
            db.commit()
        
        token = create_access_token(data={"sub": user.id})
        
        frontend_base = FRONTEND_URL or f"https://{REPLIT_DEV_DOMAIN}"
        redirect_url = f"{frontend_base}/auth/callback?token={token}"
        
        return RedirectResponse(url=redirect_url)
    finally:
        db.close()
