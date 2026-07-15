# Deploy Compliance Webhook - Quick Steps

## Current Status
- ✅ app.html already sends `noticeType: 'compliance'` correctly
- ✅ WhatsApp_Webhook_Updated.gs ready in repo
- ❌ Old webhook deployed (only handles absence)

## Deploy Steps (5 minutes)

### 1. Open Google Apps Script
Go to: https://script.google.com/

### 2. Find Your Webhook Project
Look for the project that has your current WhatsApp webhook

### 3. Replace Code
- Select all existing code (Ctrl+A)
- Delete it
- Open `WhatsApp_Webhook_Updated.gs` from your repo
- Copy and paste the entire content

### 4. Configure Script Properties
Go to: **Project Settings** (⚙️ icon on left) → **Script Properties** → **Add script properties**

Add these (if not already there):
- `WHATSAPP_PHONE_NUMBER_ID` = (from Meta Business)
- `WHATSAPP_ACCESS_TOKEN` = (from Meta Business)
- `WHATSAPP_TEMPLATE_NAME` = `absence_notification_marathi`
- `WHATSAPP_TEMPLATE_LANGUAGE` = `mr`
- `WHATSAPP_COMPLIANCE_TEMPLATE` = `compliance_notice_marathi`
- `WHATSAPP_COMPLIANCE_LANGUAGE` = `mr`
- `WHATSAPP_API_VERSION` = `v23.0`
- `LOG_SHEET_ID` = (optional - your Google Sheet ID for logs)
- `LOG_SHEET_NAME` = `WhatsApp Webhook Logs` (optional - the webhook creates this sheet automatically)

### 5. Deploy
- Click **Deploy** → **Manage deployments**
- Click **✏️ Edit** on the existing deployment (or create new)
- **New version** → **Deploy**
- Copy the **Web App URL**

### 6. Update app.html Settings
- Login as admin
- Go to **Settings** → **WhatsApp Configuration**
- Paste the new Web App URL in **Webhook URL**
- Click **Save Configuration**
- Click **Test Connection** (should succeed)

### 7. Test Compliance Notice
- Go to **अनुपालन सूचना** (Compliance Notices)
- Select a test student
- Choose reason: "Homework not completed"
- Add details (optional)
- Click **Send Notice**
- Check parent's WhatsApp for the message

## What Changed?

| Feature | Old Webhook | New Webhook |
|---------|-------------|-------------|
| Absence | ✅ Works | ✅ Works |
| Compliance | ❌ Sends absence msg | ✅ Sends compliance msg |
| Routes by `noticeType` | ❌ No | ✅ Yes |

## Troubleshooting

### Error: Template not found
- Check template name exactly matches in Meta Business
- Verify template is **APPROVED** (not pending)
- Check Script Properties have correct template names

### Error: Access token invalid
- Generate new permanent token in Meta Business
- Update `WHATSAPP_ACCESS_TOKEN` in Script Properties

### Still sends absence message
- Clear browser cache
- Check you deployed the **new version** not the old one
- Check webhook URL in app.html Settings matches new deployment

## Files
- `WhatsApp_Webhook_Updated.gs` - The webhook code to deploy
- `app.html` - Already correct, no changes needed
