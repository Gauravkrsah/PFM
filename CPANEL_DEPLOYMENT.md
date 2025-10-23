# Quick Guide: Deploy Frontend to cPanel

This is a simplified guide for deploying the React frontend to cPanel after the backend is deployed to Vercel.

---

## Prerequisites

✅ Backend is deployed to Vercel  
✅ You have your Vercel backend URL (e.g., `https://pfm-backend.vercel.app`)  
✅ You have cPanel access to your domain  

---

## Step-by-Step Instructions

### 1. Update Backend URL

Edit `.env.production` in your project root:

```env
REACT_APP_SUPABASE_URL=https://qbcczhvrmlmorzszdkmm.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiY2N6aHZybWxtb3J6c3pka21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTQxNTEsImV4cCI6MjA2OTE3MDE1MX0.ugK8RtY3GlKKNuy0im1h8DWLCOzdv95HMDcv-RVDLlI
REACT_APP_API_BASE_URL=https://YOUR-VERCEL-BACKEND-URL.vercel.app
GEMINI_API_KEY=AIzaSyAj0IlBxZUnskZLEvmzZUQQLObMRqGiJjE
```

**Replace** `https://YOUR-VERCEL-BACKEND-URL.vercel.app` with your actual Vercel URL!

### 2. Build the Frontend

Open terminal in your project folder and run:

```bash
npm run build
```

Wait for the build to complete. This creates a `build` folder.

### 3. Prepare Files for Upload

**Option A: Upload directly**
- Navigate to the `build` folder in your project

**Option B: Create a zip file (easier for many files)**
```bash
# Windows (PowerShell)
Compress-Archive -Path build\* -DestinationPath build.zip

# Mac/Linux
cd build && zip -r ../build.zip * && cd ..
```

### 4. Upload to cPanel

#### Login to cPanel
1. Go to your hosting cPanel URL
2. Login with your credentials

#### Access File Manager
1. Find "File Manager" in cPanel
2. Click to open

#### Navigate to Your Domain Folder
- For main domain: `public_html`
- For subdomain: `public_html/subdomain-name`
- For addon domain: `public_html/domain-name`

#### Upload Files

**If you have a zip file:**
1. Click "Upload" button in File Manager
2. Choose your `build.zip` file
3. Wait for upload to complete
4. Go back to File Manager
5. Right-click the zip file → "Extract"
6. After extraction, delete the zip file
7. Move all files from the extracted `build` folder to your domain root

**If uploading directly:**
1. Delete any existing files in the folder (except `.htaccess` if it exists)
2. Click "Upload" button
3. Select ALL files from your `build` folder
4. Upload them

### 5. Create .htaccess File

In File Manager, create a new file named `.htaccess` in your domain root:

1. Click "+ File" button
2. Name it exactly: `.htaccess`
3. Right-click → "Edit"
4. Paste this content:

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

Options -Indexes

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

5. Save the file

### 6. Verify Files

Make sure these are in your domain folder:
- ✅ `index.html`
- ✅ `static` folder (contains `css` and `js` folders)
- ✅ `manifest.json`
- ✅ `.htaccess`

### 7. Test Your Website

1. Open your domain in a browser
2. You should see your PFM app
3. Try logging in
4. Try adding an expense (this tests backend connectivity)

---

## Common Issues & Solutions

### Issue: White Screen

**Solution:**
- Check browser console (F12) for errors
- Verify backend URL in `.env.production` is correct
- Rebuild: `npm run build`
- Re-upload files

### Issue: Page Not Found on Refresh

**Solution:**
- Check if `.htaccess` file exists and has correct content
- Contact hosting support to enable `mod_rewrite`

### Issue: API Calls Not Working

**Solution:**
- Verify backend URL is correct in `.env.production`
- Test backend directly: `https://your-backend.vercel.app/health`
- Check browser console for CORS errors

### Issue: CSS/Images Not Loading

**Solution:**
- Make sure the `static` folder was uploaded
- Check file permissions (should be 644 for files, 755 for folders)
- Clear browser cache (Ctrl+Shift+Delete)

---

## Quick Checklist

Before going live:

- [ ] `.env.production` has correct Vercel backend URL
- [ ] Ran `npm run build` successfully
- [ ] All files from `build` folder uploaded to cPanel
- [ ] `.htaccess` file created with correct content
- [ ] Website loads at your domain
- [ ] Login works
- [ ] Can add/view expenses
- [ ] All pages load correctly

---

## Need Help?

1. **Backend not responding**: Check [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) Part 1
2. **Detailed troubleshooting**: See full guide in [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)
3. **Vercel logs**: Check Vercel dashboard → Functions → Logs

---

**Tip**: After any code changes, you must:
1. Update code in GitHub
2. Vercel will auto-deploy backend
3. Run `npm run build` locally
4. Re-upload build files to cPanel