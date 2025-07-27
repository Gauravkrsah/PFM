#!/usr/bin/env python3

import sys
import os
import json
from urllib.parse import parse_qs

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def parse_expense_cgi(text):
    """Parse expense text and return structured expense data"""
    try:
        # Import our parser
        from nlp_parser import parser
        expenses, reply = parser.parse(text)
        return {
            "expenses": expenses,
            "reply": reply
        }
    except ImportError as e:
        return {
            "expenses": [],
            "reply": f"ERROR: Could not import parser module: {str(e)}"
        }
    except Exception as e:
        return {
            "expenses": [],
            "reply": f"ERROR: Error parsing expenses: {str(e)}"
        }

def handle_chat_cgi(data):
    """Handle chat requests with fallback response"""
    try:
        text = data.get('text', '')
        user_name = data.get('user_name', 'there')
        group_name = data.get('group_name')
        
        # Simple fallback chat response since we don't have Gemini API in CGI
        if group_name:
            context = f"group '{group_name}'"
        else:
            context = "personal"
            
        # Basic responses based on common queries
        text_lower = text.lower()
        
        if 'total' in text_lower or 'how much' in text_lower:
            reply = f"Hi {user_name}! I'd love to help you analyze your {context} expenses, but the advanced chat features require the full backend server. For now, you can use the Input Mode to add expenses, and check the Table and Analytics tabs to view your spending patterns."
        elif 'help' in text_lower:
            reply = f"Hi {user_name}! Here's what you can do:\n\n📝 Use Input Mode to add expenses like 'lunch 250, coffee 80'\n📊 Check the Table tab to see all your expenses\n📈 Visit Analytics for spending insights\n\nFor advanced chat features, the full backend server is needed."
        else:
            reply = f"Hi {user_name}! I understand you're asking about your {context} expenses. While I can't provide detailed analysis in this mode, you can:\n\n• Add expenses using Input Mode\n• View your data in the Table tab\n• Check Analytics for insights\n\nFor full chat capabilities, please ensure the backend server is running."
            
        return {
            "reply": reply,
            "error": None
        }
    except Exception as e:
        return {
            "reply": f"Sorry, I encountered an error processing your request: {str(e)}",
            "error": str(e)
        }

def get_endpoint_from_path():
    """Extract endpoint from PATH_INFO"""
    try:
        path_info = os.environ.get('PATH_INFO', '')
        if path_info.startswith('/'):
            path_info = path_info[1:]  # Remove leading slash
        return path_info
    except:
        return ''

def handle_request():
    """Handle CGI request with routing"""
    try:
        # Set content type and CORS headers
        print("Content-Type: application/json")
        print("Access-Control-Allow-Origin: *")
        print("Access-Control-Allow-Methods: GET, POST, OPTIONS")
        print("Access-Control-Allow-Headers: Content-Type")
        print()  # Empty line required after headers
        
        # Get request method and endpoint
        method = os.environ.get('REQUEST_METHOD', 'GET')
        endpoint = get_endpoint_from_path()
        
        if method == 'OPTIONS':
            # Handle preflight request
            return
        
        if method == 'POST':
            # Get POST data
            content_length = int(os.environ.get('CONTENT_LENGTH', 0))
            if content_length > 0:
                try:
                    post_data = sys.stdin.read(content_length)
                    data = json.loads(post_data)
                    
                    # Route based on endpoint
                    if endpoint == 'parse':
                        text = data.get('text', '')
                        result = parse_expense_cgi(text)
                        print(json.dumps(result))
                    elif endpoint == 'chat':
                        result = handle_chat_cgi(data)
                        print(json.dumps(result))
                    else:
                        # Default to parse for backward compatibility
                        text = data.get('text', '')
                        if text:
                            result = parse_expense_cgi(text)
                            print(json.dumps(result))
                        else:
                            error_result = {
                                "error": f"Unknown endpoint: {endpoint}",
                                "reply": "ERROR: Unknown endpoint"
                            }
                            print(json.dumps(error_result))
                            
                except json.JSONDecodeError as e:
                    error_result = {
                        "expenses": [],
                        "reply": f"ERROR: Invalid JSON data: {str(e)}"
                    }
                    print(json.dumps(error_result))
                except Exception as e:
                    error_result = {
                        "expenses": [],
                        "reply": f"ERROR: Processing error: {str(e)}"
                    }
                    print(json.dumps(error_result))
            else:
                error_result = {
                    "expenses": [],
                    "reply": "ERROR: No data received"
                }
                print(json.dumps(error_result))
        else:
            # Handle GET request (health check)
            health_result = {
                "status": "healthy",
                "message": "Personal Finance Manager API is running",
                "endpoints": ["parse", "chat"],
                "version": "1.0.0"
            }
            print(json.dumps(health_result))
            
    except Exception as e:
        # Last resort error handling
        print("Content-Type: application/json")
        print("Access-Control-Allow-Origin: *")
        print()
        error_result = {
            "error": f"Critical error: {str(e)}",
            "reply": f"ERROR: Critical server error: {str(e)}"
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    handle_request()