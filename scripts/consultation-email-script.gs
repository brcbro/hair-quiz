/**
 * Bound Google Apps Script for consultation requests.
 *
 * Paste this into the spreadsheet: Extensions → Apps Script
 * Then: set ADMIN_EMAIL + SCRIPT_SECRET, run setupSheet(), Deploy → Web app.
 * Full steps: scripts/GOOGLE_APPS_SCRIPT_SETUP.md
 */

const ADMIN_EMAIL = 'your-email@example.com';
const SCRIPT_SECRET = 'change-me';
const SHEET_NAME = 'Consultations';

const HEADERS = [
  'Timestamp',
  'Name',
  'Email',
  'Phone',
  'City',
  'Pincode',
  'Instagram',
  'Notes',
  'Quiz ID',
  'Email Sent',
];

function setupSheet() {
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function doGet() {
  return json_({ ok: true, service: 'consultation-notify' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json_({ ok: false, error: 'Empty body' });
    }

    const data = JSON.parse(e.postData.contents);
    if (!SCRIPT_SECRET || SCRIPT_SECRET === 'change-me') {
      return json_({ ok: false, error: 'Set SCRIPT_SECRET in the Apps Script before deploying.' });
    }
    if (String(data.secret || '') !== SCRIPT_SECRET) {
      return json_({ ok: false, error: 'Unauthorized' });
    }
    if (!ADMIN_EMAIL || ADMIN_EMAIL === 'your-email@example.com') {
      return json_({ ok: false, error: 'Set ADMIN_EMAIL in the Apps Script before deploying.' });
    }

    const booking = normalize_(data);
    if (!booking.name || !booking.email || !booking.phone || !booking.city || !booking.pincode) {
      return json_({ ok: false, error: 'Missing required fields' });
    }

    setupSheet();
    const sheet = getSheet_();
    sheet.appendRow([
      booking.timestamp,
      booking.name,
      booking.email,
      booking.phone,
      booking.city,
      booking.pincode,
      booking.instagram,
      booking.notes,
      booking.quizId,
      '',
    ]);
    const row = sheet.getLastRow();

    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      replyTo: booking.email,
      name: 'Hair Quiz Consultations',
      subject: 'New consultation request — ' + booking.name,
      body: [
        'New consultation request',
        '',
        'Name: ' + booking.name,
        'Email: ' + booking.email,
        'Phone: ' + booking.phone,
        'City: ' + booking.city,
        'Pincode: ' + booking.pincode,
        booking.instagram ? 'Instagram: ' + booking.instagram : null,
        booking.notes ? 'Notes: ' + booking.notes : null,
        booking.quizId ? 'Quiz ID: ' + booking.quizId : null,
        '',
        'Submitted at: ' + booking.timestamp,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    sheet.getRange(row, HEADERS.length).setValue('Yes');
    return json_({ ok: true, emailed: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function sendTestEmail() {
  const result = doPost({
    postData: {
      contents: JSON.stringify({
        secret: SCRIPT_SECRET,
        name: 'Test User',
        email: ADMIN_EMAIL,
        phone: '9999999999',
        city: 'Delhi',
        pincode: '110001',
        instagram: '@testuser',
        notes: 'Test consultation from Apps Script',
      }),
    },
  });
  Logger.log(result.getContent());
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function normalize_(data) {
  return {
    timestamp: String(data.timestamp || new Date().toISOString()),
    name: String(data.name || '').trim(),
    email: String(data.email || '').trim(),
    phone: String(data.phone || '').trim(),
    city: String(data.city || '').trim(),
    pincode: String(data.pincode || '').trim(),
    instagram: String(data.instagram || '').trim(),
    notes: String(data.notes || '').trim(),
    quizId: String(data.quizId || (data.quiz && data.quiz._quizId) || '').trim(),
  };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
