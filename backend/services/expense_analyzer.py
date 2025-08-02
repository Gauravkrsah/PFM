from typing import List, Dict, Any

class ExpenseAnalyzer:
    """Advanced expense analysis and query processing"""

    def __init__(self):
        self.categories = {
            'food': ['food', 'biryani', 'pizza', 'restaurant', 'hotel', 'meal', 'lunch', 'dinner', 'eat', 'cafe', 'snack', 'breakfast'],
            'groceries': ['grocery', 'groceries', 'vegetables', 'fruits', 'market', 'supermarket', 'store', 'milk', 'bread'],
            'transport': ['petrol', 'fuel', 'taxi', 'uber', 'bus', 'train', 'auto', 'rickshaw', 'metro', 'flight', 'travel'],
            'shopping': ['clothes', 'shoes', 'shopping', 'shirt', 'dress', 'bag', 'accessories'],
            'utilities': ['electricity', 'water', 'internet', 'phone', 'mobile', 'wifi', 'bill'],
            'entertainment': ['movie', 'game', 'party', 'cinema', 'show', 'concert', 'entertainment'],
            'rent': ['rent', 'house', 'apartment', 'room'],
            'medical': ['doctor', 'medicine', 'hospital', 'medical', 'health', 'pharmacy'],
            'other': []
        }

    def analyze_expenses(self, expenses_data: List[Dict]) -> Dict[str, Any]:
        """Comprehensive analysis of expense data"""
        if not expenses_data:
            return {
                'total': 0,
                'count': 0,
                'categories': {},
                'recent_expenses': [],
                'top_categories': [],
                'average_per_day': 0
            }

        total = sum(exp.get('amount', 0) for exp in expenses_data)
        count = len(expenses_data)

        # Category breakdown
        categories = {}
        for exp in expenses_data:
            category = exp.get('category', 'Other').lower()
            categories[category] = categories.get(category, 0) + exp.get('amount', 0)

        # Sort categories by amount
        top_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]

        # Recent expenses (last 5)
        recent_expenses = expenses_data[:5] if len(expenses_data) >= 5 else expenses_data

        # Calculate average per day (assuming data spans multiple days)
        dates = set()
        for exp in expenses_data:
            date_val = exp.get('date') or exp.get('created_at')
            if date_val:
                # Handle different date formats
                if isinstance(date_val, str):
                    # Extract date part if it's a datetime string
                    date_part = date_val.split('T')[0] if 'T' in date_val else date_val.split(' ')[0]
                    dates.add(date_part)
                else:
                    dates.add(str(date_val))

        days_count = len(dates) if dates else 1
        average_per_day = total / days_count if days_count > 0 else 0

        return {
            'total': total,
            'count': count,
            'categories': categories,
            'recent_expenses': recent_expenses,
            'top_categories': top_categories,
            'average_per_day': round(average_per_day, 2),
            'days_tracked': days_count
        }

    def find_specific_item(self, query: str, expenses_data: List[Dict]) -> Dict[str, Any]:
        """Find specific item expenses from the data"""
        query_lower = query.lower()
        
        # Extract potential item names from query
        item_keywords = []
        words = query_lower.split()
        
        # Look for "on [item]" or "for [item]" patterns
        for i, word in enumerate(words):
            if word in ['on', 'for', 'spend', 'spent'] and i + 1 < len(words):
                item_keywords.append(words[i + 1])
        
        # Also check for direct item mentions
        common_items = ['momo', 'biryani', 'tea', 'coffee', 'lunch', 'dinner', 'grocery', 'petrol', 'taxi', 'rent', 'chicken', 'lassi', 'dahi', 'ghee', 'chiya']
        for item in common_items:
            if item in query_lower:
                item_keywords.append(item)
        
        if not item_keywords:
            return None
            
        # Find matching expenses
        matching_expenses = []
        total_amount = 0
        
        for expense in expenses_data:
            item_name = expense.get('item', '').lower()
            remarks = expense.get('remarks', '').lower()
            
            # Check if any keyword matches item or remarks
            for keyword in item_keywords:
                if keyword in item_name or keyword in remarks:
                    matching_expenses.append(expense)
                    total_amount += expense.get('amount', 0)
                    break
        
        if matching_expenses:
            return {
                'item_name': item_keywords[0],
                'total_amount': total_amount,
                'count': len(matching_expenses),
                'expenses': matching_expenses
            }
        
        return None

    def process_query(self, query: str, analysis: Dict[str, Any], context: str = "personal", expenses_data: List[Dict] = None) -> str:
        """Process natural language queries about expenses with advanced pattern matching"""
        query_lower = query.lower()
        
        # Specific item queries - check this FIRST
        if expenses_data and any(word in query_lower for word in ['spend', 'spent', 'much', 'cost', 'price']):
            item_result = self.find_specific_item(query_lower, expenses_data)
            if item_result:
                item_name = item_result['item_name'].title()
                total = item_result['total_amount']
                count = item_result['count']
                
                if count == 1:
                    expense = item_result['expenses'][0]
                    date_info = f" on {expense.get('date', 'unknown date')}" if expense.get('date') else ""
                    paid_by = f" (paid by {expense.get('paid_by')})" if expense.get('paid_by') else ""
                    return f"You spent Rs.{total} on {item_name}{date_info}{paid_by}."
                else:
                    return f"You spent Rs.{total} on {item_name} across {count} transactions."

        # Total/Summary queries
        if any(word in query_lower for word in ['total', 'spent', 'expense']) and any(word in query_lower for word in ['till now', 'so far', 'overall', 'all']):
            return f"Your {context} total expenses are Rs.{analysis['total']} across {analysis['count']} transactions over {analysis['days_tracked']} days."

        # Specific category queries
        for category in self.categories.keys():
            if category in query_lower:
                amount = analysis['categories'].get(category, 0)
                if amount > 0:
                    return f"You've spent Rs.{amount} on {category} in your {context} expenses."
                else:
                    return f"You haven't spent anything on {category} in your {context} expenses yet."

        # Breakdown/Category analysis
        if any(word in query_lower for word in ['category', 'breakdown', 'categories', 'where', 'what']):
            if analysis['top_categories']:
                breakdown = []
                for cat, amount in analysis['top_categories']:
                    percentage = (amount / analysis['total'] * 100) if analysis['total'] > 0 else 0
                    breakdown.append(f"• {cat.title()}: Rs.{amount} ({percentage:.1f}%)")
                return f"Your {context} expense breakdown:\n" + "\n".join(breakdown)

        # Recent expenses
        if any(word in query_lower for word in ['recent', 'last', 'latest']):
            if analysis['recent_expenses']:
                recent = []
                for exp in analysis['recent_expenses'][:3]:
                    date_str = f" on {exp.get('date', 'unknown date')}" if exp.get('date') else ""
                    recent.append(f"• Rs.{exp.get('amount', 0)} on {exp.get('item', 'item')} ({exp.get('category', 'other')}){date_str}")
                return f"Your recent {context} expenses:\n" + "\n".join(recent)

        # Average/Daily spending
        if any(word in query_lower for word in ['average', 'daily', 'per day']):
            return f"Your average daily {context} spending is Rs.{analysis['average_per_day']} over {analysis['days_tracked']} days."

        # Comparison queries
        if 'most' in query_lower and ('spent' in query_lower or 'expensive' in query_lower):
            if analysis['top_categories']:
                top_cat, top_amount = analysis['top_categories'][0]
                return f"You've spent the most on {top_cat.title()} with Rs.{top_amount} in your {context} expenses."

        # Count queries
        if any(word in query_lower for word in ['how many', 'count', 'number']):
            return f"You have {analysis['count']} transactions in your {context} expenses, totaling Rs.{analysis['total']}."

        # Who paid queries
        if any(word in query_lower for word in ['who paid', 'who payed', 'paid by', 'payed by']):
            category_found = None
            for category in self.categories.keys():
                if category in query_lower:
                    category_found = category
                    break
            
            if category_found:
                category_expenses = [exp for exp in analysis['recent_expenses'] 
                                   if exp.get('category', '').lower() == category_found]
                if category_expenses:
                    recent_with_payer = [exp for exp in category_expenses if exp.get('paid_by')]
                    if recent_with_payer:
                        latest = recent_with_payer[0]
                        return f"The last {category_found} expense was Rs.{latest.get('amount', 0)} for {latest.get('item', 'item')} paid by {latest.get('paid_by', 'unknown')}."
                    else:
                        return f"I found recent {category_found} expenses but no payment information is recorded."
                else:
                    return f"No recent {category_found} expenses found."
            else:
                recent_with_payer = [exp for exp in analysis['recent_expenses'] if exp.get('paid_by')]
                if recent_with_payer:
                    latest = recent_with_payer[0]
                    return f"The most recent expense with payment info: Rs.{latest.get('amount', 0)} for {latest.get('item', 'item')} paid by {latest.get('paid_by', 'unknown')}."
                else:
                    return f"No recent expenses have payment information recorded."

        # Help/What can I ask queries
        if any(word in query_lower for word in ['help', 'what can', 'options']):
            return f"You can ask me about:\n• Total expenses ('What are my expenses till now?')\n• Category breakdowns ('Show me my food expenses')\n• Recent transactions ('What are my recent expenses?')\n• Daily averages ('What's my daily spending?')\n• Comparisons ('What did I spend the most on?')\n• Who paid ('Who paid for grocery last time?')"

        # Default comprehensive response with better analysis
        if analysis['top_categories']:
            top_category, top_amount = analysis['top_categories'][0]
            percentage = (top_amount / analysis['total'] * 100) if analysis['total'] > 0 else 0
            return f"Your {context} expenses: Rs.{analysis['total']} total across {analysis['count']} transactions. Top spending: {top_category.title()} (Rs.{top_amount}, {percentage:.1f}%). Daily average: Rs.{analysis['average_per_day']}."
        else:
            return f"Your {context} expenses: Rs.{analysis['total']} total across {analysis['count']} transactions. Daily average: Rs.{analysis['average_per_day']}."