# Deployment Guide - PFM Application

This guide explains how to deploy the backend to Vercel and the frontend to cPanel.

---

## Part 1: Deploy Backend to Vercel

### Step 1: Vercel Project Setup (You're Currently Here)

You're importing from GitHub: `Gauravkrsah/PFM` on the `main` branch.

**Configure the following settings:**

1. **Framework Preset**: Select **"Other"** (NOT Create React App)
   - Create React App is for frontend, but we're deploying the backend

2. **Root Directory**: Enter `./backend`
   - This tells Vercel to deploy only the backend folder

3. **Build Command**: Leave empty or enter: `pip install -r requirements.txt`

4. **Output Directory**: Leave empty

5. **Install Command**: Leave as default

### Step 2: Add Environment Variables

After clicking "Deploy", go to your project settings and add these environment variables:

**Required Environment Variables:**
```
SUPABASE_URL=https://qbcczhvrmlmorzszdkmm.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiY2N6aHZybWxtb3J6c3pka21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTQxNTEsImV4cCI6MjA2OTE3MDE1MX0.ugK8RtY3GlKKNuy0im1h8DWLCOzdv95HMDcv-RVDLlI
GEMINI_API_KEY=AIzaSyAj0IlBxZUnskZLEvmzZUQQLObMRqGiJjE
```

**To add environment variables:**
1. Go to your Vercel project dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in the left sidebar
4. Add each variable with its value
5. Select all environments (Production, Preview, Development)
6. Click "Save"

### Step 3: Redeploy

After adding environment variables:
1. Go to the "Deployments" tab
2. Click the three dots (...) on your latest deployment
3. Click "Redeploy"

### Step 4: Get Your Backend URL

Once deployed successfully:
1. Your backend will be available at: `https://your-project-name.vercel.app`
2. Copy this URL - you'll need it for the frontend configuration

**Test your backend:**
- Visit: `https://your-project-name.vercel.app/health`
- You should see: `{"status":"healthy","message":"Personal Finance Manager API is running"}`

---

## Part 2: Deploy Frontend to cPanel

### Step 1: Update Frontend Configuration

**Before building, update the backend URL in your local project:**

1. Edit `.env.production` file and replace the placeholder:
   ```env
   REACT_APP_API_BASE_URL=https://your-actual-backend-url.vercel.app
   ```
   Replace `https://your-actual-backend-url.vercel.app` with your actual Vercel backend URL from Step 4 above.

2. Alternatively, create a `.env.production.local` file (this won't be committed to git):
   ```env
   REACT_APP_SUPABASE_URL=https://qbcczhvrmlmorzszdkmm.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiY2N6aHZybWxtb3J6c3pka21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTQxNTEsImV4cCI6MjA2OTE3MDE1MX0.ugK8RtY3GlKKNuy0im1h8DWLCOzdv95HMDcv-RVDLlI
   REACT_APP_API_BASE_URL=https://your-actual-backend-url.vercel.app
   ```

### Step 2: Build the Frontend

Run the build command in your project root:

```bash
npm run build
```

This will create a `build` folder with all your production-ready files.

### Step 3: Upload to cPanel

**Option A: Using File Manager (Recommended for beginners)**

1. **Login to cPanel**
   - Go to your hosting provider's cPanel URL
   - Login with your credentials

2. **Navigate to File Manager**
   - Find and click "File Manager" in cPanel
   - Navigate to `public_html` (or your domain's document root)

3. **Upload Build Files**
   - If using the main domain, upload directly to `public_html`
   - If using a subdomain, create/navigate to the subdomain folder
   - **Delete any existing files** (if this is a fresh deployment)
   - Upload all files from your local `build` folder
   - Make sure to upload:
     - `index.html`
     - `static` folder (contains CSS and JS)
     - `manifest.json`
     - Any other files in the build folder

4. **Extract (if you zipped the files)**
   - If you zipped the build folder, upload the zip
   - Right-click the zip file → Extract
   - Move all files to the root of your domain folder

**Option B: Using FTP Client (FileZilla, etc.)**

1. Connect to your hosting via FTP
2. Navigate to `public_html` or your domain's root
3. Upload all files from the `build` folder
4. Ensure file permissions are correct (usually 644 for files, 755 for folders)

### Step 4: Configure .htaccess for React Router

Create/edit `.htaccess` file in your domain root with this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Disable directory browsing
Options -Indexes

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static resources
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

### Step 5: Verify Deployment

1. Visit your domain in a browser
2. Check if the app loads correctly
3. Test login functionality
4. Test adding expenses (this will verify backend connectivity)
5. Check browser console for any errors

---

## Troubleshooting

### Backend Issues

**Problem: Vercel deployment fails**
- Solution: Check the deployment logs in Vercel dashboard
- Ensure `vercel.json` is in the `backend` folder
- Verify environment variables are set correctly

**Problem: API returns 500 errors**
- Solution: Check Vercel function logs
- Verify Supabase and Gemini API keys are correct
- Ensure all required Python packages are in `requirements.txt`

**Problem: CORS errors**
- Solution: Backend is configured to allow all origins (`allow_origins=["*"]`)
- If needed, update [`main.py`](backend/main.py) to specify your domain

### Frontend Issues

**Problem: White screen after deployment**
- Solution: Check browser console for errors
- Verify `REACT_APP_API_BASE_URL` is set correctly in `.env.production`
- Clear browser cache and try again

**Problem: Routes don't work (404 errors)**
- Solution: Ensure `.htaccess` file is configured correctly (see Step 4)
- Check if mod_rewrite is enabled in cPanel (contact hosting support if needed)

**Problem: API calls fail**
- Solution: Verify the backend URL is correct in `.env.production`
- Check if CORS is properly configured
- Test the backend health endpoint directly

**Problem: Images or CSS not loading**
- Solution: Check file paths in build folder
- Ensure all files were uploaded correctly
- Check file permissions (should be 644 for files)

---

## Quick Reference

### Backend Vercel Configuration
- **Root Directory**: `./backend`
- **Framework**: Other
- **Build Command**: `pip install -r requirements.txt`

### Environment Variables (Backend - Vercel)
```
SUPABASE_URL
SUPABASE_KEY
GEMINI_API_KEY
```

### Environment Variables (Frontend - .env.production)
```
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY
REACT_APP_API_BASE_URL (your Vercel backend URL)
```

### Important Files
- [`backend/vercel.json`](backend/vercel.json) - Vercel configuration
- [`backend/api/index.py`](backend/api/index.py) - Serverless function entry point
- [`.env.production`](.env.production) - Frontend production environment variables
- [`src/config/api.js`](src/config/api.js) - API configuration for different environments

---

## After Deployment Checklist

- [ ] Backend deployed to Vercel successfully
- [ ] Backend health endpoint returns 200
- [ ] Environment variables set in Vercel
- [ ] Frontend `.env.production` updated with Vercel backend URL
- [ ] Frontend built with `npm run build`
- [ ] Build files uploaded to cPanel
- [ ] `.htaccess` file configured for React Router
- [ ] Website loads at your domain
- [ ] Login functionality works
- [ ] Expense creation works (backend connectivity confirmed)
- [ ] All routes work correctly

---

## Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check Vercel function logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure your domain DNS is pointing to the correct hosting
5. Contact your hosting support for server-side issues

---

**Last Updated**: October 23, 2025