#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.nlp_service import NLPService
import asyncio

async def test_loan_parsing():
    nlp = NLPService()
    
    test_cases = [
        "loan paid 400",
        "loan 500", 
        "gave sonu 300",
        "got back 200 from sonu",
        "lent gaurav 1000"
    ]
    
    print("Testing Loan Parsing:")
    print("=" * 50)
    
    for test in test_cases:
        print(f"\nInput: '{test}'")
        result = await nlp.parse_expense(test)
        print(f"Reply: {result['reply']}")
        if result['expenses']:
            for exp in result['expenses']:
                print(f"  Amount: {exp['amount']} ({'EXPENSE (loan given)' if exp['amount'] > 0 else 'INCOME (loan repaid)'})")
                print(f"  Category: {exp['category']}")
                print(f"  Item: {exp['item']}")
                print(f"  Remarks: {exp['remarks']}")
                print(f"  Should appear in: {'Expense table' if exp['amount'] > 0 else 'Income table'}")

if __name__ == "__main__":
    asyncio.run(test_loan_parsing())