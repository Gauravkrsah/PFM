#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.nlp_service import NLPService
import asyncio

async def test_income_parsing():
    nlp = NLPService()
    
    test_cases = [
        "got salary today 50000",
        "salary 100000 received", 
        "bonus 5000",
        "refund 2000",
        "got back 400 from sonu"
    ]
    
    print("Testing Income Parsing:")
    print("=" * 50)
    
    for test in test_cases:
        print(f"\nInput: '{test}'")
        result = await nlp.parse_expense(test)
        print(f"Reply: {result['reply']}")
        if result['expenses']:
            for exp in result['expenses']:
                print(f"  Amount: {exp['amount']} (negative = income)")
                print(f"  Category: {exp['category']}")
                print(f"  Item: {exp['item']}")
                print(f"  Remarks: {exp['remarks']}")

if __name__ == "__main__":
    asyncio.run(test_income_parsing())