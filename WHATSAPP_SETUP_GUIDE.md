# WhatsApp Absence Notification - Setup Guide
# ज्ञानसिंधू क्लासेस - WhatsApp सूचना सेटअप मार्गदर्शक

## संक्षेप / Overview

ही प्रणाली विद्यार्थी गैरहजर असताना त्यांच्या पालकांना WhatsApp वर स्वयंचलितपणे संदेश पाठवते.

This system automatically sends WhatsApp messages to parents when students are marked absent.

---

## Step 1: Meta Business Account तयार करा

### 1.1 Meta Business Account Setup

1. **वेबसाइट**: https://business.facebook.com/
2. **Create Account** क्लिक करा
3. तुमचे व्यवसायाचे नाव भरा: **ज्ञानसिंधू क्लासेस**
4. तुमचे नाव आणि व्यवसाय ईमेल भरा
5. व्यवसायाच्या तपशीलांची पुष्टी करा

### 1.2 WhatsApp Business API अनुरोध करा

1. Meta Business Account मध्ये लॉगिन करा
2. **WhatsApp Manager** वर जा
3. **Get Started** क्लिक करा
4. तुमचा WhatsApp Business फोन नंबर add करा:
   - **9175432344** किंवा **8408994618**
5. OTP द्वारे फोन नंबरची पुष्टी करा
6. Business Profile Setup करा

---

## Step 2: Message Template तयार करा

### 2.1 Template बनवा

1. WhatsApp Manager मध्ये **Message Templates** वर जा
2. **Create Template** क्लिक करा
3. खालील तपशील भरा:

**Template Name**: `absence_notification_marathi`

**Category**: `UTILITY`

**Language**: `Marathi (mr)`

**Template Content**:

```
नमस्कार {{1}},

आपला मुलगा/मुलगी {{2}} आज {{3}} रोजी वर्गात अनुपस्थित होता/होती.

कृपया लवकरात लवकर संपर्क साधा.

ज्ञानसिंधू क्लासेस, नेरळ
📞 9175432344 | 8408994618
```

**Variables**:
- `{{1}}` = Parent Name (पालकांचे नाव)
- `{{2}}` = Student Name (विद्यार्थ्याचे नाव)
- `{{3}}` = Date (तारीख)

4. **Submit** करा
5. Approval साठी **1-2 दिवस** वाट पहा

### 2.2 Template Status तपासा

- **PENDING**: Approval प्रतीक्षा
- **APPROVED**: वापरण्यासाठी तयार ✅
- **REJECTED**: पुन्हा submit करा

---

## Step 3: Google Apps Script Webhook तयार करा

### 3.1 Google Apps Script तयार करा

1. **वेबसाइट**: https://script.google.com/
2. **New Project** क्लिक करा
3. Project name दया: `Dnyansindhu WhatsApp Webhook`
4. Repository मधील `WhatsApp_Webhook_Updated.gs` file मधला पूर्ण code Apps Script editor मध्ये paste करा.

   Important: जुना absence-only webhook code वापरू नका. तो `noticeType: "compliance"` ignore करू शकतो आणि compliance request ला absence template पाठवू शकतो.

   Updated webhook supports both templates:
   - Absence: `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE`
   - Compliance: `WHATSAPP_COMPLIANCE_TEMPLATE`, `WHATSAPP_COMPLIANCE_LANGUAGE`
### 3.2 Configuration सेट करा

1. Code में ये values replace करें:

```javascript
PHONE_NUMBER_ID: "YOUR_PHONE_NUMBER_ID"
// WhatsApp Manager -> API Setup -> Phone Number ID

ACCESS_TOKEN: "YOUR_PERMANENT_ACCESS_TOKEN"
// WhatsApp Manager -> API Setup -> Permanent Token
```

### 3.3 Deploy करा

1. **Deploy** → **New Deployment** क्लिक करा
2. **Type**: Web app
3. **Execute as**: Me
4. **Who has access**: Anyone
5. **Deploy** क्लिक करा
6. **Web App URL** copy करा (यह webhook URL है)
   - Example: `https://script.google.com/macros/s/ABC123.../exec`

### 3.4 Test करा

1. Script editor में `testWebhook` function run करें
2. Authorization के लिए अनुमति दें
3. Execution log में result check करें
4. अपने test phone number पर message receive होगा

---

## Step 4: app.html में WhatsApp Configuration जोड़ें

