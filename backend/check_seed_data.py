import sys
import os

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from real_universities_data import UNIVERSITIES_DATA

def check_data():
    errors = []
    for uni in UNIVERSITIES_DATA:
        if "name" not in uni:
            errors.append(f"University missing name: {uni}")
            continue
            
        programs = uni.get("programs", [])
        for prog in programs:
            if "tuition_per_year_usd" not in prog:
                errors.append(f"University '{uni['name']}' has program '{prog.get('name', 'Unknown')}' missing tuition_per_year_usd")
            if "degree_level" not in prog:
                errors.append(f"University '{uni['name']}' has program '{prog.get('name', 'Unknown')}' missing degree_level")
            if "name" not in prog:
                errors.append(f"University '{uni['name']}' missing program name")
                
    if errors:
        print("\n".join(errors))
        sys.exit(1)
    else:
        print("All clear! No missing required fields in UNIVERSITIES_DATA.")

if __name__ == "__main__":
    check_data()
