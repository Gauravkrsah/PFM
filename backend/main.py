from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import re
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from nlp_parser import parser

load_dotenv()

app = FastAPI()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API with better error handling
gemini_api_key = os.getenv("GEMINI_API_KEY")
model = None
gemini_available = False

if gemini_api_key and gemini_api_key.strip():
    try:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        # Skip test if quota exceeded, just configure the model
        try:
            test_response = model.generate_content("Hello")
            if test_response and test_response.text:
                gemini_available = True
                print("SUCCESS: Gemini API configured and tested successfully")
            else:
                print("WARNING: Gemini API configured but test failed")
        except Exception as test_error:
            if "429" in str(test_error) or "quota" in str(test_error).lower():
                print("WARNING: Gemini API quota exceeded, but model is configured")
                gemini_available = False  # Disable for now due to quota
            else:
                print(f"WARNING: Gemini API test failed: {test_error}")
                gemini_available = False

    except Exception as e:
        print(f"ERROR: Error configuring Gemini API: {e}")
        model = None
        gemini_available = False
else:
    print("WARNING: Gemini API key not found in environment variables")
    print("INFO: Set GEMINI_API_KEY in your .env file for enhanced chat responses")

def get_gemini_response(prompt: str, max_retries: int = 2) -> Optional[str]:
    """Get response from Gemini with retry logic and error handling"""
    if not model or not gemini_available:
        return None

    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            print(f"Gemini API attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                print("All Gemini API attempts failed, falling back to rule-based responses")

    return None

class ParseRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    text: str
    user_id: str = None
    user_email: str = None
    user_name: str = None
    expenses_data: list = []
    group_name: str = None
    group_expenses_data: list = []

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

        # Enhanced query patterns and responses

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
            # Look for specific category or item
            category_found = None
            for category in self.categories.keys():
                if category in query_lower:
                    category_found = category
                    break
            
            if category_found:
                # Find recent expenses in this category with paid_by info
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
                # General who paid query
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

# Initialize analyzer
expense_analyzer = ExpenseAnalyzer()

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Personal Finance Manager API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint with API status"""
    return {
        "status": "healthy",
        "gemini_available": gemini_available,
        "message": "Personal Finance Manager API is running"
    }

@app.post("/parse")
async def parse_expense(request: ParseRequest):
    """Parse expense text and return structured expense data"""
    try:
        print(f"[PARSE] Received parse request: {request.text}")
        
        # Use the NLP parser to extract expenses
        expenses, reply = parser.parse(request.text)
        
        print(f"[PARSE] Parsed {len(expenses)} expenses")
        print(f"[PARSE] Reply: {reply}")
        
        return {
            "expenses": expenses,
            "reply": reply
        }
        
    except Exception as e:
        print(f"[ERROR] Parse endpoint error: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "expenses": [],
            "reply": f"ERROR: Error parsing expenses: {str(e)}"
        }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/chat")
async def chat_about_expenses(request: ChatRequest):
    try:
        print(f"[CHAT] Received chat request: {request.text}")
        print(f"[CHAT] Expenses data count: {len(request.expenses_data) if request.expenses_data else 0}")
        print(f"[CHAT] Group data count: {len(request.group_expenses_data) if request.group_expenses_data else 0}")
        print(f"[CHAT] Group name: {request.group_name}")
        
        # Extract user name
        user_name = "there"
        if request.user_name and str(request.user_name).strip():
            user_name = str(request.user_name).strip()
        elif request.user_email:
            email_name = request.user_email.split('@')[0]
            user_name = email_name.capitalize()

        print(f"[CHAT] User name: {user_name}")

        # Determine context and prepare data
        is_group_mode = bool(request.group_name and request.group_expenses_data)
        table_data = request.group_expenses_data if is_group_mode else (request.expenses_data or [])
        context_type = f"group '{request.group_name}'" if is_group_mode else "personal"

        print(f"[CHAT] Context: {context_type}, Data items: {len(table_data)}")

        if not table_data:
            response = f"Hi {user_name}! You don't have any {context_type} expenses recorded yet. Start by adding some expenses to get insights!"
            print(f"[CHAT] Sending empty data response: {response}")
            return {"reply": response}

        # Analyze expenses using the new analyzer
        print("[CHAT] Analyzing expenses...")
        analysis = expense_analyzer.analyze_expenses(table_data)
        print(f"[CHAT] Analysis result: Total=Rs.{analysis['total']}, Count={analysis['count']}")

        # Try Gemini first for more natural responses
        if gemini_available:
            print("[INFO] Using Gemini AI...")
            # Create detailed context for Gemini
            context_data = {
                "total_amount": analysis['total'],
                "transaction_count": analysis['count'],
                "top_categories": analysis['top_categories'][:3],
                "average_daily": analysis['average_per_day'],
                "context": context_type
            }

            # Include recent expenses with payment info for Gemini
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

            gemini_response = get_gemini_response(prompt)
            if gemini_response:
                # Ensure proper greeting
                if not gemini_response.startswith(f"Hi {user_name}!"):
                    gemini_response = f"Hi {user_name}! {gemini_response}"

                print(f"[CHAT] Sending Gemini response: {gemini_response[:100]}...")
                return {"reply": gemini_response}

        # Enhanced rule-based processing as fallback
        print("[CHAT] Using rule-based processing...")
        context_str = context_type
        processed_response = expense_analyzer.process_query(request.text, analysis, context_str)

        # Add status indicator if Gemini is not available
        status_note = ""
        if not gemini_available and any(word in request.text.lower() for word in ['help', 'what can', 'complex']):
            status_note = "\n\nNOTE: Enhanced AI responses are currently unavailable. Using rule-based responses."

        final_response = f"Hi {user_name}! {processed_response}{status_note}"
        print(f"[CHAT] Sending rule-based response: {final_response[:100]}...")
        return {"reply": final_response}

    except Exception as e:
        print(f"[ERROR] Chat endpoint error: {e}")
        import traceback
        traceback.print_exc()
        
        error_name = user_name if 'user_name' in locals() else 'there'
        error_response = f"Hi {error_name}! Sorry, I encountered an error processing your question. Please try again or contact support if the issue persists. Error: {str(e)}"
        print(f"[CHAT] Sending error response: {error_response}")
        return {
            "reply": error_response,
            "error": True
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)