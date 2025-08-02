import re
import json

class ExpenseParser:
    def __init__(self):
        self.categories = {
            'food': ['biryani', 'pizza', 'restaurant', 'hotel', 'meal', 'lunch', 'dinner', 'food', 'eat', 'cafe', 'snack', 'tea', 'coffee', 'breakfast', 'momo', 'momos', 'noodles', 'chowmein', 'chowmin', 'chow', 'ramen', 'pasta', 'rice', 'dal', 'curry', 'khana', 'khaana', 'chiya', 'chai', 'dudh', 'milk', 'bhat', 'daal', 'tarkari', 'sabji', 'machha', 'fish', 'chicken', 'mutton', 'buff', 'pork', 'egg', 'anda', 'roti', 'chapati', 'paratha', 'samosa', 'pakoda', 'chaat', 'lassi', 'lasi', 'juice', 'paani', 'water'],
            'transport': ['petrol', 'fuel', 'taxi', 'uber', 'bus', 'train', 'auto', 'rickshaw', 'metro', 'flight', 'travel', 'tempo', 'microbus', 'bike', 'scooter', 'car', 'gaadi'],
            'groceries': ['grocery', 'groceries', 'vegetables', 'fruits', 'market', 'supermarket', 'store', 'milk', 'bread', 'apple', 'garlic', 'potato', 'onion', 'tomato', 'sabji', 'tarkari', 'fruits', 'phal', 'alu', 'pyaj', 'lasun', 'dhaniya', 'hariyo', 'green'],
            'shopping': ['clothes', 'shoes', 'shopping', 'shirt', 'dress', 'bag', 'accessories', 'kapada', 'jutta', 'chappals', 'sandals'],
            'utilities': ['electricity', 'water', 'internet', 'phone', 'mobile', 'wifi', 'bill', 'current', 'paani', 'net', 'recharge'],
            'entertainment': ['movie', 'game', 'party', 'cinema', 'show', 'concert', 'film', 'picture', 'khel'],
            'rent': ['rent', 'house', 'apartment', 'room', 'ghar', 'kotha', 'bhada'],
            'loan': ['loan', 'lend', 'borrow', 'debt', 'rin', 'gave', 'diye', 'liye', 'udhar', 'qarz']
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
        
        # Pattern 1: "gave person amount loan" like "gave gaurav 300 loan"
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
        # But exclude common food-related words that aren't names
        food_words = ['lunch', 'dinner', 'breakfast', 'snack', 'meal', 'tea', 'coffee', 'food']
        pattern1 = r'^([a-zA-Z\s]+?)\s+([a-zA-Z]+)\s+(\d+)$'
        match1 = re.match(pattern1, text)
        if match1:
            item, potential_person, amount = match1.groups()
            # Don't treat food-related words as person names
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
            # Remove amount and common words to get clean description
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
        # Remove common articles and prepositions
        item = re.sub(r'\b(the|a|an)\b', '', item, flags=re.IGNORECASE)
        # Clean up extra spaces
        item = re.sub(r'\s+', ' ', item).strip()
        # Handle common misspellings and Nepali words
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
        for category, keywords in self.categories.items():
            if any(keyword in description_lower for keyword in keywords):
                return category.title()
        return 'Other'
    
    def _generate_reply(self, expenses):
        if not expenses:
            return "ERROR: No expenses found. Try: '500 on biryani, 400 on grocery'"
        
        reply_parts = []
        for expense in expenses:
            reply_parts.append(f"SUCCESS: Added Rs.{expense['amount']} -> {expense['category']} ({expense['remarks']})")
        
        return '\n'.join(reply_parts)

parser = ExpenseParser()