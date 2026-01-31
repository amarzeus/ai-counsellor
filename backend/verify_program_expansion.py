import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"
EMAIL = "verify_expansion@example.com"
PASSWORD = "Password123!"

def login_or_signup():
    # Try login first
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
        if resp.status_code == 200:
            return resp.json()["access_token"]
    except Exception:
        pass

    # Signup if login fails
    print("Creating new user...")
    resp = requests.post(f"{BASE_URL}/auth/signup", json={"email": EMAIL, "password": PASSWORD, "full_name": "Expansion Test"})
    if resp.status_code == 200:
        token = resp.json()["access_token"]
        # Complete onboarding
        headers = {"Authorization": f"Bearer {token}"}
        requests.put(f"{BASE_URL}/profile", headers=headers, json={
            "current_education_level": "Bachelor",
            "degree_major": "CS",
            "intended_degree": "Master",
            "field_of_study": "CS",
            "preferred_countries": ["USA"],
            "budget_per_year": 50000,
            "funding_plan": "SELF_FUNDED"
        })
        requests.post(f"{BASE_URL}/onboarding/complete", headers=headers)
        return token
    
    print("Login/Signup failed")
    sys.exit(1)

def verify_university_detail(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Get List to find an ID
    resp = requests.get(f"{BASE_URL}/universities", headers=headers)
    if resp.status_code != 200:
        print(f"Failed to get universities: {resp.status_code}")
        return False
    
    unis = resp.json()
    if not unis:
        print("No universities found")
        return False
        
    uni_id = unis[0]["id"]
    print(f"Verifying University ID: {uni_id}")
    
    # 2. Get Detail
    resp = requests.get(f"{BASE_URL}/universities/{uni_id}", headers=headers)
    if resp.status_code != 200:
        print(f"Failed to get detail: {resp.status_code}")
        return False
        
    data = resp.json()
    programs = data.get("programs", [])
    if not programs:
        print("No programs found in detail")
        return False
        
    first_prog = programs[0]
    print("Checking Program Fields...")
    
    required_fields = [
        "program_category",
        "program_discipline",
        "requires_work_experience",
        "min_work_experience_years",
        "gmat_required",
        "portfolio_required"
    ]
    
    missing = []
    for field in required_fields:
        if field not in first_prog:
            missing.append(field)
            
    if missing:
        print(f"FAILED: Missing fields in response: {missing}")
        return False
        
    print("SUCCESS: All new fields present in response.")
    print("Sample Program Data:")
    print(json.dumps(first_prog, indent=2))
    return True

if __name__ == "__main__":
    try:
        token = login_or_signup()
        success = verify_university_detail(token)
        if not success:
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("Connection failed. Is backend running?")
        sys.exit(1)
