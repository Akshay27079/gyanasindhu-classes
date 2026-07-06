/**
 * WhatsApp Notification Webhook — Absence + Compliance
 * ज्ञानसिंधू क्लासेस
 *
 * Store secrets in Script Properties (not hardcoded):
 *   WHATSAPP_PHONE_NUMBER_ID
 *   WHATSAPP_ACCESS_TOKEN
 *   WHATSAPP_TEMPLATE_NAME          (absence template, default: absence_notification_marathi)
 *   WHATSAPP_TEMPLATE_LANGUAGE      (default: mr)
 *   WHATSAPP_COMPLIANCE_TEMPLATE    (compliance template, default: compliance_notice_marathi)
 *   WHATSAPP_COMPLIANCE_LANGUAGE    (default: mr)
 *   WHATSAPP_API_VERSION            (default: v23.0)
 *   LOG_SHEET_ID                    (optional — Google Sheet ID for logging)
 */

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    PHONE_NUMBER_ID:        props.getProperty('WHATSAPP_PHONE_NUMBER_ID'),
    ACCESS_TOKEN:           props.getProperty('WHATSAPP_ACCESS_TOKEN'),
    API_VERSION:            props.getProperty('WHATSAPP_API_VERSION') || 'v23.0',
    LOG_SHEET_ID:           props.getProperty('LOG_SHEET_ID'),
    TEMPLATES: {
      absence: {
        name:     props.getProperty('WHATSAPP_TEMPLATE_NAME')       || 'absence_notification_marathi',
        language: props.getProperty('WHATSAPP_TEMPLATE_LANGUAGE')   || 'mr'
      },
      compliance: {
        name:     props.getProperty('WHATSAPP_COMPLIANCE_TEMPLATE') || 'compliance_notice_marathi',
        language: props.getProperty('WHATSAPP_COMPLIANCE_LANGUAGE') || 'mr'
      }
    }
  };
}

// ── Webhook verification (Meta requires this) ──────────────────────────────
function doGet(e) {
  const VERIFY_TOKEN = 'dnyansindhu2026';
  if (e && e.parameter && e.parameter['hub.mode'] === 'subscribe') {
    if (e.parameter['hub.verify_token'] === VERIFY_TOKEN) {
      return ContentService
        .createTextOutput(e.parameter['hub.challenge'])
        .setMimeType(ContentService.MimeType.TEXT);
    }
    return ContentService.createTextOutput('Invalid verify token');
  }
  return ContentService.createTextOutput('WhatsApp Webhook Running');
}

// ── Main POST handler ──────────────────────────────────────────────────────
function doPost(e) {
  try {
    const config = getConfig();
    const body = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const data = JSON.parse(body);

    if (!config.PHONE_NUMBER_ID || !config.ACCESS_TOKEN) {
      return createResponse(false, 'Missing WhatsApp configuration in Script Properties');
    }

    if (!data.parentPhone || !data.studentName) {
      return createResponse(false, 'Missing required fields: parentPhone, studentName');
    }

    data.parentPhone = normalizePhone(data.parentPhone);
    if (!data.parentPhone) {
      return createResponse(false, 'Invalid parent phone number');
    }

    const noticeType = normalizeNoticeType(data.noticeType);
    const result = noticeType === 'compliance'
      ? sendComplianceNotification(data, config)
      : sendAbsenceNotification(data, config);

    logNotification(data, result, noticeType, config);

    return createResponse(result.success, result.message, result.data);

  } catch (err) {
    Logger.log('doPost error: ' + err);
    return createResponse(false, err.toString());
  }
}

// ── Absence notification ───────────────────────────────────────────────────
function sendAbsenceNotification(data, config) {
  const template = config.TEMPLATES.absence;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: data.parentPhone,
    type: 'template',
    template: {
      name: template.name,
      language: { code: template.language },
      components: [
        {
          type: 'header',
          parameters: [{ type: 'text', parameter_name: 'parent_name', text: data.parentName || 'पालक' }]
        },
        {
          type: 'body',
          parameters: [
            { type: 'text', parameter_name: 'student_name', text: data.studentName },
            { type: 'text', parameter_name: 'date',         text: data.date || '' }
          ]
        }
      ]
    }
  };
  return sendToWhatsAppAPI(payload, config);
}

