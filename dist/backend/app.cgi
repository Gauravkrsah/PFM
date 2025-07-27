#!/usr/bin/env python3

import sys
import os
import json
import cgi
import cgitb
from urllib.parse import parse_qs

# Enable CGI error reporting
cgitb.enable()

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import our modules
from nlp_parser import parser

def parse_expense_cgi(text):
    """Parse expense text and return structured expense data"""
    try:
        expenses, reply = parser.parse(text)
        return {
            "expenses": expenses,
            "reply": reply
        }
    except Exception as e:
        return {
            "expenses": [],
            "reply": f"ERROR: Error parsing expenses: {str(e)}"
        }

def handle_request():
    """Handle CGI request"""
    # Set content type
    print("Content-Type: application/json")
    print("Access-Control-Allow-Origin: *")
    print("Access-Control-Allow-Methods: GET, POST, OPTIONS")
    print("Access-Control-Allow-Headers: Content-Type")
    print()  # Empty line required after headers
    
    # Get request method
    method = os.environ.get('REQUEST_METHOD', 'GET')
    
    if method == 'OPTIONS':
        # Handle preflight request
        return
    
    if method == 'POST':
        # Get POST data
        content_length = int(os.environ.get('CONTENT_LENGTH', 0))
        if content_length > 0:
            post_data = sys.stdin.read(content_length)
            try:
                data = json.loads(post_data)
                text = data.get('text', '')
                
                # Parse the expense
                result = parse_expense_cgi(text)
                print(json.dumps(result))
                
            except json.JSONDecodeError:
                error_result = {
                    "expenses": [],
                    "reply": "ERROR: Invalid JSON data"
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
            "message": "Personal Finance Manager API is running"
        }
        print(json.dumps(health_result))

if __name__ == "__main__":
    handle_request()