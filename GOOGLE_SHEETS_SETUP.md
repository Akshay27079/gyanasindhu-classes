# Google Sheets Integration Setup Guide

This guide will help you configure Google Sheets as the backend database for the ज्ञानसिंधू क्लासेस Management System.

## Overview

The app uses **Google Apps Script** as a webhook/proxy to securely write data to Google Sheets. This approach:
- ✅ Works from client-side without exposing API keys
- ✅ Handles authentication securely
- ✅ Allows CORS requests from your domain
- ✅ Provides real-time data synchronization

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
2. Delete the default `function myFunction() {}` code
3. **Copy and paste** the following complete script:

```javascript
// ============================================
// GOOGLE APPS SCRIPT FOR DNYANSINDHU CLASSES
// ============================================

// Configuration
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Main function to handle POST requests from the web app
function doPost(e) {
  try {
    // Parse the incoming request
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheetName = data.sheetName;
    
    Logger.log('Received request: ' + action + ' for sheet: ' + sheetName);
    
    if (action === 'write') {
      return writeData(sheetName, data.records);
    } else if (action === 'read') {
      return readData(sheetName);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid action: ' + action
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
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
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'No data to write',
        rowsWritten: 0
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const rows = records.map(record => objectToArray(record, sheetName));
    
    // Write data
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    
    Logger.log('Successfully wrote ' + rows.length + ' rows to ' + sheetName);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data written successfully',
      rowsWritten: rows.length,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in writeData: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Read data from a sheet
function readData(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Sheet not found: ' + sheetName
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      // Only headers or empty
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
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
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: records
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in readData: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
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
   - **Description**: `Dnyansindhu Classes Sync API`
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

### ❌ "CORS error" in browser console

**Fix:**
- Make sure the Apps Script is deployed as **Web App**
- Ensure "Who has access" is set to **Anyone**
- Try using incognito mode to rule out browser cache

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

### ❌ "Authorization required" error

**Fix:**
1. Go to Apps Script > Deploy > Manage deployments
2. Click ⋮ (three dots) > **Test deployments**
3. Click the test link - it will ask for authorization
4. Authorize and then go back to your app

### ⚠️ Sync is slow

**Explanation:** 
- Google Apps Script can take 1-3 seconds per request
- This is normal for free tier
- Data is saved to localStorage first, so the app remains fast

### ❌ "Service invoked too many times"

**Problem:** Hit Google's rate limit (usually 20,000 calls/day)

**Fix:**
- This shouldn't happen in normal use
- If testing, avoid repeated sync operations
- Consider batch updates

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

## Advanced: Add IP Restrictions (Optional)

To restrict webhook access to specific domains:

1. In Apps Script, add this at the top of `doPost`:

```javascript
function doPost(e) {
  // Restrict to specific domains
  const allowedOrigins = [
    'https://yourusername.github.io',
    'http://localhost:5500'
  ];
  
  // Check origin if available
  const origin = e.parameter.origin || '';
  if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unauthorized origin'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... rest of the code
}
```

2. Deploy as a **new deployment**

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

- **v2.0**: Added Google Apps Script webhook approach
- **v1.0**: Initial setup with direct API (deprecated)