### 4.1 Settings Page खोलें

1. app.html में admin के रूप में login करें
2. **Settings** page पर जाएं
3. **WhatsApp Configuration** section मिलेगा

### 4.2 Configuration भरें

1. **Webhook URL**: Google Apps Script का Web App URL paste करें
2. **WhatsApp Phone Number ID**: Meta Business से copy करें
3. **Access Token**: Meta Business का Permanent Token paste करें
4. **Enable Notifications**: Checkbox को check करें
5. **Save Configuration** क्लिक करें

### 4.3 Connection Test करें

1. **Test Connection** button क्लिक करें
2. Success message मिलना चाहिए
3. अगर error आए तो:
   - Webhook URL check करें
   - Access Token verify करें
   - Phone Number ID confirm करें

---

## Step 5: Parent Phone Numbers भरें

### 5.1 नए Students के लिए

1. **Students** → **Add Student** जाएं
2. सभी fields भरें
3. **पालकांचे नाव** field भरें
4. **पालकांचा WhatsApp नंबर** field भरें
   - Format: `919175432344` (91 + 10 digits)
5. अगर WhatsApp notifications नहीं चाहिए: **Opt-out** checkbox check करें
6. **Save** क्लिक करें

### 5.2 Existing Students के लिए

1. **Students** page पर जाएं
2. Student के सामने **Edit** (✏️) button click करें
3. **पालकांचे नाव** और **पालकांचा WhatsApp नंबर** fields भरें
4. **Update** क्लिक करें

---

## Step 6: Attendance Mark करें और Notifications Test करें

### 6.1 Attendance Mark करना

1. **Attendance** page पर जाएं
2. **Date** select करें
3. **Class** select करें
4. **Load Students** क्लिक करें
5. जिन students को absent mark करना है, उन्हें **Absent** radio button select करें
6. **Save Attendance** क्लिक करें

### 6.2 Notification Status Check करें

- ✅ Green checkmark: Successfully sent
- ❌ Red X: Failed (click to resend)
- ⏳ Pending: Sending in progress

### 6.3 Notification Log देखें

1. **Settings** → **WhatsApp Configuration** → **Notification Log** tab
2. सभी sent/failed notifications की list मिलेगी
3. Failed notifications को **Resend** button से फिर भेज सकते हैं

---

## Troubleshooting / समस्या निवारण

### Problem 1: Message नहीं भेज रहा

**Check करें**:
- ✅ Template approved है?
- ✅ Webhook URL सही है?
- ✅ Access Token valid है?
- ✅ Parent phone number सही format में है? (919175432344)
- ✅ WhatsApp notifications enabled हैं?

**Solution**:
1. Settings में Test Connection run करें
2. Google Apps Script के logs check करें
3. Meta Business के WhatsApp Manager में error logs देखें

### Problem 2: Template Rejected हो गया

**Reasons**:
- Marketing content है
- Policy violation है
- Variables गलत use हुए हैं

**Solution**:
1. Template को utility-based बनाएं (marketing नहीं)
2. Clear, concise message लिखें
3. Necessary information only include करें
4. फिर से submit करें

### Problem 3: API Error आ रहा है

**Common Errors**:

| Error Code | Problem | Solution |
|------------|---------|----------|
| 100 | Invalid parameter | Phone number format check करें |
| 131009 | Parameter missing | Template variables complete भरें |
| 133000 | Rate limit | 1-2 मिनट wait करें |
| 135000 | Generic error | Access token verify करें |

**Solution**:
1. Google Apps Script logs में detailed error देखें
2. Meta Business API documentation refer करें
3. WhatsApp Manager में error details check करें

### Problem 4: Notification Log नहीं दिख रहा

**Solution**:
1. Browser cache clear करें
2. Page refresh करें (Ctrl+F5)
3. localStorage check करें (F12 → Application → localStorage)

---

## Phone Number Format Guidelines

### सही Format ✅

```
919175432344  (Country Code + 10 digits, no spaces)
918408994618  (Correct)
917012345678  (Correct)
```

### गलत Format ❌

```
9175432344    (Missing country code)
+919175432344 (Plus sign not needed)
91 9175432344 (No spaces allowed)
09175432344   (Starting with 0)
```

---

## Cost & Limits

### Free Tier (Meta WhatsApp Cloud API)

