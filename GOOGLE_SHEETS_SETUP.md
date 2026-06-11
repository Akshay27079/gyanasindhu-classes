# Google Sheets Integration Setup Guide

This guide will help you configure Google Sheets as the backend database for the ज्ञानसिंधू क्लासेस Management System.

## Overview

The app uses **Google Apps Script** as a webhook/proxy to securely write data to Google Sheets. This approach:
- ✅ Works from client-side without exposing API keys
- ✅ Handles authentication securely
- ✅ **Includes CORS support** for cross-domain requests (dnyansindhu.in → script.google.com)
- ✅ Handles browser preflight (OPTIONS) requests properly
- ✅ Provides real-time data synchronization

**Latest Update (v2.1):** Added comprehensive CORS support to fix "Access-Control-Allow-Origin" errors when accessing from dnyansindhu.in domain.

## Prerequisites
- A Google account
- The app.html file deployed on GitHub Pages or local server

---

## Step 1: Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: **GyanSindhu Classes Database**
4. Create 5 sheets (tabs) with these **exact names**:
   - `Students`
   - `Teachers`
   - `Attendance`
   - `Marks`
   - `Activity`

**Important:** Sheet names are case-sensitive!

---

## Step 2: Add Column Headers (Optional but Recommended)

For each sheet, add headers in the first row:

### Students Sheet:
```
id | username | name | fatherName | phone | parentPhone | parentName | class | stream | address | admDate | feeAmount | feePaid | feeStatus | whatsappOptOut | createdAt
```

### Teachers Sheet:
```
id | username | name | subject | phone | assignedClasses | createdAt
```

### Attendance Sheet:
```
id | date | class | records | savedBy | savedAt
```

### Marks Sheet:
```
id | test | class | subject | date | totalMarks | records | savedBy | savedAt
```

### Activity Sheet:
```
action | time
```

---

## Step 3: Create Google Apps Script

1. In your spreadsheet, click **Extensions** > **Apps Script**
2. Open the repository file `Code.gs`, copy its complete contents into the Apps Script editor, and save it.
3. Do not use the older inline sample below. `Code.gs` is the current version and includes:
   - fresh reads for every login and page refresh
   - locked record-level create, update, and delete operations
   - all login/password fields required by the app
   - CORS-safe requests without unsupported `TextOutput.setHeader()` calls

> **Important:** After changing `Code.gs`, create a **new web app deployment version**. Editing the script alone does not update an existing deployment.
2. Delete the default `function myFunction() {}` code
3. **Copy and paste** the following complete script:

