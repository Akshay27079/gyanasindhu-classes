# WhatsApp Absence Notification - Feasibility Study

## Executive Summary

**Goal:** Automatically send WhatsApp messages to parents when their child is marked absent in the ज्ञानसिंधू क्लासेस management system.

**Constraint:** The solution must be **completely free** (no monthly costs, no per-message fees).

**Conclusion:** ✅ **FEASIBLE** with limitations. Free automated WhatsApp messaging is possible using the **WhatsApp Business API (Cloud API)** with a free tier that includes 1,000 free conversations per month.

---

## Solution Architecture

### Option 1: WhatsApp Business Cloud API (RECOMMENDED - FREE TIER)

**Provider:** Meta (Facebook)  
**Cost:** FREE for up to 1,000 conversations/month  
**Technical Complexity:** Medium  
**Reliability:** High (Official API)

#### How It Works

1. **Teacher marks student absent** in the app (app.html)
2. **App sends HTTP request** to a webhook/serverless function
3. **Serverless function** (Google Apps Script, Cloudflare Workers, or Vercel) calls WhatsApp Business API
4. **WhatsApp delivers message** to parent's phone number

#### Free Tier Limits

- **1,000 free service conversations per month** (enough for ~33 absences/day if you have 30 students)
- No time limit on free tier (permanent)
- Official, reliable delivery
- Supports template messages (pre-approved by Meta)

#### Setup Requirements

1. **WhatsApp Business Account** (free)
2. **Meta Business Account** (free)
3. **Phone number** for WhatsApp Business (can use existing institute number)
4. **Message templates** must be pre-approved by Meta (takes 1-2 days)
5. **Webhook server** (use free tier: Google Apps Script, Cloudflare Workers, or Vercel)

#### Implementation Steps

**Step 1:** Register for WhatsApp Business API
- Go to: https://business.facebook.com/
- Create Meta Business Account
- Apply for WhatsApp Business API access
- Verify phone number (9175432344 or 8408994618)

**Step 2:** Create Message Template (Example)
```
नमस्कार {{1}},

आपला मुलगा/मुलगी {{2}} आज {{3}} रोजी वर्गात अनुपस्थित होता/होती.

कृपया संपर्क साधा: 9175432344

ज्ञानसिंधू क्लासेस, नेरळ
```

Template variables:
- {{1}} = Parent name
- {{2}} = Student name  
- {{3}} = Date

**Step 3:** Create Webhook (Google Apps Script - FREE)

