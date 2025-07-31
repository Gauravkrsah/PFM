# 🔧 Fix Supabase OTP Configuration

## ❌ **Current Issue:**
Users are getting email confirmation links instead of OTP codes, and links redirect to localhost (which expires).

## ✅ **Solution:**

### **Step 1: Update Supabase Dashboard Settings**

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication → Settings**
3. **Find "Email Confirmation" section**
4. **Change these settings:**

```
✅ Enable email confirmations: ON
✅ Secure email change: ON  
✅ Enable phone confirmations: OFF (unless you want SMS OTP)
```

### **Step 2: Update Email Templates (Important!)**

1. **Go to Authentication → Email Templates**
2. **Select "Confirm signup" template**
3. **Replace the template with OTP-based one:**

```html
<h2>Confirm your signup</h2>
<p>Your verification code is:</p>
<h1 style="font-size: 32px; color: #1a73e8; letter-spacing: 5px;">{{ .Token }}</h1>
<p>Enter this code in the app to verify your email.</p>
<p>This code expires in 24 hours.</p>
```

### **Step 3: Alternative - Disable Email Confirmation**

If you want instant signup without verification:

1. **Go to Authentication → Settings**
2. **Turn OFF "Enable email confirmations"**
3. **Users will be signed in immediately after signup**

### **Step 4: Test the Fix**

After making changes:
1. Try signing up with a new email
2. You should receive an OTP code (not a link)
3. Enter the 6-digit code in the app

## 🚀 **Quick Fix Code (Already Applied):**

I've updated the auth code to:
- ✅ Use `type: 'signup'` for OTP verification
- ✅ Remove email redirect URLs
- ✅ Handle OTP properly

## 🎯 **Recommended Setting:**

**For Mobile App:** Disable email confirmation entirely since mobile users expect instant access.

**For Web App:** Use OTP verification for better security.

Choose based on your preference!