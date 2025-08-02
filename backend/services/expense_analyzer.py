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
            if exp.get('date'):
                dates.add(exp['date'])

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

    def process_query(self, query: str, analysis: Dict[str, Any], context: str = "personal") -> str:
        """Process natural language queries about expenses with advanced pattern matching"""
        query_lower = query.lower()

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

        # Default comprehensive response
        top_category = analysis['top_categories'][0][0].title() if analysis['top_categories'] else "various categories"
        return f"Your {context} expenses: Rs.{analysis['total']} total across {analysis['count']} transactions. Top spending: {top_category}. Daily average: Rs.{analysis['average_per_day']}."