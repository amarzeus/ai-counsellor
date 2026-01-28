
import unittest
import sys
import os

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_counsellor import categorize_university

class TestAICounsellorLogic(unittest.TestCase):
    def setUp(self):
        # Default user profile
        self.user_profile = {
            'gpa': 3.5,
            'budget_per_year': 30000
        }

    def test_dream_university_gpa(self):
        # PRD: Dream if University Min GPA > User GPA + 0.3
        # User GPA 3.5 + 0.3 = 3.8. So matched if Min GPA > 3.8.
        university = {
            'min_gpa': 3.9,
            'tuition_per_year': 30000,
            'acceptance_rate': 0.5
        }
        category, _, _, _, _ = categorize_university(university, self.user_profile)
        self.assertEqual(category, 'DREAM', "Should be DREAM because Min GPA (3.9) > User GPA (3.5) + 0.3")

    def test_dream_university_tuition(self):
        # PRD: Dream if Tuition > User Budget
        # User Budget 30000. So matched if Tuition > 30000.
        university = {
            'min_gpa': 3.5,
            'tuition_per_year': 30001,
            'acceptance_rate': 0.5
        }
        category, _, _, _, _ = categorize_university(university, self.user_profile)
        # Note: Code might fail here if it uses 1.2 multiplier
        self.assertEqual(category, 'DREAM', "Should be DREAM because Tuition (30001) > User Budget (30000)")

    def test_safe_university(self):
        # PRD: Safe if University Min GPA < User GPA - 0.2 AND Tuition <= Budget
        # User GPA 3.5 - 0.2 = 3.3. So safe if Min GPA <= 3.3?? 
        # PRD text says "University Min GPA < User GPA - 0.2". (Strictly less?)
        # Let's check code: "uni_min_gpa <= user_gpa - 0.2" (Less or Equal)
        # We will assume Less or Equal for now to match code intention, or check strict PRD.
        # PRD text: "University Min GPA < User GPA - 0.2"
        # Let's test 3.2 (which is < 3.3)
        university = {
            'min_gpa': 3.2,
            'tuition_per_year': 30000,
            'acceptance_rate': 0.5
        }
        category, _, _, _, _ = categorize_university(university, self.user_profile)
        self.assertEqual(category, 'SAFE', "Should be SAFE because Min GPA (3.2) < User GPA (3.5) - 0.2")

    def test_target_university(self):
        # PRD: Target: University Min GPA ≈ User GPA (within 0.2 range) AND Tuition <= Budget
        # User GPA 3.5. Range: 3.3 to 3.7.
        university = {
            'min_gpa': 3.5,
            'tuition_per_year': 30000,
            'acceptance_rate': 0.5
        }
        category, _, _, _, _ = categorize_university(university, self.user_profile)
        self.assertEqual(category, 'TARGET', "Should be TARGET because GPA is match and Tuition <= Budget")

    def test_target_university_tuition_fail(self):
        # PRD: Target requires Tuition <= Budget.
        # If Tuition > Budget, it should be Dream (according to PRD "OR Tuition > Budget")
        # Testing checking boundary condition
        university = {
            'min_gpa': 3.5,
            'tuition_per_year': 35000, # > 30000
            'acceptance_rate': 0.5
        }
        category, _, _, _, _ = categorize_university(university, self.user_profile)
        self.assertEqual(category, 'DREAM', "Should be DREAM because Tuition > Budget")

if __name__ == '__main__':
    unittest.main()
