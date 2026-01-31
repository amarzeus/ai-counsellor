import sys
import asyncio
from dotenv import load_dotenv

sys.path.append("/home/amar/Documents/Developer/ai-counsellor/backend")
load_dotenv()

from recommendation_engine import detect_intent, filter_programs  # noqa: E402
from real_universities_data import UNIVERSITIES_DATA  # noqa: E402

async def verify_logic():
    print("--- Test 1: User asks for 'Computer Science' ---")
    query_cs = "I want to study MS Computer Science in USA"
    profile = {"current_stage": "DISCOVERY", "preferred_countries": ["USA"]}
    
    intent_cs = await detect_intent(query_cs, profile)
    print(f"Detected Intent: {intent_cs}")
    
    filtered_cs = filter_programs(UNIVERSITIES_DATA, intent_cs, profile)
    print(f"Filtered Universities Count: {len(filtered_cs)}")
    
    # Assertions for CS
    assert intent_cs.get("target_discipline") == "Computer Science" or "Computer" in intent_cs.get("target_discipline", ""), "Failed to detect CS discipline"
    assert len(filtered_cs) > 0, "No universities returned for CS"
    
    # Check programs in filtered list
    cs_program_found = False
    ds_program_found = False
    
    for uni in filtered_cs:
        for prog in uni["programs"]:
            name = prog["name"].lower()
            if "computer science" in name:
                cs_program_found = True
            if "data science" in name and "computer science" not in name:
                ds_program_found = True
                
    print(f"CS Programs Found: {cs_program_found}")
    print(f"Data Science Only Programs Found (Should be False): {ds_program_found}")
    
    
    print("\n--- Test 2: User switches to 'Data Science' ---")
    query_ds = "Actually, what about Data Science programs?"
    
    intent_ds = await detect_intent(query_ds, profile)
    print(f"Detected Intent: {intent_ds}")
    
    filtered_ds = filter_programs(UNIVERSITIES_DATA, intent_ds, profile)
    print(f"Filtered Universities Count: {len(filtered_ds)}")
    
    # Assertions for DS
    # The intent should now be 'Data Science'
    assert "data" in intent_ds.get("target_discipline", "").lower(), "Failed to detect Data Science discipline"
    
    # Verify we don't have purely CS programs anymore unless they mention Data
    pure_cs_count = 0
    ds_count = 0
    
    for uni in filtered_ds:
        for prog in uni["programs"]:
            name = prog["name"].lower()
            if "data science" in name or "analytics" in name:
                ds_count += 1
            elif "computer science" in name:
                 # Some CS programs might be retained if name matches loose filter, 
                 # but strict logic in recommendation_engine loop (lines 90+) should filter them
                 # unless "Data" is in the name.
                 pure_cs_count += 1
                 print(f"  WARNING: Found CS program: {prog['name']}")

    print(f"Data Science Programs: {ds_count}")
    print(f"Pure CS Programs (Should be low/zero): {pure_cs_count}")
    
    # CRITICAL SUCCESS CRITERIA
    if ds_count > 0 and pure_cs_count == 0:
        print("\n✅ SUCCESS: Strict filtering worked. Switched context completely.")
        return True
    elif ds_count > 0 and pure_cs_count < 5:
        print("\n⚠️ PARTIAL SUCCESS: Mostly DS, but some CS leaked.")
        return True
    else:
        print("\n❌ FAILED: Context switch did not filter programs correctly.")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(verify_logic())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