// ── Compliance notification ────────────────────────────────────────────────
function sendComplianceNotification(data, config) {
  const template = config.TEMPLATES.compliance;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: data.parentPhone,
    type: 'template',
    template: {
      name: template.name,
      language: { code: template.language },
      components: [
        {
          type: 'header',
          parameters: [{ type: 'text', parameter_name: 'parent_name', text: data.parentName || 'Parent' }]
        },
        {
          type: 'body',
          parameters: [
            { type: 'text', parameter_name: 'student_name', text: data.studentName },
            { type: 'text', parameter_name: 'class',        text: data.className || '' },
            { type: 'text', parameter_name: 'reason',       text: data.reason || 'Compliance issue' },
            { type: 'text', parameter_name: 'date',         text: data.noticeDate || data.date || '' },
            { type: 'text', parameter_name: 'details',      text: data.details || '-' }
          ]
        }
      ]
    }
  };
  return sendToWhatsAppAPI(payload, config, 'compliance');
}

// ── WhatsApp API call ──────────────────────────────────────────────────────
function sendToWhatsAppAPI(payload, config, noticeType) {
  const url = 'https://graph.facebook.com/' + config.API_VERSION + '/' + config.PHONE_NUMBER_ID + '/messages';

  Logger.log('WhatsApp payload: ' + JSON.stringify(payload));

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + config.ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  let responseBody = {};
  try { responseBody = JSON.parse(responseText || '{}'); } catch (e) { responseBody = { raw: responseText }; }

  Logger.log('Meta response ' + responseCode + ': ' + responseText);

  const resultData = {
    noticeType: noticeType || 'absence',
    templateName: payload.template && payload.template.name,
    templateLanguage: payload.template && payload.template.language && payload.template.language.code,
    meta: responseBody
  };

  if (responseCode >= 200 && responseCode < 300 && responseBody.messages) {
    return { success: true, message: 'WhatsApp message sent successfully', data: resultData };
  }
  return { success: false, message: formatMetaError(responseBody), data: resultData };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function normalizeNoticeType(noticeType) {
  const value = String(noticeType || 'absence').trim().toLowerCase();
  if (value === 'compliance' || value === 'compliance_notice') return 'compliance';
  return 'absence';
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (/^[6-9]\d{9}$/.test(digits))    return '91' + digits;
  if (/^91[6-9]\d{9}$/.test(digits))  return digits;
  return '';
}

function formatMetaError(responseBody) {
  const error = responseBody && responseBody.error;
  if (!error) return 'Failed to send WhatsApp message';
  if (String(error.message || '').indexOf('#132001') !== -1 || error.code === 132001) {
    return 'Template/language mismatch. Check approved template name and language in Meta Business.';
  }
  if (error.code === 190) {
    return 'Access token invalid. Generate a valid permanent token in Script Properties.';
  }
  return error.message || JSON.stringify(error);
}

function logNotification(data, result, noticeType, config) {
  try {
    Logger.log('Notification: ' + JSON.stringify({
      type: noticeType, student: data.studentName,
      phone: data.parentPhone, success: result.success,
      timestamp: new Date().toISOString()
    }));

    if (!config.LOG_SHEET_ID) return;
    const ss = SpreadsheetApp.openById(config.LOG_SHEET_ID);
    const sheet = ss.getSheetByName('Notifications') || ss.insertSheet('Notifications');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Time', 'Type', 'Parent Name', 'Student Name', 'Parent Phone', 'Date', 'Reason', 'Status', 'Message']);
    }
    sheet.appendRow([
      new Date(), noticeType,
      data.parentName, data.studentName, data.parentPhone,
      data.noticeDate || data.date, data.reason || '-',
      result.success ? 'SUCCESS' : 'FAILED', result.message
    ]);
  } catch (err) {
    Logger.log('logNotification error: ' + err);
  }
}

function createResponse(success, message, data) {
  const response = { success, message, timestamp: new Date().toISOString() };
  if (data !== undefined) response.data = data;
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Test functions ─────────────────────────────────────────────────────────
function testAbsenceNotification() {
  const config = getConfig();
  const result = sendAbsenceNotification({
    parentPhone: '917722055914',
    parentName:  'राम पाटील',
    studentName: 'राज पाटील',
    date:        '17 जून 2026'
  }, config);
  Logger.log(JSON.stringify(result, null, 2));
}

function testComplianceNotification() {
  const config = getConfig();
  const result = sendComplianceNotification({
    parentPhone: '917722055914',
    parentName:  'राम पाटील',
    studentName: 'राज पाटील',
    className:   '10',
    reason:      'Homework not completed',
    noticeDate:  '17 जून 2026',
    details:     'गणिताचे गृहपाठ पूर्ण झाले नाही'
  }, config);
  Logger.log(JSON.stringify(result, null, 2));
}
