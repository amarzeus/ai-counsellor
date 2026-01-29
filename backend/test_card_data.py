import requests
import sys

BASE_URL = "http://localhost:8000"

def test_cards():
    print("1. Signing up...")
    email = f"test_cards_{requests.utils.quote(str(sys.version_info[0]))}@example.com"
    signup_data = {"email": email, "password": "password123", "full_name": "Card Tester"}
    try:
        requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
    except:
        pass # Ignore if exists

    print("2. Logging in...")
    login_data = {"email": email, "password": "password123"}
    res = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if res.status_code != 200:
        print("Login failed:", res.text)
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("2.5. Completing Profile (to exit ONBOARDING)...")
    profile_data = {
        "current_education_level": "Bachelor's",
        "degree_major": "Computer Science",
        "graduation_year": 2024,
        "gpa": 3.8,
        "intended_degree": "Master's",
        "field_of_study": "Computer Science",
        "target_intake_year": 2025,
        "preferred_countries": ["USA"],
        "budget_per_year": 50000,
        "funding_plan": "SELF_FUNDED",
        "ielts_toefl_status": "COMPLETED",
        "gre_gmat_status": "COMPLETED",
        "sop_status": "DRAFT"
    }
    res = requests.put(f"{BASE_URL}/api/profile", json=profile_data, headers=headers)
    if res.status_code != 200:
        print("Profile update failed:", res.text)
        return

    print("3. Creating Session...")
    res = requests.post(f"{BASE_URL}/api/sessions", json={"title": "Card Test"}, headers=headers)
    session_id = res.json()["id"]

    print("4. Asking for recommendations (triggering AI cards)...")
    # We ask a specific question to get JSON data
    msg_data = {
        "content": "Recommend universities for Computer Science in USA with $50k budget",
        "session_id": session_id
    }
    res = requests.post(f"{BASE_URL}/api/chat", json=msg_data, headers=headers)
    
    if res.status_code != 200:
        print("Chat failed:", res.text)
        return

    data = res.json()
    print("\n--- AI Response ---")
    print("Message:", data.get("content")[:100], "...")
    
    suggested = data.get("suggested_universities")
    if suggested:
        print(f"✅ SUCCESS: Received {len(suggested)} university cards!")
        print("First card sample details:")
        print(f"  - ID: {suggested[0].get('university_id')}")
        print(f"  - Name: {suggested[0].get('name')}")
        print(f"  - Country: {suggested[0].get('country')}")
        print(f"  - Tuition: {suggested[0].get('tuition')}")
        
        if not suggested[0].get('name'):
            print("❌ FAILURE: University Name is MISSING (Hydration failed)")
    else:
        print("❌ FAILURE: No suggested_universities found in response.")
        # Check if it was just empty or missing field
        if "suggested_universities" in data:
            print("(Field exists but is empty/null)")
        else:
            print("(Field is MISSING from schema)")

if __name__ == "__main__":
    test_cards()
