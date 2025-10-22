import sys
sys.path.append('backend')

from services.nlp_service import ExpenseParser

parser = ExpenseParser()
test_text = "in ludo game sonu owes 280 to gaurav"

expenses, reply = parser.parse(test_text)
print(f"Input: {test_text}")
print(f"Reply: {reply}")
print(f"Expenses: {expenses}")