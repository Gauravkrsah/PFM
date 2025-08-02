import re
import json
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

class ExpenseParser:
    def __init__(self):
        self.categories = {
            'food': ['biryani', 'pizza', 'restaurant', 'meal', 'lunch', 'dinner', 'food', 'eat', 'cafe', 'snack', 'tea', 'coffee', 'breakfast', 'momo', 'momos', 'noodles', 'chowmein', 'chowmin', 'chow', 'ramen', 'pasta', 'rice', 'dal', 'curry', 'khana', 'khaana', 'chiya', 'chai', 'dudh', 'milk', 'bhat', 'daal', 'tarkari', 'sabji', 'machha', 'fish', 'chicken', 'mutton', 'buff', 'pork', 'egg', 'anda', 'roti', 'chapati', 'paratha', 'samosa', 'pakoda', 'chaat', 'lassi', 'lasi', 'juice', 'paani', 'water'],
            'transport': ['petrol', 'fuel', 'taxi', 'uber', 'bus', 'train', 'auto', 'rickshaw', 'metro', 'flight', 'travel', 'tempo', 'microbus', 'bike', 'scooter', 'car', 'gaadi'],
            'groceries': ['grocery', 'groceries', 'vegetables', 'fruits', 'market', 'supermarket', 'store', 'milk', 'bread', 'apple', 'garlic', 'potato', 'onion', 'tomato', 'sabji', 'tarkari', 'fruits', 'phal', 'alu', 'pyaj', 'lasun', 'dhaniya', 'hariyo', 'green'],
            'shopping': ['clothes', 'shoes', 'shopping', 'shirt', 'dress', 'bag', 'accessories', 'kapada', 'jutta', 'chappals', 'sandals'],
            'utilities': ['electricity', 'water', 'internet', 'phone', 'mobile', 'wifi', 'bill', 'current', 'paani', 'net', 'recharge'],
            'entertainment': ['movie', 'game', 'party', 'cinema', 'show', 'concert', 'film', 'picture', 'khel'],
            'accommodation': ['hotel', 'stay', 'booking', 'resort', 'lodge', 'guest house', 'airbnb'],
            'rent': ['rent', 'house', 'apartment', 'room', 'ghar', 'kotha', 'bhada'],
            'loan': ['loan', 'lend', 'borrow', 'debt', 'rin', 'gave', 'diye', 'liye', 'udhar', 'qarz'],
            'income': ['salary', 'bonus', 'incentive', 'refund', 'income', 'earning', 'payment', 'received']
        }
    
    def parse(self, text):
        expenses = []
        text = text.strip()
        
        # Split by comma and process each part
        parts = [part.strip() for part in text.split(',')]
        
        for part in parts:
            if not part:
                continue
            
            expense = self._parse_single_expense(part)
            if expense:
                expenses.append(expense)
        
        reply = self._generate_reply(expenses)
        return expenses, reply
    
    def _parse_single_expense(self, text):
        """Parse a single expense from text with multiple pattern matching"""
        text = text.strip()
        
        # Pattern 0d: "person owes amount to person" with fuzzy matching
        # Check this FIRST to catch debt patterns before other matches
        debt_keywords = r'(?:owes?|ows?|owe|owz|owse|debt|borrows?|lends?|udhar|qarz)'
        owes_pattern = rf'([a-zA-Z]+)\s+{debt_keywords}\s+(\d+)\s+(?:to|from)\s+([a-zA-Z]+)'
        owes_match = re.search(owes_pattern, text, re.IGNORECASE)
        if owes_match:
            debtor, amount, creditor = owes_match.groups()
            return {
                'amount': int(amount),
                'item': f'{debtor.lower()} owes {creditor.lower()}',
                'category': 'Loan',
                'remarks': f"{debtor.title()} owes {creditor.title()}",
                'paid_by': debtor.title()
            }
        
        # Pattern 0a: "got/received salary amount" like "got salary 100000"
        salary_pattern = r'^(?:got|received)\s+salary\s+(\d+)$'
        salary_match = re.match(salary_pattern, text, re.IGNORECASE)
        if salary_match:
            amount = salary_match.group(1)
            return {
                'amount': -int(amount),  # Negative for income
                'item': 'salary',
                'category': 'Income',
                'remarks': 'Salary received',
                'paid_by': None
            }
        
        # Pattern 0b: "salary amount received" like "salary 100000 received"
        salary_pattern2 = r'^salary\s+(\d+)\s+(?:received|got)$'
        salary_match2 = re.match(salary_pattern2, text, re.IGNORECASE)
        if salary_match2:
            amount = salary_match2.group(1)
            return {
                'amount': -int(amount),  # Negative for income
                'item': 'salary',
                'category': 'Income',
                'remarks': 'Salary received',
                'paid_by': None
            }
        
        # Pattern 0c: "got back/received amount from person" like "got back 400 from sonu"
        repayment_pattern = r'^(?:got\s+back|received|returned)\s+(\d+)\s+from\s+([a-zA-Z]+)'
        repayment_match = re.match(repayment_pattern, text, re.IGNORECASE)
        if repayment_match:
            amount, person = repayment_match.groups()
            return {
                'amount': -int(amount),  # Negative for income
                'item': 'loan repayment',
                'category': 'Loan',
                'remarks': f"Loan repaid by {person.title()}",
                'paid_by': person.title()
            }
        
        # Pattern 1a: "gave person amount for duration" like "gave sonu 400 for a week"
        gave_duration_pattern = r'^(?:gave|lend|lent)\s+([a-zA-Z]+)\s+(\d+)\s+for\s+(.+)$'
        gave_duration_match = re.match(gave_duration_pattern, text, re.IGNORECASE)
        if gave_duration_match:
            person, amount, duration = gave_duration_match.groups()
            return {
                'amount': int(amount),
                'item': 'loan',
                'category': 'Loan',
                'remarks': f"Loan given to {person.title()} for {duration}",
                'paid_by': person.title()
            }
        
        # Pattern 1b: "gave person amount loan" like "gave gaurav 300 loan"
        loan_pattern = r'^(?:gave|lend|lent)\s+([a-zA-Z]+)\s+(\d+)\s*(?:loan|rin|udhar)?$'
        loan_match = re.match(loan_pattern, text, re.IGNORECASE)
        if loan_match:
            person, amount = loan_match.groups()
            return {
                'amount': int(amount),
                'item': 'loan',
                'category': 'Loan',
                'remarks': f"Loan given to {person.title()}",
                'paid_by': person.title()
            }
        
        # Pattern 2: "item person amount" like "rent sonu 20000" or "tea gaurav 100"
        food_words = ['lunch', 'dinner', 'breakfast', 'snack', 'meal', 'tea', 'coffee', 'food']
        pattern1 = r'^([a-zA-Z\s]+?)\s+([a-zA-Z]+)\s+(\d+)$'
        match1 = re.match(pattern1, text)
        if match1:
            item, potential_person, amount = match1.groups()
            if potential_person.lower() not in food_words:
                item = self._clean_item_name(item)
                category = self._categorize(item)
                return {
                    'amount': int(amount),
                    'item': item.lower(),
                    'category': category,
                    'remarks': f"{item.title()} - Paid by {potential_person.title()}",
                    'paid_by': potential_person.title()
                }
        
        # Pattern 3: "item for/on context amount" like "samosa for lunch 80"
        pattern2a = r'^([a-zA-Z\s]+?)\s+(?:for|on)\s+([a-zA-Z\s]+?)\s+(\d+)$'
        match2a = re.match(pattern2a, text)
        if match2a:
            item, context, amount = match2a.groups()
            full_item = f"{item} for {context}"
            item = self._clean_item_name(full_item)
            category = self._categorize(item)
            return {
                'amount': int(amount),
                'item': item.lower(),
                'category': category,
                'remarks': item.title(),
                'paid_by': None
            }
        
        # Pattern 3b: "amount for/on item" like "500 for petrol" or "100 on tea"
        pattern2 = r'^(\d+)\s+(?:for|on)\s+(?:the\s+)?(.+)$'
        match2 = re.match(pattern2, text)
        if match2:
            amount, item = match2.groups()
            item = self._clean_item_name(item)
            category = self._categorize(item)
            return {
                'amount': int(amount),
                'item': item.lower(),
                'category': category,
                'remarks': item.title(),
                'paid_by': None
            }
        
        # Pattern 4: "spend amount on item" like "spend 100 on tea"
        pattern3 = r'^spend\s+(\d+)\s+on\s+(?:the\s+)?(.+)$'
        match3 = re.match(pattern3, text, re.IGNORECASE)
        if match3:
            amount, item = match3.groups()
            item = self._clean_item_name(item)
            category = self._categorize(item)
            return {
                'amount': int(amount),
                'item': item.lower(),
                'category': category,
                'remarks': item.title()
            }
        
        # Pattern 4b: "paid/payed amount for item" like "paid 5000 for hotel"
        paid_pattern = r'^(?:paid|payed)\s+(\d+)\s+for\s+(?:the\s+)?(.+)$'
        paid_match = re.match(paid_pattern, text, re.IGNORECASE)
        if paid_match:
            amount, item = paid_match.groups()
            item = self._clean_item_name(item)
            category = self._categorize(item)
            return {
                'amount': int(amount),
                'item': item.lower(),
                'category': category,
                'remarks': item.title()
            }
        
        # Pattern 5: "amount spend on item" like "150 spend on momo"
        pattern3b = r'^(\d+)\s+spend\s+on\s+(?:the\s+)?(.+)$'
        match3b = re.match(pattern3b, text, re.IGNORECASE)
        if match3b:
            amount, item = match3b.groups()
            item = self._clean_item_name(item)
            category = self._categorize(item)
            return {
                'amount': int(amount),
                'item': item.lower(),
                'category': category,
                'remarks': item.title()
            }
        
        # Pattern 6: "item amount paid by person" like "rent 20000 paid by sonu"
        pattern4 = r'^([a-zA-Z\s]+?)\s+(\d+)\s+paid\s+by\s+([a-zA-Z]+)$'
        match4 = re.match(pattern4, text, re.IGNORECASE)
        if match4:
            item, amount, person = match4.groups()
            item = self._clean_item_name(item)
            category = self._categorize(item)
            return {
                'amount': int(amount),
                'item': item.lower(),
                'category': category,
                'remarks': f"{item.title()} - Paid by {person.title()}",
                'paid_by': person.title()
            }
        
        # Pattern 7: "item amount" like "grocery 300" or "biryani 500"
        pattern5 = r'^([a-zA-Z\s]+?)\s+(\d+)$'
        match5 = re.match(pattern5, text)
        if match5:
            item, amount = match5.groups()
            item = self._clean_item_name(item)
            category = self._categorize(item)
            return {
                'amount': int(amount),
                'item': item.lower(),
                'category': category,
                'remarks': item.title()
            }
        
        # Fallback: Extract amount and treat rest as item
        amount_match = re.search(r'Rs\.?(\d+)|Rs.?(\d+)', text)
        if amount_match:
            amount = int(amount_match.group(1) or amount_match.group(2))
            description = re.sub(r'Rs\.?\d+|Rs.?\d+', '', text)
            description = re.sub(r'\b(on|for|spent|the|paid|by)\b', '', description, flags=re.IGNORECASE)
            description = re.sub(r'\s+', ' ', description).strip()
            description = self._clean_item_name(description)
            
            if description and amount > 0:
                category = self._categorize(description)
                return {
                    'amount': amount,
                    'item': description.lower(),
                    'category': category,
                    'remarks': description.title()
                }
        
        return None
    
    def _clean_item_name(self, item):
        """Clean and normalize item names"""
        item = item.strip()
        item = re.sub(r'\b(the|a|an)\b', '', item, flags=re.IGNORECASE)
        item = re.sub(r'\s+', ' ', item).strip()
        
        nepali_mappings = {
            'chowmin': 'chowmein', 'chow min': 'chowmein',
            'khana': 'food', 'khaana': 'food',
            'chiya': 'tea', 'chai': 'tea',
            'dudh': 'milk', 'paani': 'water',
            'bhat': 'rice', 'daal': 'dal',
            'tarkari': 'vegetables', 'sabji': 'vegetables',
            'machha': 'fish', 'anda': 'egg',
            'lasi': 'lassi', 'phal': 'fruits',
            'alu': 'potato', 'pyaj': 'onion',
            'kapada': 'clothes', 'jutta': 'shoes',
            'ghar': 'house', 'kotha': 'room',
            'gaadi': 'vehicle', 'current': 'electricity'
        }
        
        item_lower = item.lower()
        for nepali, english in nepali_mappings.items():
            if nepali in item_lower:
                item = item_lower.replace(nepali, english)
                break
        
        return item
    
    def _categorize(self, description):
        description_lower = description.lower()
        
        # Check existing categories first
        for category, keywords in self.categories.items():
            if any(keyword in description_lower for keyword in keywords):
                return category.title()
        
        # Smart category creation for unknown items
        return self._smart_categorize(description_lower)
    
    def _smart_categorize(self, description):
        """Create intelligent categories for unknown items"""
        # Travel & Accommodation
        if any(word in description for word in ['hotel', 'stay', 'booking', 'resort', 'lodge', 'airbnb', 'hostel']):
            return 'Travel'
        
        # Medical & Health
        if any(word in description for word in ['doctor', 'medicine', 'hospital', 'clinic', 'pharmacy', 'medical', 'health']):
            return 'Medical'
        
        # Education
        if any(word in description for word in ['book', 'course', 'class', 'tuition', 'school', 'college', 'education']):
            return 'Education'
        
        # Beauty & Personal Care
        if any(word in description for word in ['salon', 'haircut', 'beauty', 'cosmetic', 'spa', 'massage']):
            return 'Personal Care'
        
        # Gifts & Donations
        if any(word in description for word in ['gift', 'present', 'donation', 'charity', 'birthday']):
            return 'Gifts'
        
        # Insurance & Finance
        if any(word in description for word in ['insurance', 'premium', 'policy', 'bank', 'fee', 'charge']):
            return 'Finance'
        
        # Maintenance & Repair
        if any(word in description for word in ['repair', 'fix', 'maintenance', 'service', 'cleaning']):
            return 'Maintenance'
        
        # Sports & Fitness
        if any(word in description for word in ['gym', 'fitness', 'sport', 'exercise', 'yoga', 'swimming']):
            return 'Fitness'
        
        return 'Other'
    
    def _generate_reply(self, expenses):
        if not expenses:
            return "ERROR: No expenses found. Try: '500 on biryani, 400 on grocery'"
        
        reply_parts = []
        for expense in expenses:
            reply_parts.append(f"SUCCESS: Added Rs.{expense['amount']} -> {expense['category']} ({expense['remarks']})")
        
        return '\n'.join(reply_parts)

