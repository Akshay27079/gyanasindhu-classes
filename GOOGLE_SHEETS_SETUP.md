# Google Sheets Integration Setup Guide

This guide will help you configure Google Sheets as the backend database for the ज्ञानसिंधू क्लासेस Management System.

## Prerequisites
- A Google account
- The app.html file deployed on GitHub Pages

## Step 1: Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: **GyanSindhu Classes Database**
4. Create 5 sheets (tabs) with these exact names:
   - `Students`
   - `Teachers`
   - `Attendance`
   - `Marks`
   - `Activity`

## Step 2: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "GyanSindhu Classes")
3. Enable the **Google Sheets API**:
   - Go to **APIs & Services** > **Library**
   - Search for "Google Sheets API"
   - Click **Enable**

## Step 3: Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the API key
4. Click **Edit API Key** and:
   - Under **Application restrictions**, select **HTTP referrers (web sites)**
   - Add your GitHub Pages URL: `https://yourusername.github.io/Dnyansidhu/*`
   - Under **API restrictions**, select **Restrict key**
   - Choose **Google Sheets API**
5. Click **Save**

## Step 4: Make Spreadsheet Public (Read-Only)

1. Open your Google Spreadsheet
2. Click **Share** button (top-right)
3. Click **Change to anyone with the link**
4. Set permission to **Viewer**
5. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```

## Step 5: Configure app.html

1. Open `app.html` in a text editor
2. Find the `GOOGLE_SHEETS_CONFIG` section (around line 525)
3. Replace the empty values:

```javascript
const GOOGLE_SHEETS_CONFIG = {
    apiKey: 'YOUR_API_KEY_HERE', // Paste your API key
    spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE', // Paste your spreadsheet ID
    sheetsNames: {
        students: 'Students',
        teachers: 'Teachers',
        attendance: 'Attendance',
        marks: 'Marks',
        activity: 'Activity'
    }
};
```

4. Save the file and push to GitHub

## Step 6: Test the Integration

1. Open your app on GitHub Pages
2. Login as admin (username: `admin`, password: `Capital@123`)
3. Add a test student or teacher
4. Check your Google Spreadsheet - the data should appear!

## How It Works

- **Dual Storage**: Data is saved to both localStorage (instant) and Google Sheets (synced)
- **Offline-First**: The app works offline using localStorage
- **Auto-Sync**: When online, data automatically syncs to Google Sheets
- **Fallback**: If Google Sheets sync fails, data is still saved locally

## Security Notes

⚠️ **Important Security Considerations:**

1. **API Key Exposure**: The API key is visible in the client-side code. This is acceptable because:
   - The key is restricted to your domain only
   - The spreadsheet is set to read-only for public access
   - Write access requires the API key AND domain restriction match

2. **Data Privacy**: 
   - This setup is suitable for internal use only
   - For production use with sensitive data, consider using Google Apps Script as a backend proxy
   - Passwords are stored in plain text (suitable for internal use only)

3. **Rate Limits**:
   - Google Sheets API has usage quotas
   - For heavy usage, consider implementing batch updates

## Troubleshooting

### Data Not Syncing
- Check browser console for errors
- Verify API key is correct and not restricted
- Confirm spreadsheet ID is correct
- Ensure spreadsheet is shared properly

### CORS Errors
- Make sure HTTP referrer restriction matches your domain
- Try adding both `http://` and `https://` versions

### Quota Exceeded
- Google Sheets API has daily quotas
- Reduce sync frequency if hitting limits
- Consider batching updates

## Alternative: Using localStorage Only

If you prefer not to use Google Sheets:
1. Leave `apiKey` and `spreadsheetId` empty in the config
2. The app will automatically use localStorage only
3. Data will be stored in the browser locally
4. Use the "Export All Data" button in Settings to backup

## Backup and Recovery

1. **Export Data**: Admin > Settings > Export All Data (downloads JSON)
2. **Manual Backup**: Copy data from Google Sheets regularly
3. **Import**: Currently requires manual input (consider adding import feature)

---

**Need Help?** Contact support at 7218432344