```javascript
// Google Apps Script webhook
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  const parentPhone = data.parentPhone; // Format: 919175432344
  const parentName = data.parentName;
  const studentName = data.studentName;
  const date = data.date;
  
  // WhatsApp API credentials from Meta Business
  const WHATSAPP_TOKEN = "YOUR_ACCESS_TOKEN";
  const PHONE_NUMBER_ID = "YOUR_PHONE_NUMBER_ID";
  
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
  
  const payload = {
    messaging_product: "whatsapp",
    to: parentPhone,
    type: "template",
    template: {
      name: "absence_notification_marathi", // Your approved template name
      language: { code: "mr" }, // Marathi
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: parentName },
            { type: "text", text: studentName },
            { type: "text", text: date }
          ]
        }
      ]
    }
  };
  
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      response: response.getContentText()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

**Step 4:** Modify app.html to call webhook

```javascript
// In your markAbsent() function in app.html
async function sendAbsenceNotification(student, date) {
    const WEBHOOK_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL";
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                parentPhone: student.parentPhone, // Must be in format: 919175432344
                parentName: student.parentName || 'पालक',
                studentName: student.name,
                date: new Date(date).toLocaleDateString('mr-IN')
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('WhatsApp notification sent successfully');
        } else {
            console.error('Failed to send notification:', result.error);
        }
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
    }
}
```

---

### Option 2: CallMeBot API (FREE - No Registration)

**Cost:** Completely FREE  
**Technical Complexity:** Very Low  
**Reliability:** Medium (community service, may have downtime)  
**Limitation:** Parents must opt-in by sending a specific message first

#### How It Works

1. **Parent sends opt-in message** to a WhatsApp number (one-time setup)
2. **CallMeBot generates API key** for that phone number
3. **Your app sends HTTP GET request** with message text
4. **CallMeBot forwards message** via WhatsApp

#### Pros
- ✅ Completely free (no limits)
- ✅ No business verification needed
- ✅ Very simple implementation
- ✅ Works immediately

#### Cons
- ❌ Parents must manually opt-in first (send "I allow callmebot to send me messages" to +34 644 51 93 89)
- ❌ Not official WhatsApp API (may be less reliable)
- ❌ No delivery guarantees
- ❌ Community-maintained service

#### Implementation

```javascript
// In app.html - markAbsent function
async function sendAbsenceNotificationCallMeBot(student, date) {
    const apiKey = student.callMeBotApiKey; // Store this when parent opts in
    const phone = student.parentPhone; // Format: 919175432344
    
    const message = `नमस्कार,\n\nआपला मुलगा/मुलगी ${student.name} आज ${new Date(date).toLocaleDateString('mr-IN')} रोजी वर्गात अनुपस्थित होता/होती.\n\nकृपया संपर्क साधा: 9175432344\n\nज्ञानसिंधू क्लासेस, नेरळ`;
    
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    
    try {
        await fetch(url);
        console.log('Notification sent via CallMeBot');
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}
```

**Parent Opt-in Instructions:**
1. Save this number: +34 644 51 93 89
2. Send message: "I allow callmebot to send me messages"
3. Wait for API key response
4. Share API key with institute

---

### Option 3: Twilio WhatsApp Sandbox (FREE TRIAL ONLY)

**Cost:** FREE trial ($15 credit), then paid  
**Not Recommended:** Trial credits expire, not sustainable for long-term free use

---

## Recommended Solution: WhatsApp Business Cloud API

### Why This Is The Best Free Option

1. ✅ **Official WhatsApp API** (reliable, professional)
2. ✅ **1,000 free conversations/month** (enough for most coaching institutes)
3. ✅ **No expiration** (permanent free tier)
4. ✅ **No opt-in required** from parents (you can message them directly)
5. ✅ **Professional appearance** (verified business account)
6. ✅ **Delivery receipts** (know if message was delivered/read)

### Cost Breakdown for Your Institute

**Assumptions:**
- 50 students enrolled
- Average 2-3 absences per day
- ~60-90 messages per month

**Result:** Well within the 1,000 free conversations/month limit ✅

### Conversation vs Message

- 1 "conversation" = 24-hour window where you can send multiple messages
- If you send absence notification at 10 AM and another message at 2 PM same day = 1 conversation
- If parent replies = still 1 conversation (within 24 hours)

---

## Implementation Timeline

### Week 1: Setup
- Day 1-2: Register Meta Business Account
- Day 3-4: Apply for WhatsApp Business API access
- Day 5: Create and submit message templates for approval
- Day 6-7: Wait for template approval

### Week 2: Development
- Day 1-2: Create Google Apps Script webhook
- Day 3-4: Modify app.html to integrate webhook
- Day 5: Test with 2-3 parent phone numbers
- Day 6-7: Train teachers on new feature

### Week 3: Launch
- Day 1: Announce feature to all parents
- Day 2-7: Monitor and fix any issues

---

## Data Requirements

To enable this feature, you need to store parent phone numbers in your student records:

```javascript
// Update student data structure in app.html
const student = {
    id: '001',
    name: 'राज कुमार',
    class: '10th',
    parentName: 'श्री रमेश कुमार', // Add this
    parentPhone: '919175432344',   // Add this (with country code)
    // ... other fields
};
```

---

## Privacy & Compliance

### GDPR/Data Protection Considerations

1. **Consent:** Inform parents that their phone number will be used for absence notifications
2. **Opt-out:** Provide option for parents to opt-out of notifications
3. **Data Storage:** Phone numbers stored securely in Google Sheets with encryption
4. **Purpose Limitation:** Use phone numbers only for absence notifications

### Sample Parent Consent Text (Marathi)

```
प्रिय पालक,

आम्ही विद्यार्थ्यांच्या उपस्थितीबद्दल आपल्याला WhatsApp वर स्वयंचलित संदेश पाठवू इच्छितो.

आपला फोन नंबर: _______________

सहमती: मी या सेवेसाठी माझा WhatsApp नंबर वापरण्यास सहमत आहे.

स्वाक्षरी: ___________  तारीख: _______
```

---

## Alternatives If Free Options Don't Work

If you exceed 1,000 conversations/month or need more features:

1. **WhatsApp Business API Paid Tier**
   - ₹0.50-2.00 per conversation (depends on country)
   - For 500 messages/month: ~₹250-1,000/month

2. **Bulk SMS Services** (Cheaper alternative)
   - SMS at ₹0.20-0.50 per message
   - For 500 SMS/month: ₹100-250/month
   - Services: TextLocal, MSG91, Twilio

3. **Telegram Bot** (Completely Free, Unlimited)
   - Parents install Telegram app
   - Your bot sends notifications
   - FREE forever, no limits
   - Downside: Not as popular as WhatsApp in India

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API downtime | Low | Medium | Fallback to manual WhatsApp |
| Message delivery failure | Low | High | Implement retry logic + delivery receipts |
| Free tier limit exceeded | Low | Medium | Monitor usage, upgrade if needed |
| Template rejection by Meta | Medium | High | Follow template guidelines strictly |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Teachers forget to mark attendance | Medium | High | Daily reminder + attendance report |
| Incorrect phone numbers | High | Medium | Validate phone numbers at registration |
| Parents complain about spam | Low | Medium | Allow opt-out option |

---

## Conclusion & Recommendation

**RECOMMENDATION:** Implement **WhatsApp Business Cloud API** with Google Apps Script webhook.

**Rationale:**
1. ✅ Completely free for your use case (well within 1,000 conversations/month)
2. ✅ Official, reliable service
3. ✅ Professional appearance
4. ✅ No parent opt-in required
5. ✅ Easy to implement with existing app.html

**Next Steps:**
1. Get approval from institute management
2. Collect parent phone numbers (if not already stored)
3. Register for WhatsApp Business API (1 week)
4. Implement webhook and integrate with app.html (3-5 days)
5. Test with 5-10 parents (2-3 days)
6. Launch to all students

**Total Setup Time:** 2-3 weeks  
**Total Cost:** ₹0 (FREE)

---

## Additional Resources

- WhatsApp Business API Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
- Google Apps Script Guide: https://developers.google.com/apps-script
- Message Template Guidelines: https://developers.facebook.com/docs/whatsapp/message-templates/guidelines
- CallMeBot Alternative: https://www.callmebot.com/blog/free-api-whatsapp-messages/

---

## Questions for Management

Before proceeding, please answer:

1. How many absences do you typically record per day?
2. Do you already have parent phone numbers in your student database?
3. Are you willing to wait 1-2 weeks for WhatsApp Business API approval?
4. Would you prefer the simpler CallMeBot option (requires parent opt-in)?
5. If WhatsApp doesn't work, would SMS be acceptable?

---

**Document Created:** June 11, 2026  
**Author:** Kiro AI  
**Version:** 1.0  
**Status:** Ready for Review