class NLPService:
    def __init__(self):
        self.parser = ExpenseParser()
        self._setup_gemini()
    
    def _setup_gemini(self):
        """Setup Gemini AI with error handling"""
        self.gemini_available = False
        self.model = None
        
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key and gemini_api_key.strip():
            try:
                genai.configure(api_key=gemini_api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                self.gemini_available = True
                print("SUCCESS: Gemini API configured")
            except Exception as e:
                print(f"ERROR: Gemini API setup failed: {e}")
    
    def get_gemini_response(self, prompt: str) -> Optional[str]:
        """Get response from Gemini with error handling"""
        if not self.model or not self.gemini_available:
            return None
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            print(f"Gemini API error: {e}")
        
        return None
    
    async def _ai_enhanced_parse(self, text):
        """Use AI to intelligently parse expense text"""
        try:
            prompt = f"""
Parse this expense text into JSON. Be intelligent and understand context.

Text: "{text}"

Rules:
- "gave/lend X amount" = expense (loan given) - positive amount
- "got back/received/returned X amount from person" = income (loan repaid) - negative amount, category: Loan
- "X owes/ows/owe/debt/borrows Y amount to/from Z" = debt record - positive amount, category: Loan
- "salary/got salary/received salary X amount" = income (salary) - negative amount, category: Income
- "bonus/incentive X amount" = income - negative amount, category: Income
- "refund X amount" = income - negative amount, category: Income
- "paid/payed X amount for item" = expense - positive amount
- Regular expenses = positive amount with intelligent categories
- Auto-creates categories: Travel, Medical, Education, Personal Care, Gifts, Finance, Maintenance, Fitness
- Fallback categories: Food, Groceries, Transport, Shopping, Utilities, Entertainment, Rent, Loan, Income, Other

Examples:
- "gave sonu 400" → {{"amount": 400, "category": "Loan", "remarks": "Loan given to Sonu"}}
- "sonu owes 280 to gaurav" → {{"amount": 280, "category": "Loan", "remarks": "Sonu owes Gaurav"}}
- "in ludo game sonu owes 280 to gaurav" → {{"amount": 280, "item": "sonu owes gaurav", "category": "Loan", "remarks": "Sonu owes Gaurav", "paid_by": "Sonu"}}
- "got back 400 from sonu" → {{"amount": -400, "category": "Loan", "remarks": "Loan repaid by Sonu"}}
- "got salary 100000" → {{"amount": -100000, "category": "Income", "remarks": "Salary received"}}
- "salary 100000 received" → {{"amount": -100000, "category": "Income", "remarks": "Salary received"}}

Return ONLY valid JSON:
{{
  "expenses": [
    {{"amount": -100000, "item": "salary", "category": "Income", "remarks": "Salary received", "paid_by": null}}
  ],
  "reply": "SUCCESS: Added 1 transaction totaling Rs.-100000 (income)"
}}
"""
            
            response = self.get_gemini_response(prompt)
            if response:
                # Clean response and extract JSON
                response = response.strip()
                if response.startswith('```json'):
                    response = response[7:-3]
                elif response.startswith('```'):
                    response = response[3:-3]
                
                # Find JSON in response
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    parsed_data = json.loads(json_str)
                    
                    # Validate and fix structure
                    if 'expenses' in parsed_data:
                        if 'reply' not in parsed_data:
                            count = len(parsed_data['expenses'])
                            total = sum(exp.get('amount', 0) for exp in parsed_data['expenses'])
                            parsed_data['reply'] = f"SUCCESS: Added {count} expenses totaling Rs.{total}"
                        return parsed_data
            
            return None
            
        except Exception as e:
            print(f"[AI_PARSE] Error: {e}")
            return None
    
    async def parse_expense(self, text: str):
        """Parse expense text and return structured data"""
        try:
            print(f"[PARSE] Processing: {text}")
            
            # Try AI-enhanced parsing first if Gemini is available
            if self.gemini_available:
                ai_result = await self._ai_enhanced_parse(text)
                if ai_result and ai_result.get('expenses'):
                    print(f"[PARSE] AI successfully parsed {len(ai_result['expenses'])} expenses")
                    return ai_result
            
            # Try multi-expense parsing
            multi_expenses = self._parse_multi_expenses(text)
            if multi_expenses:
                reply_parts = [f"Rs.{exp['amount']} -> {exp['category']} ({exp['item'].title()})" for exp in multi_expenses]
                return {
                    "expenses": multi_expenses,
                    "reply": f"SUCCESS: Added {len(multi_expenses)} expenses: " + ", ".join(reply_parts)
                }
            
            # Fallback to rule-based parser
            expenses, reply = self.parser.parse(text)
            return {
                "expenses": expenses,
                "reply": reply
            }
            
        except Exception as e:
            print(f"[ERROR] Parse error: {e}")
            return {
                "expenses": [],
                "reply": f"ERROR: Error parsing expenses: {str(e)}"
            }
    
    def _parse_multi_expenses(self, text):
        """Parse multiple expenses from comma-separated format"""
        try:
            parts = [p.strip() for p in text.split(',')]
            expenses = []
            
            i = 0
            while i < len(parts):
                amount_part = None
                amount = None
                
                # Look for Rs.Amount pattern
                for j in range(i, min(i + 3, len(parts))):
                    if re.search(r'Rs\.?(\d+)', parts[j], re.IGNORECASE):
                        amount_match = re.search(r'Rs\.?(\d+)', parts[j], re.IGNORECASE)
                        amount = int(amount_match.group(1))
                        amount_part = j
                        break
                
                if amount is None:
                    i += 1
                    continue
                
                # Get item (before amount)
                item = parts[i] if i < amount_part else 'item'
                
                # Get category (after amount)
                category = parts[amount_part + 1] if amount_part + 1 < len(parts) else 'Other'
                
                # Clean up
                item = re.sub(r'Rs\.?\d+', '', item, flags=re.IGNORECASE).strip()
                category = re.sub(r'Rs\.?\d+', '', category, flags=re.IGNORECASE).strip()
                
                if not item:
                    item = 'item'
                if not category:
                    category = 'Other'
                
                expenses.append({
                    'amount': amount,
                    'item': item.lower(),
                    'category': category.title(),
                    'remarks': item.title(),
                    'paid_by': None
                })
                
                i = amount_part + 2
            
            return expenses if expenses else None
            
        except Exception as e:
            print(f"[MULTI_PARSE] Error: {e}")
            return None
    
    async def chat_about_expenses(self, request):
        """Handle chat requests about expenses"""
        try:
            from services.expense_analyzer import ExpenseAnalyzer
            
            analyzer = ExpenseAnalyzer()
            
            # Extract user name
            user_name = "there"
            if request.user_name and str(request.user_name).strip():
                user_name = str(request.user_name).strip()
            elif request.user_email:
                email_name = request.user_email.split('@')[0]
                user_name = email_name.capitalize()
            
            # Determine context and prepare data
            is_group_mode = bool(request.group_name and request.group_expenses_data)
            table_data = request.group_expenses_data if is_group_mode else (request.expenses_data or [])
            context_type = f"group '{request.group_name}'" if is_group_mode else "personal"
            
            if not table_data:
                response = f"Hi {user_name}! You don't have any {context_type} expenses recorded yet. Start by adding some expenses to get insights!"
                return {"reply": response}
            
            # Analyze expenses
            analysis = analyzer.analyze_expenses(table_data)
            
            # Try Gemini first for natural responses
            if self.gemini_available:
                context_data = {
                    "total_amount": analysis['total'],
                    "transaction_count": analysis['count'],
                    "top_categories": analysis['top_categories'][:3],
                    "average_daily": analysis['average_per_day'],
                    "context": context_type
                }
                
                recent_expenses_text = ""
                if analysis['recent_expenses']:
                    recent_list = []
                    for exp in analysis['recent_expenses'][:5]:
                        paid_by = f" (paid by {exp.get('paid_by')})" if exp.get('paid_by') else ""
                        recent_list.append(f"Rs.{exp.get('amount', 0)} on {exp.get('item', 'item')} - {exp.get('category', 'other')}{paid_by}")
                    recent_expenses_text = "\n- Recent expenses: " + "; ".join(recent_list)
                
                prompt = f"""
You are a helpful financial assistant. Answer the user's question about their {context_type} expenses.

User question: "{request.text}"

Expense data:
- Total spent: Rs.{context_data['total_amount']}
- Number of transactions: {context_data['transaction_count']}
- Top spending categories: {', '.join([f"{cat}: Rs.{amt}" for cat, amt in context_data['top_categories']])}
- Average daily spending: Rs.{context_data['average_daily']}{recent_expenses_text}

Instructions:
1. Start your response with "Hi {user_name}!"
2. Be conversational and helpful
3. Use the provided data to answer accurately
4. Keep responses concise but informative
5. Use "Rs." for currency amounts
6. For "who paid" questions, look at the recent expenses data
"""
                
                gemini_response = self.get_gemini_response(prompt)
                if gemini_response:
                    if not gemini_response.startswith(f"Hi {user_name}!"):
                        gemini_response = f"Hi {user_name}! {gemini_response}"
                    return {"reply": gemini_response}
            
            # Fallback to rule-based processing
            processed_response = analyzer.process_query(request.text, analysis, context_type)
            final_response = f"Hi {user_name}! {processed_response}"
            return {"reply": final_response}
            
        except Exception as e:
            print(f"[ERROR] Chat error: {e}")
            error_name = user_name if 'user_name' in locals() else 'there'
            return {
                "reply": f"Hi {error_name}! Sorry, I encountered an error processing your question. Please try again.",
                "error": True
            }