> ⚠️ **IMPORTANT:** This script includes CORS support! If you're updating from an older version, make sure to:
> - Copy the ENTIRE script below (don't miss the CORS functions at the top)
> - Redeploy as a NEW version (see Step 4)
> - Clear your browser cache after redeploying

```javascript
// ============================================
// GOOGLE APPS SCRIPT FOR DNYANSINDHU CLASSES
// WITH CORS SUPPORT
// ============================================

// Configuration
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Handle GET requests (for health checks and OPTIONS preflight)
function doGet(e) {
  return handleCORS();
}

// Main function to handle POST requests from the web app
function doPost(e) {
  try {
    // Parse the incoming request
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheetName = data.sheetName;
    
    Logger.log('Received request: ' + action + ' for sheet: ' + sheetName);
    
    let response;
    if (action === 'write') {
      response = writeData(sheetName, data.records);
    } else if (action === 'read') {
      response = readData(sheetName);
    } else {
      response = createResponse({
        success: false,
        error: 'Invalid action: ' + action
      });
    }
    
    // Add CORS headers to response
    return addCORSHeaders(response);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return addCORSHeaders(createResponse({
      success: false,
      error: error.toString()
    }));
  }
}

// Handle CORS preflight requests
function handleCORS() {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'CORS OK' }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '3600');
}

// Add CORS headers to any response
function addCORSHeaders(response) {
  return response
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Create a JSON response
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Write data to a sheet
function writeData(sheetName, records) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log('Created new sheet: ' + sheetName);
    }
    
    // Clear existing data (keep headers if present)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    } else if (lastRow === 0) {
      // Add headers if sheet is completely empty
      addHeaders(sheet, sheetName);
    }
    
    // Convert records to 2D array
    if (!records || records.length === 0) {
      Logger.log('No records to write for ' + sheetName);
      return createResponse({
        success: true,
        message: 'No data to write',
        rowsWritten: 0
      });
    }
    
    const rows = records.map(record => objectToArray(record, sheetName));
    
    // Write data
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    
    Logger.log('Successfully wrote ' + rows.length + ' rows to ' + sheetName);
    
    return createResponse({
      success: true,
      message: 'Data written successfully',
      rowsWritten: rows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    Logger.log('Error in writeData: ' + error.toString());
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

// Read data from a sheet
function readData(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return createResponse({
        success: false,
        error: 'Sheet not found: ' + sheetName
      });
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      // Only headers or empty
      return createResponse({
        success: true,
        data: []
      });
    }
    
    // Convert to objects
    const headers = data[0];
    const records = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });
    
    return createResponse({
      success: true,
      data: records
    });
    
  } catch (error) {
    Logger.log('Error in readData: ' + error.toString());
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

// Add headers based on sheet type
function addHeaders(sheet, sheetName) {
  let headers = [];
  
  switch(sheetName) {
    case 'Students':
      headers = ['id', 'username', 'name', 'fatherName', 'phone', 'parentPhone', 'parentName', 
                 'class', 'stream', 'address', 'admDate', 'feeAmount', 'feePaid', 'feeStatus', 
                 'whatsappOptOut', 'createdAt'];
      break;
    case 'Teachers':
      headers = ['id', 'username', 'name', 'subject', 'phone', 'assignedClasses', 'createdAt'];
      break;
    case 'Attendance':
      headers = ['id', 'date', 'class', 'records', 'savedBy', 'savedAt'];
      break;
    case 'Marks':
      headers = ['id', 'test', 'class', 'subject', 'date', 'totalMarks', 'records', 'savedBy', 'savedAt'];
      break;
    case 'Activity':
      headers = ['action', 'time'];
      break;
    default:
      headers = ['data'];
  }
  
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
}

// Convert object to array based on sheet type
function objectToArray(obj, sheetName) {
  switch(sheetName) {
    case 'Students':
      return [
        obj.id || '', obj.username || '', obj.name || '', obj.fatherName || '',
        obj.phone || '', obj.parentPhone || '', obj.parentName || '',
        obj.class || '', obj.stream || '', obj.address || '', obj.admDate || '',
        obj.feeAmount || 0, obj.feePaid || 0, obj.feeStatus || '',
        obj.whatsappOptOut || false, obj.createdAt || ''
      ];
    case 'Teachers':
      return [
        obj.id || '', obj.username || '', obj.name || '', obj.subject || '',
        obj.phone || '', JSON.stringify(obj.assignedClasses || []), obj.createdAt || ''
      ];
    case 'Attendance':
      return [
        obj.id || '', obj.date || '', obj.class || '',
        JSON.stringify(obj.records || []), obj.savedBy || '', obj.savedAt || ''
      ];
    case 'Marks':
      return [
        obj.id || '', obj.test || '', obj.class || '', obj.subject || '',
        obj.date || '', obj.totalMarks || 0, JSON.stringify(obj.records || []),
        obj.savedBy || '', obj.savedAt || ''
      ];
    case 'Activity':
      return [obj.action || '', obj.time || ''];
    default:
      return [JSON.stringify(obj)];
  }
}
```

4. Click **Save** (💾 icon) and name your project: `Dnyansindhu Sync Service`

---

## Step 4: Deploy as Web App

1. Click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ and select **Web app**
3. Configure:
   - **Description**: `Dnyansindhu Classes Sync API v2 - CORS Enabled`
   - **Execute as**: **Me** (your account)
   - **Who has access**: **Anyone** (important!)
4. Click **Deploy**
5. **Authorize access**:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** > **Go to [project name] (unsafe)**
   - Click **Allow**
6. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

⚠️ **IMPORTANT - If Updating Existing Script:**
- After making code changes, you MUST create a **NEW deployment**
- Simply saving code is NOT enough - the old deployment URL won't get the changes
- Go to **Deploy** > **Manage deployments** > Click **✎ Edit** on your active deployment
- Change version to **New version** in the dropdown
- Click **Deploy**
- The URL remains the same but now uses your updated code

---

## Step 5: Configure app.html

1. Open your web app at: `https://yourusername.github.io/Dnyansidhu/app.html`
2. Login as **admin** (username: `admin`, password: `Capital@123`)
3. Go to **Settings**
4. In the **Google Sheets Integration** section:
   - Paste the **Web App URL** you copied
   - Click **Save Configuration**
   - Click **Test Connection** to verify it works
   - Click **Sync All Now** to sync existing data

---

## Step 6: Test the Integration

1. **Add a test student**:
   - Go to Students > Add Student
   - Fill in the form and save
2. **Check your spreadsheet** - the data should appear in the Students sheet!
3. **Check the browser console** (F12) for sync logs

---

## How It Works

```
App (Browser) → Google Apps Script (Proxy) → Google Sheets
     ↓
  localStorage (instant backup)
```

- **Dual Storage**: Data saves to localStorage first (instant), then syncs to Google Sheets
- **Offline-First**: App works offline using localStorage
- **Auto-Sync**: Every save operation triggers a background sync
- **Fallback**: If sync fails, data remains in localStorage
- **Visual Feedback**: Sync status indicator shows real-time sync state

---

## Troubleshooting

### ❌ CORS Error: "No 'Access-Control-Allow-Origin' header"

**Full Error:**
```
Access to fetch at 'https://script.google.com/.../exec' from origin 'https://dnyansindhu.in' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**What is CORS?**
CORS (Cross-Origin Resource Security) is a browser security feature that blocks websites from making requests to different domains unless the server explicitly allows it. When your website (dnyansindhu.in) tries to access Google Apps Script (script.google.com), the browser first sends a "preflight" OPTIONS request to check if it's allowed.

**Why This Happens:**
- Google Apps Script doesn't automatically handle OPTIONS requests (preflight checks)
- The old script code only handled POST requests
- Without handling OPTIONS, the browser blocks the actual POST request

**How to Fix:**

1. **Update Your Apps Script Code:**
   - Make sure you're using the CORS-enabled script code from Step 3 above
   - The key additions are:
     - `doGet()` function to handle OPTIONS requests
     - `handleCORS()` function that returns proper CORS headers
     - `addCORSHeaders()` function that adds CORS headers to all responses

2. **Redeploy the Script:**
   - ⚠️ **CRITICAL:** Just saving code is NOT enough!
   - Go to **Deploy** > **Manage deployments**
   - Click the **✎ Edit** icon on your active deployment
   - In the "Version" dropdown, select **New version**
   - Add description: `CORS fix applied`
   - Click **Deploy**
   - The URL stays the same, but now uses your updated code

3. **Clear Browser Cache:**
   - Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
   - Select "Cached images and files"
   - Click **Clear data**
   - Or use **Incognito/Private mode** to test

4. **Verify CORS Headers:**
   - Open your website (dnyansindhu.in)
   - Open Browser DevTools (F12)
   - Go to **Network** tab
   - Click **Test Connection** in Settings
   - Look for the request to script.google.com
   - Click on it and check **Response Headers**:
     - Should see: `Access-Control-Allow-Origin: *`
     - Should see: `Access-Control-Allow-Methods: GET, POST, OPTIONS`
     - Should see: `Access-Control-Allow-Headers: Content-Type`

**Still Not Working?**

Try this test in Browser Console (F12):
```javascript
fetch('YOUR_SCRIPT_URL_HERE', {
  method: 'OPTIONS',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Expected Result:** 
```json
{"success": true, "message": "CORS OK"}
```

If you see CORS error, the script isn't updated:
- Double-check you created a **new version** deployment
- Try creating a completely **new deployment** (not editing existing)
- Wait 1-2 minutes for Google to propagate changes

---

### ❌ "Connection test failed"

**Check:**
1. Is the Web App URL correct in Settings?
2. Did you deploy as **Web app** (not API Executable)?
3. Did you set access to **Anyone**?
4. Did you authorize access during deployment?

**Fix:**
- Go back to Apps Script > Deploy > Manage deployments
- Create a **new deployment** (don't edit the old one)
- Copy the new URL and update in app settings

---

### ❌ Data not appearing in sheets

**Check:**
1. Open Browser Console (F12) and look for errors
2. Check the Apps Script logs:
   - Go to Apps Script editor
   - Click **Executions** on the left
   - Look for recent runs and errors

**Fix:**
- Ensure sheet names match exactly: `Students`, `Teachers`, etc.
- Check that records are being sent (look at console logs starting with 🔄)

---

### ❌ "Authorization required" error

**Fix:**
1. Go to Apps Script > Deploy > Manage deployments
2. Click ⋮ (three dots) > **Test deployments**
3. Click the test link - it will ask for authorization
4. Authorize and then go back to your app

---

### ⚠️ Sync is slow

**Explanation:** 
- Google Apps Script can take 1-3 seconds per request
- This is normal for free tier
- Data is saved to localStorage first, so the app remains fast

---

### ❌ "Service invoked too many times"

**Problem:** Hit Google's rate limit (usually 20,000 calls/day)

**Fix:**
- This shouldn't happen in normal use
- If testing, avoid repeated sync operations
- Consider batch updates

---

### 🔍 How to Check If CORS Is Working

**Method 1: Browser DevTools**
1. Open your site (dnyansindhu.in)
2. Press F12 to open DevTools
3. Go to **Network** tab
4. Click "Test Connection" in Settings
5. Find the request to `script.google.com`
6. Click on it
7. Check **Response Headers** tab
8. You should see:
   ```
   access-control-allow-origin: *
   access-control-allow-methods: GET, POST, OPTIONS
   access-control-allow-headers: Content-Type
   ```

**Method 2: Direct Test**
Visit this URL in browser (replace with your script URL):
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

You should see:
```json
{"success":true,"message":"CORS OK"}
```

If you see this, CORS is working! ✅

---

## Security Considerations

✅ **Good:**
- No API keys exposed in client code
- Apps Script handles authentication
- Only authorized Google account can modify sheets

⚠️ **Note:**
- The webhook URL is public but only writes to YOUR spreadsheet
- For production with sensitive data, add IP restrictions in Apps Script
- Passwords in the app are plain text (suitable for internal use only)

---

---

## Quick Reference: Redeploying After Code Changes

If you update the Apps Script code (for bug fixes, CORS fixes, etc.):

### Option 1: Update Existing Deployment (Recommended)
1. Go to **Deploy** > **Manage deployments**
2. Click **✎ Edit** on the active deployment
3. Change "Version" to **New version**
4. Add description of changes
5. Click **Deploy**
6. ✅ URL stays the same - no need to update app settings

### Option 2: Create New Deployment
1. Go to **Deploy** > **New deployment**
2. Select **Web app**
3. Configure as before
4. Copy new URL
5. ⚠️ Update URL in app settings

### After Redeployment:
- Clear browser cache or test in incognito mode
- Test connection in app Settings
- Check browser console (F12) for errors

---

## Testing Checklist

After setup or changes, verify:

- [ ] Apps Script saved successfully
- [ ] Deployed as Web App with "Anyone" access
- [ ] Web App URL copied correctly
- [ ] URL pasted in app Settings
- [ ] "Test Connection" shows success
- [ ] No CORS errors in browser console (F12)
- [ ] Test data appears in Google Sheets
- [ ] Sync indicator shows "Synced ✓"

---

## Advanced: Restrict to Specific Domain (Optional)

By default, the script allows requests from ANY origin (`Access-Control-Allow-Origin: *`). For better security, you can restrict it to only your domain:

### Method 1: Single Domain

Replace the `handleCORS()` function with:

```javascript
function handleCORS(origin) {
  const allowedOrigin = 'https://dnyansindhu.in';
  const responseOrigin = (origin === allowedOrigin) ? allowedOrigin : '';
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'CORS OK' }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', responseOrigin || allowedOrigin)
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '3600');
}

function addCORSHeaders(response, origin) {
  const allowedOrigin = 'https://dnyansindhu.in';
  const responseOrigin = (origin === allowedOrigin) ? allowedOrigin : '';
  
  return response
    .setHeader('Access-Control-Allow-Origin', responseOrigin || allowedOrigin)
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

### Method 2: Multiple Domains (for testing + production)

```javascript
function handleCORS(origin) {
  const allowedOrigins = [
    'https://dnyansindhu.in',
    'https://yourusername.github.io',
    'http://localhost:5500'
  ];
  
  const responseOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'CORS OK' }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', responseOrigin)
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '3600');
}

function addCORSHeaders(response, origin) {
  const allowedOrigins = [
    'https://dnyansindhu.in',
    'https://yourusername.github.io',
    'http://localhost:5500'
  ];
  
  const responseOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return response
    .setHeader('Access-Control-Allow-Origin', responseOrigin)
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

**Note:** After making these changes, you must **redeploy** (see Quick Reference section above).

---

## Backup and Recovery

### Manual Backup:
1. Go to Admin > Settings
2. Click **Export All Data**
3. Save the JSON file

### Restore from Google Sheets:
1. Download sheet as CSV
2. Manually import or use a custom import feature (to be added)

### Automatic Backup:
- Google Sheets has automatic version history
- File > Version history > See version history

---

## Alternative: Using localStorage Only

If you prefer not to use Google Sheets:
1. Leave the webhook URL empty in Settings
2. The app will automatically use localStorage only
3. Use **Export All Data** button regularly to backup

---

## Need Help?

- Check browser console (F12) for detailed error logs
- Check Apps Script execution logs for backend errors
- Contact support at: **7218432344**

---

## Changelog

- **v2.1 (CORS Fix)**: 
  - ✅ Added `doGet()` to handle OPTIONS preflight requests
  - ✅ Added `handleCORS()` function with proper CORS headers
  - ✅ Added `addCORSHeaders()` helper to ensure all responses include CORS headers
  - ✅ Fixed "Access-Control-Allow-Origin" errors from dnyansindhu.in
  - ✅ Added comprehensive CORS troubleshooting section
  - ✅ Added redeployment instructions
- **v2.0**: Added Google Apps Script webhook approach
- **v1.0**: Initial setup with direct API (deprecated)
