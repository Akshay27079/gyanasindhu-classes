// Google Apps Script backend for Dnyansindhu Classes.
// Bind this script to the target spreadsheet and deploy it as a Web App.

const SHEET_SCHEMAS = {
  Admin: ['id', 'username', 'password'],
  Students: [
    'id', 'username', 'password', 'name', 'fatherName', 'phone', 'whatsapp',
    'parentName', 'parentPhone', 'whatsappOptOut', 'class', 'stream', 'address',
    'admDate', 'feeAmount', 'feePaid', 'feeStatus', 'createdAt'
  ],
  Teachers: [
    'id', 'username', 'password', 'name', 'phone', 'subject', 'qualification',
    'assignedClasses', 'joinDate', 'salary', 'address', 'createdAt'
  ],
  Attendance: ['id', 'date', 'class', 'lectureHours', 'records', 'savedBy', 'savedAt'],
  Marks: ['id', 'test', 'subject', 'class', 'total', 'date', 'records', 'savedBy'],
  Activity: ['action', 'time']
};

const JSON_FIELDS = {
  Teachers: ['assignedClasses'],
  Attendance: ['records'],
  Marks: ['records']
};

const NUMBER_FIELDS = {
  Students: ['feeAmount', 'feePaid'],
  Teachers: ['salary'],
  Attendance: ['lectureHours'],
  Marks: ['total']
};

const BOOLEAN_FIELDS = {
  Students: ['whatsappOptOut']
};

const API_VERSION = 3;
const DEFAULT_ADMIN = {
  id: 'admin',
  username: 'admin',
  password: 'Capital@123'
};

function doGet() {
  return jsonResponse({
    success: true,
    apiVersion: API_VERSION,
    message: 'Dnyansindhu Google Sheets API is running',
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    const request = JSON.parse((e.postData && e.postData.contents) || '{}');
    validateAction(request);

    if (request.action === 'read') {
      return jsonResponse({
        success: true,
        apiVersion: API_VERSION,
        data: readSheet(request.sheetName),
        timestamp: new Date().toISOString()
      });
    }

    if (request.action === 'readAll') {
      return jsonResponse({
        success: true,
        apiVersion: API_VERSION,
        data: readAllSheets(),
        timestamp: new Date().toISOString()
      });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      if (request.action === 'replace') {
        writeSheet(request.sheetName, request.records || []);
      } else if (request.action === 'mutate') {
        mutateSheet(
          request.sheetName,
          request.records || [],
          request.deletedIds || []
        );
      }

      return jsonResponse({
        success: true,
        apiVersion: API_VERSION,
        data: readSheet(request.sheetName),
        timestamp: new Date().toISOString()
      });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return jsonResponse({
      success: false,
      apiVersion: API_VERSION,
      error: error.message || String(error),
      timestamp: new Date().toISOString()
    });
  }
}

function validateAction(request) {
  const actions = ['read', 'readAll', 'replace', 'mutate'];
  if (actions.indexOf(request.action) === -1) {
    throw new Error('Invalid action');
  }

  if (request.action !== 'readAll' && !SHEET_SCHEMAS[request.sheetName]) {
    throw new Error('Invalid sheet name: ' + request.sheetName);
  }
}

function readAllSheets() {
  ensureDefaultAdmin();
  return {
    admin: readSheet('Admin'),
    students: readSheet('Students'),
    teachers: readSheet('Teachers'),
    attendance: readSheet('Attendance'),
    marks: readSheet('Marks'),
    activity: readSheet('Activity')
  };
}

function ensureDefaultAdmin() {
  const admins = readSheet('Admin');
  if (!admins.length || !admins[0].password) {
    writeSheet('Admin', [DEFAULT_ADMIN]);
  }
}

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(sheetName) {
  const spreadsheet = getSpreadsheet();
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function readSheet(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  return values.slice(1)
    .filter(function(row) {
      return row.some(function(value) { return value !== ''; });
    })
    .map(function(row) {
      const record = {};
      headers.forEach(function(header, index) {
        if (header) record[header] = deserializeValue(sheetName, header, row[index]);
      });
      return record;
    });
}

function writeSheet(sheetName, records) {
  const sheet = getOrCreateSheet(sheetName);
  const headers = SHEET_SCHEMAS[sheetName];
  const rows = records.map(function(record) {
    return headers.map(function(header) {
      return serializeValue(sheetName, header, record[header]);
    });
  });

  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sheet.setFrozenRows(1);
}

function mutateSheet(sheetName, changedRecords, deletedIds) {
  const existing = readSheet(sheetName);
  const byId = {};
  const order = [];

  existing.forEach(function(record) {
    const key = recordKey(record);
    byId[key] = record;
    order.push(key);
  });

  const deleted = {};
  deletedIds.map(String).forEach(function(id) {
    deleted[id] = true;
    delete byId[id];
  });

  changedRecords.forEach(function(record) {
    const key = recordKey(record);
    if (!Object.prototype.hasOwnProperty.call(byId, key) && !deleted[key]) {
      order.push(key);
    }
    byId[key] = record;
  });

  const merged = order
    .filter(function(key) {
      return !deleted[key] && Object.prototype.hasOwnProperty.call(byId, key);
    })
    .map(function(key) { return byId[key]; });

  writeSheet(sheetName, merged);
}

function recordKey(record) {
  return String(
    record.id ||
    record.username ||
    ((record.action || '') + '|' + (record.time || ''))
  );
}

function serializeValue(sheetName, field, value) {
  if (value === undefined || value === null) return '';
  if ((JSON_FIELDS[sheetName] || []).indexOf(field) !== -1) {
    return JSON.stringify(value);
  }
  return value;
}

function deserializeValue(sheetName, field, value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  if ((JSON_FIELDS[sheetName] || []).indexOf(field) !== -1) {
    if (value === '') return [];
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      return [];
    }
  }

  if ((NUMBER_FIELDS[sheetName] || []).indexOf(field) !== -1) {
    return value === '' ? 0 : Number(value);
  }

  if ((BOOLEAN_FIELDS[sheetName] || []).indexOf(field) !== -1) {
    return value === true || String(value).toLowerCase() === 'true';
  }

  return value === null || value === undefined ? '' : String(value);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
