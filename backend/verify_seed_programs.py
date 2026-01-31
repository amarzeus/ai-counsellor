import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"
EMAIL = "verify_seed_prog@example.com"
PASSWORD = "Password123!"

def verify():
    # 1. Signup/Login
    auth_data = {"email": EMAIL, "password": PASSWORD, "full_name": "Seed Checker"}
    token = None
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
        if resp.status_code == 200:
            token = resp.json()["access_token"]
    except:
        pass
        
    if not token:
        resp = requests.post(f"{BASE_URL}/auth/signup", json=auth_data)
        if resp.status_code == 200:
            token = resp.json()["access_token"]
            # Onboard
            headers = {"Authorization": f"Bearer {token}"}
            requests.put(f"{BASE_URL}/profile", headers=headers, json={
                "current_education_level": "Bachelor", 
                "degree_major": "CS",
                "intended_degree": "Master",
                "field_of_study": "CS",
                "preferred_countries": ["USA"],
                "budget_per_year": 60000,
                "funding_plan": "SELF_FUNDED"
            })
            requests.post(f"{BASE_URL}/onboarding/complete", headers=headers)
    
    if not token:
        print("Auth failed")
        return False

    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Search for the new programs via field filter
    print("Searching for 'Data Science' programs...")
    resp = requests.get(f"{BASE_URL}/universities?field=Data", headers=headers)
    
    if resp.status_code != 200:
        print(f"Search failed: {resp.status_code}")
        return False
        
    universities = resp.json()
    print(f"Found {len(universities)} universities matching 'Data'")
    
    found_programs = []
    
    # Check specific universities
    targets = {
        "Carnegie Mellon University": "Master of Computational Data Science",
        "Georgia Institute of Technology": "MS Analytics",
        "New York University": "MS Data Science",
        "Columbia University": "MS Data Science"
    }
    
    success_count = 0
    
    for uni in universities:
        name = uni["name"]
        if name in targets:
            # We need to fetch details to see programs list if not in list view
            # The API /universities returns 'programs' as a JSON list of strings (legacy) or we verified the new schema?
            # Let's check detail view for safety.
            
            detail_resp = requests.get(f"{BASE_URL}/universities/{uni['id']}", headers=headers)
            if detail_resp.status_code == 200:
                detail = detail_resp.json()
                progs = detail.get("programs", [])
                
                target_prog = targets[name]
                matched = False
                for p in progs:
                    # p is a dict now in the new schema
                    prog_name = p.get("name", "")
                    if target_prog in prog_name:
                        print(f"[MATCH] {name}: {prog_name}")
                        matched = True
                        break
                
                if matched:
                    success_count += 1
                else:
                    print(f"[MISS] {name}: Expected '{target_prog}'")
    
    if success_count == len(targets):
        print("SUCCESS: All seeded programs found.")
        return True
    else:
        print(f"FAILURE: Found {success_count}/{len(targets)} programs.")
        return False

if __name__ == "__main__":
    if verify():
        sys.exit(0)
    else:
        sys.exit(1)
