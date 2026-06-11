# CORS Error Fix - Google Apps Script Deployment

## 🔴 Error You're Seeing:

```
Access to fetch at 'https://script.google.com/...' from origin 'https://dnyansindhu.in' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Solution: Redeploy Google Apps Script with Correct Settings

### Step 1: Go to Your Google Apps Script

1. Open your Google Spreadsheet: **GyanSindhu Classes Database**
2. Click **Extensions** > **Apps Script**
3. You should see your script with the `doPost()` function

---

### Step 2: Create a NEW Deployment (CRITICAL)

⚠️ **DO NOT edit existing deployment** - Create a completely new one!

1. Click **Deploy** button (top right)
2. Click **NEW deployment** (not "Manage deployments")
3. Click the **⚙️ gear icon** next to "Select type"
4. Choose **Web app**

---

### Step 3: Configure Deployment Settings

Fill in these EXACT settings:

| Setting | Value |
|---------|-------|
| **Description** | `Dnyansindhu Sync v2` (or any name) |
| **Web app** | ✅ Enabled |
| **Execute as** | **Me** (your email@gmail.com) |
| **Who has access** | ⚠️ **Anyone** (NOT "Anyone with Google account") |

**CRITICAL:** Make sure "Who has access" is set to **Anyone** (no authentication required)

---

### Step 4: Deploy and Authorize

1. Click **Deploy** button
2. You'll see "Authorize access" - Click it
3. Choose your Google account
4. Click **Advanced**
5. Click **Go to [Your Project Name] (unsafe)**
6. Click **Allow** to grant permissions
7. Copy the **Web app URL** that appears
   - It looks like: `https://script.google.com/macros/s/ABC123.../exec`
   - **Save this URL** - you'll need it

---

### Step 5: Update URL in Your App

1. Go to your app: https://dnyansindhu.in/app.html
2. Login as admin (username: `admin`, password: `Capital@123`)
3. Go to **Settings**
4. Scroll to **Google Sheets Integration**
5. **Delete the old URL**
6. **Paste the NEW URL** you just copied
7. Click **Save Configuration**
8. Click **Test Connection**
9. You should see: ✅ "Google Sheets connection successful!"

---

## Why This Happens

The CORS error occurs when:

1. ❌ Deployment is set to "Anyone with Google account" (requires auth)
2. ❌ Old deployment has cached wrong settings
3. ❌ Script wasn't properly authorized

## Verification Checklist

After redeploying, verify:

- [ ] New deployment created (not edited old one)
- [ ] "Who has access" is set to **Anyone** (not "with Google account")
- [ ] Authorized access during deployment
- [ ] Copied the NEW web app URL
- [ ] Updated URL in app Settings
- [ ] Test Connection shows success
- [ ] Console shows successful sync (no CORS error)

---

## Testing After Fix

1. Open browser console (F12)
2. Go to Settings > Click **Sync All Now**
3. Watch console for:
   ```
   🔄 Starting sync to Google Sheets: Students
   📤 Sending payload...
   📥 Response status: 200 OK
   ✅ Successfully synced to Google Sheets: Students
   ```
4. Check your Google Spreadsheet - data should appear!

---

## Still Getting CORS Error?

### Solution A: Verify Deployment URL

1. Go to Apps Script
2. Click **Deploy** > **Manage deployments**
3. Look at your latest deployment
4. Click the URL to test it directly
5. You should see JSON response (not login page)
6. If you see a login page, the deployment is wrong

### Solution B: Check Apps Script Code

Make sure your `doPost` function doesn't have any authentication checks:

```javascript
function doPost(e) {
  // NO authentication or origin checks here!
  try {
    const data = JSON.parse(e.postData.contents);
    // ... rest of code
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Solution C: Clear Browser Cache

1. Open your app in **Incognito/Private mode**
2. Try the sync again
3. If it works in incognito, clear your browser cache

---

## Alternative: Test with Simple Script First

If still not working, test with this minimal script:

```javascript
function doPost(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "CORS works!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return doPost(e);
}
```

1. Replace your Apps Script code with this
2. Deploy as Web App (Anyone access)
3. Copy URL
4. Test in browser: `https://script.google.com/.../exec`
5. Should see: `{"success":true,"message":"CORS works!"}`
6. If this works, the issue is in your script code
7. If this doesn't work, the deployment settings are wrong

---

## Common Mistakes

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| Who has access: "Anyone with Google account" | Who has access: "Anyone" |
| Editing old deployment | Creating NEW deployment |
| URL without `/exec` at end | URL with `/exec` |
| Not authorizing during deployment | Clicking "Allow" when prompted |
| Using test deployment URL | Using production Web app URL |

---

## Need More Help?

1. **Check Apps Script Execution Logs:**
   - Apps Script editor > Left menu > **Executions**
   - Look for recent runs and errors

2. **Test the URL directly:**
   - Paste the webhook URL in browser
   - Add `?test=1` at the end
   - Should get JSON response (not login page)

3. **Console Output:**
   - Share the full browser console output
   - Include both the error and the URL being called

4. **Deployment Screenshot:**
   - Take screenshot of your deployment settings
   - Verify "Who has access" dropdown shows "Anyone"

---

**Created:** June 11, 2026  
**Status:** CORS Fix Guide  
**Next Step:** Create NEW deployment with "Anyone" access
