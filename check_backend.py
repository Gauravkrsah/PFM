#!/usr/bin/env python3
"""
Quick script to check if backend is running
"""
import requests
import sys

def check_backend():
    try:
        print("Checking backend server...")
        response = requests.get("http://localhost:8000/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("[SUCCESS] Backend is running!")
            print(f"Status: {data.get('status', 'unknown')}")
            print(f"Gemini AI: {'Available' if data.get('gemini_available') else 'Not Available'}")
            print(f"Message: {data.get('message', 'No message')}")
            return True
        else:
            print(f"[ERROR] Backend responded with status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("[ERROR] Cannot connect to backend server at http://localhost:8000")
        print("Make sure to start the backend with: cd backend && python main.py")
        return False
    except requests.exceptions.Timeout:
        print("[ERROR] Backend server is not responding (timeout)")
        return False
    except Exception as e:
        print(f"[ERROR] Error checking backend: {e}")
        return False

if __name__ == "__main__":
    if check_backend():
        print("\n[SUCCESS] Backend is ready! You can now use the chat features.")
    else:
        print("\n[INFO] Please start the backend server first:")
        print("1. Open a new terminal")
        print("2. cd backend")
        print("3. python main.py")
        print("4. Wait for 'Application startup complete' message")
        sys.exit(1)