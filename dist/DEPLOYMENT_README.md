# Personal Finance Manager - Deployment Guide

## Overview
This `dist` folder contains the production-ready build of the Personal Finance Manager application, optimized for cPanel hosting.

## Deployment Instructions

### 1. Upload to cPanel
1. Upload all contents of this `dist` folder to your domain's public_html directory
2. Set the document root to point to the uploaded folder

### 2. File Structure
```
public_html/
├── index.html              # Main React app entry point
├── .htaccess              # Apache configuration for routing
├── config.js              # Production configuration
├── asset-manifest.json    # Build manifest
├── static/                # Static assets (CSS, JS)
│   ├── css/
│   └── js/
└── backend/               # Python backend
    ├── app.cgi           # CGI entry point
    ├── main.py           # FastAPI backend (for reference)
    ├── nlp_parser.py     # Expense parsing logic
    └── requirements.txt  # Python dependencies
```

### 3. Backend Setup
The backend uses CGI for cPanel compatibility:
- `app.cgi` is the main entry point for API calls
- Ensure Python 3 is available on your hosting
- Install required packages: `pip install -r backend/requirements.txt`

**IMPORTANT: Set Execute Permissions**
After uploading, you MUST set execute permissions on the CGI script:
1. In cPanel File Manager, navigate to `backend/app.cgi`
2. Right-click → Permissions → Set to 755 (rwxr-xr-x)
3. Or via SSH: `chmod 755 backend/app.cgi`

Without execute permissions, you'll get "Permission denied" errors.

### 4. Environment Variables
Create a `.env` file in the backend directory with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key (optional)
```

### 5. API Endpoints
- Parse expenses: `POST /backend/app.cgi/parse` with `{"text": "expense description"}`
- Chat: `POST /backend/app.cgi/chat` with chat payload
- Health check: `GET /backend/app.cgi`

### 6. Troubleshooting
**Common Issues:**
- **500 Error "Permission denied"**: Set execute permissions on `app.cgi` (chmod 755)
- **API not found**: Check that `.htaccess` is uploaded and working
- **CORS errors**: Ensure `Access-Control-Allow-Origin` headers are set in CGI script

### 7. Features
- ✅ Expense parsing with natural language processing
- ✅ Category auto-detection (Food, Transport, Groceries, etc.)
- ✅ Multiple input formats support
- ✅ Clean item name extraction
- ✅ Proper error handling

### 8. Supported Input Formats
- "500 for petrol" → Transport category
- "spend 300 on momo" → Food category  
- "rent 20000 paid by john" → Rent category with payer info
- "grocery 1500, taxi 200" → Multiple expenses

## Technical Notes
- Frontend: React with Tailwind CSS
- Backend: Python with FastAPI (CGI mode)
- Database: Supabase
- Authentication: Supabase Auth
- Deployment: cPanel compatible

## Support
For issues or questions, refer to the main repository documentation.