- **1,000 free conversations per month**
- 1 conversation = 24-hour window
- Enough for ~30-40 students with 2-3 absences/day

### Conversation Examples

1. आज 10 AM को 5 students absent → 5 conversations
2. Same day 3 PM को फिर 2 students absent → 2 conversations  
3. **Total**: 7 conversations used

### Monthly Estimate

| Students | Avg Absences/Day | Monthly Conversations | Within Free Tier? |
|----------|------------------|----------------------|-------------------|
| 30 | 3 | ~90 | ✅ Yes |
| 50 | 5 | ~150 | ✅ Yes |
| 100 | 10 | ~300 | ✅ Yes |
| 200 | 20 | ~600 | ✅ Yes |

---

## Best Practices

### 1. Parent Consent लें

सभी parents से written consent लें कि आप उनका phone number WhatsApp notifications के लिए use कर सकते हैं.

**Sample Consent Form** (Marathi):

```
मी/आम्ही, _______________  (पालकाचे नाव),
माझ्या/आमच्या मुलाच्या/मुलीच्या (_____________, वर्ग: _____)
गैरहजेरीबद्दल WhatsApp द्वारे सूचना मिळवण्यास सहमत आहे/आहोत.

माझा/आमचा WhatsApp नंबर: _________________

स्वाक्षरी: _____________  तारीख: _______
```

### 2. Opt-out Option दया

जे parents notifications नहीं चाहते, उन्हें opt-out करने दें.

### 3. Privacy Maintain करें

- Parent phone numbers secure रखें
- Google Sheets में proper access controls लगाएं
- Access tokens को public न करें

### 4. Regular Monitoring

- हफ्ते में एक बार notification logs check करें
- Failed notifications को resend करें
- Monthly usage check करें (free tier limit के भीतर रहें)

### 5. Template Updates

अगर message content बदलना हो:
1. Meta Business में नया template बनाएं
2. Approval मिलने के बाद Google Apps Script में template name update करें

### ❌ Error: `(#132001) Template name does not exist in the translation`

इसका मतलब WhatsApp API चल रहा है, लेकिन Meta Business में इस **template name + language code** की approved translation नहीं मिली.

Fix:
1. Meta Business → WhatsApp Manager → Message templates खोलें.
2. Approved template का exact **Name** copy करें.
3. Approved template की exact **Language** देखें.
4. Apps Script में update करें:
   ```javascript
   TEMPLATE_NAME: "your_exact_template_name",
   TEMPLATE_LANGUAGE: "your_exact_language_code" // example: "mr" or "en_US"
   ```
5. Apps Script को **New version** के रूप में redeploy करें.

Example: अगर Meta में template `absence_notification` language `en_US` में approved है, तो:

```javascript
TEMPLATE_NAME: "absence_notification",
TEMPLATE_LANGUAGE: "en_US"
```

---

## Contact Information

### ज्ञानसिंधू क्लासेस

**Address**: नेरळ, महाराष्ट्र

**Phone**: 
- 9175432344
- 8408994618

**Email**: [Your Email]

**Website**: [Your Website]

---

## Support Resources

### Meta WhatsApp Business API
- Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
- Template Guidelines: https://developers.facebook.com/docs/whatsapp/message-templates/guidelines
- Support: https://business.facebook.com/help

### Google Apps Script
- Documentation: https://developers.google.com/apps-script
- Guides: https://developers.google.com/apps-script/guides

### Testing Tools
- WhatsApp Business API Tester: https://developers.facebook.com/tools/explorer
- JSON Formatter: https://jsonformatter.org/

---

## Changelog

**Version 1.0** (June 11, 2024)
- Initial setup guide created
- WhatsApp Cloud API integration documented
- Google Apps Script webhook code provided
- Marathi language support added

---

## Future Enhancements

### Planned Features

1. **Bulk Notifications**: Send notifications for multiple students at once
2. **Custom Templates**: Support for fee reminders, exam notifications
3. **Delivery Reports**: Real-time delivery and read receipts
4. **Parent Replies**: Handle parent responses automatically
5. **SMS Fallback**: Send SMS if WhatsApp fails
6. **Notification Schedule**: Schedule notifications for specific times

---

**Document Created By**: Kiro AI  
**Last Updated**: June 11, 2024  
**Version**: 1.0  

**Tags**: #WhatsApp #Automation #StudentManagement #Notifications #AbsenceAlert
