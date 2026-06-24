import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const app = fs.readFileSync(path.resolve(__dirname, '../app.html'), 'utf8');
const appsScript = fs.readFileSync(path.resolve(__dirname, '../Code.gs'), 'utf8');

describe('Google Sheets synchronization', () => {
  it('refreshes shared data before authenticating a login', () => {
    expect(app).toMatch(/loginForm\.addEventListener\('submit', async/);
    expect(app).toContain('await refreshAllDataFromGoogleSheets()');
  });

  it('allows login with local data when Google Sheets refresh fails', () => {
    expect(app).toContain('Google Sheets refresh failed. Logging in with local browser data.');
    expect(app).not.toContain("loginError.textContent = 'Could not load the latest Google Sheets data. Check your internet connection and try again.'");
  });

  it('uses a CORS-simple content type for Apps Script requests', () => {
    expect(app).toContain("'Content-Type': 'text/plain;charset=utf-8'");
  });

  it('uses record mutations and server locking', () => {
    expect(app).toContain("action: 'mutate'");
    expect(appsScript).toContain('LockService.getScriptLock()');
    expect(appsScript).toContain("request.action === 'mutate'");
  });

  it('requires the deployed v3 backend', () => {
    expect(app).toContain('result.apiVersion !== 3');
    expect(appsScript).toContain('const API_VERSION = 3');
  });

  it('syncs credentials required for cross-device login', () => {
    expect(appsScript).toContain("Admin: ['id', 'username', 'password']");
    expect(appsScript).toMatch(/Students:[\s\S]*'username', 'password'/);
    expect(appsScript).toMatch(/Teachers:[\s\S]*'username', 'password'/);
  });

  it('bootstraps the default admin only when the Admin sheet is empty', () => {
    expect(app).toContain("password: 'Capital@123'");
    expect(app).toContain('if (!data.admin?.[0]?.password)');
    expect(appsScript).toContain('function ensureDefaultAdmin()');
    expect(appsScript).toContain("writeSheet('Admin', [DEFAULT_ADMIN])");
  });

  it('does not use unsupported TextOutput headers', () => {
    expect(appsScript).not.toContain('.setHeader(');
  });

  it('refreshes after page visibility changes', () => {
    expect(app).toContain("document.addEventListener('visibilitychange'");
    expect(app).toContain('refreshAllDataFromGoogleSheets({ rerender: Boolean(currentSession) })');
  });

  it('does not request the manifest from a file URL', () => {
    expect(app).toContain("location.protocol === 'http:'");
    expect(app).not.toContain('<link rel="manifest" href="manifest.json">');
  });

  it('warns before webhook calls from file URLs', () => {
    expect(app).toContain('function hasWebOrigin()');
    expect(app).toContain("file:// pages cannot reliably call Apps Script webhooks");
    expect(app).toContain("file:// blocks Apps Script/WhatsApp webhook calls");
  });

  it('renders alerts above the loading overlay with warning support', () => {
    expect(app).toContain('z-index: 11000');
    expect(app).toContain('.toast.warning');
    expect(app).toContain("container.id = 'toastContainer'");
    expect(app).toContain("toast.setAttribute('role', toastType === 'error' ? 'alert' : 'status')");
  });

  it('sends absence WhatsApp messages through a CORS-safe awaited batch', () => {
    expect(app).toContain('function normalizeWhatsAppPhone(phone)');
    expect(app).toContain('async function sendAbsenceNotifications(students, records, date)');
    expect(app).toContain('notificationResult = await sendAbsenceNotifications(students, records, date)');
    expect(app).toContain('Invalid or missing parent phone');
    expect(app).toContain("'Content-Type': 'text/plain;charset=utf-8'");
    expect(app).not.toContain('absentRecords.forEach(async');
    expect(app).toContain('response.ok && result.success');
  });

  it('explains WhatsApp template translation errors', () => {
    expect(app).toContain('function formatWhatsAppWebhookError(errorMessage)');
    expect(app).toContain('#132001');
    expect(app).toContain('WhatsApp template not found for this language');
  });

  it('shows new student WhatsApp fields in tables and exports', () => {
    expect(app).toContain('<th>Parent</th>');
    expect(app).toContain('<th>Parent WhatsApp</th>');
    expect(app).toContain('<th>WA Status</th>');
    expect(app).toContain('function renderWhatsAppStatus(student)');
    expect(app).toContain("'Parent Name', 'Parent WhatsApp', 'WhatsApp Opt Out'");
  });

  it('adds compliance WhatsApp notices for parents', () => {
    expect(app).toContain("case 'compliance': renderAdminCompliance(); break;");
    expect(app).toContain('function renderAdminCompliance()');
    expect(app).toContain('async function sendParentComplianceNotice(student, notice)');
    expect(app).toContain("noticeType: 'compliance'");
    expect(app).toContain('Homework not completed and misbehavior');
    expect(app).toContain('function openComplianceNoticeWhatsApp()');
    expect(app).toContain('https://wa.me/${parentPhone}?text=${encodeURIComponent(message)}');
  });
});
