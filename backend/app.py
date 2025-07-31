#!/usr/bin/env python3
"""
Production WSGI entry point for cPanel deployment
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from main import app

# For cPanel/WSGI deployment
application = app

if __name__ == "__main__":
    app.run(debug=False)