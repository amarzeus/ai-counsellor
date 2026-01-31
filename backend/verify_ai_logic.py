import requests
import sys


BASE_URL = "http://localhost:8000/api"
EMAIL = "ai_verify_logic@example.com"
PASSWORD = "Password123!"

def test_ai_rejection():
    # 1. Signup
    print("Creating User with NO work experience...")
    token = None
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json={"email": EMAIL, "password": PASSWORD, "full_name": "No Work Exp User"})
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
    
    # 2. Complete Onboarding with 0 Work Exp
    print("Updating profile: 0 years work exp, Intended: MBA (requires exp)")
    requests.put(f"{BASE_URL}/profile", headers=headers, json={
        "current_education_level": "Bachelor",
        "degree_major": "Engineering",
        "intended_degree": "Masters",
        "field_of_study": "Business", 
        "work_experience_years": 0,  # CRITICAL
        "preferred_countries": ["USA"],
        "budget_per_year": 100000,
        "funding_plan": "SELF_FUNDED"
    })
    requests.post(f"{BASE_URL}/onboarding/complete", headers=headers)
    
    # 2.5 Force Upgrade to PREMIUM (to bypass Tier 2 gating and see eligibility reason)
    import sqlite3
    try:
        conn = sqlite3.connect("ai_counsellor.db")
        cursor = conn.cursor()
        # Find user ID (it's likely 1 since we reset DB)
        cursor.execute("UPDATE users SET subscription_plan = 'PREMIUM' WHERE email = ?", (EMAIL,))
        conn.commit()
        conn.close()
        print("Updated user to PREMIUM via DB backdoor")
    except Exception as e:
        print(f"DB Update failed: {e}")
        return False
    
    # 3. Ask AI about MIT MBA (Requires 3 years)
    # We need to find the ID of MIT MBA or assume the AI knows it from context
    # The AI gets top 100 unis. MIT is likely #1.
    
    message = "I really want to apply to MIT MBA. Is it a good fit for me?"
    print(f"Asking AI: '{message}'")
    
    # We need a new session - Main.py uses /api/chat
    session_resp = requests.post(f"{BASE_URL}/chat", headers=headers, json={"content": message})
    if session_resp.status_code != 200:
        print(f"Chat failed: {session_resp.text}")
        return False
        
    ai_resp = session_resp.json()
    ai_message = ai_resp.get("content", "")
    
    print(f"\nAI Response:\n{ai_message}\n")
    
    # 4. Verify AI Response Logic
    # It should mention "work experience" or say it's not a fit / ineligible
    
    keywords = ["work experience", "ineligible", "requires", "3 years"]
    matched = [k for k in keywords if k.lower() in ai_message.lower()]
    
    if matched:
        print(f"SUCCESS: AI mentioned strict requirements: {matched}")
        return True
    else:
        print("FAILURE: AI did not mention work experience requirements.")
        return False

if __name__ == "__main__":
    try:
        if test_ai_rejection():
            sys.exit(0)
        else:
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("Connection failed. Is backend running?")
        sys.exit(1)
