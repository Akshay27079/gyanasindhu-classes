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
 *   LOG_SHEET_NAME                  (optional — default: WhatsApp Webhook Logs)
 */

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    PHONE_NUMBER_ID:        props.getProperty('WHATSAPP_PHONE_NUMBER_ID'),
    ACCESS_TOKEN:           props.getProperty('WHATSAPP_ACCESS_TOKEN'),
    API_VERSION:            props.getProperty('WHATSAPP_API_VERSION') || 'v23.0',
    LOG_SHEET_ID:           props.getProperty('LOG_SHEET_ID'),
    LOG_SHEET_NAME:         props.getProperty('LOG_SHEET_NAME') || 'WhatsApp Webhook Logs',
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

    // Handle route check from app.html (validates compliance routing works)
    if (data.routeCheck === true) {
      const noticeType = normalizeNoticeType(data.noticeType);
      return createResponse(true, 'Route check passed', {
        noticeType: noticeType,
        templateName: noticeType === 'compliance' 
          ? (config.TEMPLATES.compliance.name) 
          : (config.TEMPLATES.absence.name)
      });
    }

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

    // DEBUG: Log what we received
    Logger.log('DEBUG - Raw noticeType from frontend: ' + JSON.stringify(data.noticeType));
    
    const noticeType = normalizeNoticeType(data.noticeType);
    
    Logger.log('DEBUG - Normalized noticeType: ' + noticeType);
    Logger.log('DEBUG - Will route to: ' + (noticeType === 'compliance' ? 'COMPLIANCE' : 'ABSENCE'));
    
    const result = noticeType === 'compliance'
      ? sendComplianceNotification(data, config)
      : sendAbsenceNotification(data, config);

    logNotification(data, result, noticeType, config);

    // Add routing info to response
    const responseData = result.data || {};
    responseData.receivedNoticeType = data.noticeType;
    responseData.normalizedNoticeType = noticeType;
    responseData.routedTo = noticeType === 'compliance' ? 'compliance' : 'absence';

    return createResponse(result.success, result.message, responseData);

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
  const template = config.TEMPLATES && config.TEMPLATES.compliance 
    ? config.TEMPLATES.compliance 
    : { name: 'compliance_notice_marathi', language: 'mr' };
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
    metaResponseCode: responseCode,
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
    const resultData = result.data || {};
    const meta = resultData.meta || {};
    const metaMessages = meta.messages || [];
    const firstMessage = metaMessages[0] || {};
    const metaContacts = meta.contacts || [];
    const firstContact = metaContacts[0] || {};
    const metaError = meta.error || {};
    const logTime = new Date();

    Logger.log('Notification: ' + JSON.stringify({
      type: noticeType, student: data.studentName,
      phone: data.parentPhone, success: result.success,
      templateName: resultData.templateName,
      timestamp: logTime.toISOString()
    }));

    if (!config.LOG_SHEET_ID) {
      Logger.log('LOG_SHEET_ID not configured - skipping sheet logging');
      return;
    }
    
    Logger.log('Attempting to open spreadsheet: ' + config.LOG_SHEET_ID);
    const ss = SpreadsheetApp.openById(config.LOG_SHEET_ID);
    Logger.log('Spreadsheet opened successfully');
    
    const sheet = getOrCreateLogSheet(ss, config.LOG_SHEET_NAME);
    Logger.log('Sheet ready: ' + sheet.getName() + ' (last row: ' + sheet.getLastRow() + ')');
    sheet.appendRow([
      logTime,
      data.noticeType || '',
      noticeType,
      noticeType === 'compliance' ? 'compliance' : 'absence',
      resultData.templateName || '',
      resultData.templateLanguage || '',
      data.parentName || '',
      data.studentName || '',
      data.className || '',
      data.parentPhone || '',
      firstContact.wa_id || '',
      data.noticeDate || data.date || '',
      data.reason || '',
      data.details || '',
      result.success ? 'SUCCESS' : 'FAILED',
      result.message || '',
      resultData.metaResponseCode || '',
      firstMessage.id || '',
      firstMessage.message_status || '',
      metaError.code || '',
      metaError.message || '',
      JSON.stringify(data),
      JSON.stringify(meta)
    ]);
  } catch (err) {
    Logger.log('logNotification error: ' + err);
  }
}

function getOrCreateLogSheet(ss, sheetName) {
  const name = sheetName || 'WhatsApp Webhook Logs';
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  const headers = [
    'Time',
    'Received Notice Type',
    'Normalized Notice Type',
    'Routed To',
    'Template Name',
    'Template Language',
    'Parent Name',
    'Student Name',
    'Class',
    'Parent Phone',
    'WhatsApp ID',
    'Notice Date',
    'Reason',
    'Details',
    'Status',
    'Webhook Message',
    'Meta HTTP Code',
    'Meta Message ID',
    'Meta Message Status',
    'Meta Error Code',
    'Meta Error Message',
    'Request JSON',
    'Meta Response JSON'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  return sheet;
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
