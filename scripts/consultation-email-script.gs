/**
 * Bound Google Apps Script for consultation requests.
 *
 * Paste this into the spreadsheet: Extensions → Apps Script
 * Keep ADMIN_EMAIL + SCRIPT_SECRET as already set.
 * Deploy → Manage deployments → pencil → New version (do not create a new URL).
 */

const ADMIN_EMAIL = 'salonanchor53@gmail.com';
const SCRIPT_SECRET = 'hvAUfwgfoiuwvioJBWIVUGIWUVBVBFIFHBIUFBCBJFABFdfujsjv';
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
  ensureHeaders_(sheet);
}

function doGet() {
  try {
    const ss = getSpreadsheet_();
    const sheet = getSheet_();
    return json_({
      ok: true,
      service: 'consultation-notify',
      spreadsheet: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      tab: sheet.getName(),
      rows: sheet.getLastRow(),
    });
  } catch (err) {
    return json_({ ok: true, service: 'consultation-notify', error: String(err) });
  }
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
    if (String(data.type || '') === 'quiz-regimen') {
      return handleQuizRegimen_(data);
    }
    if (!ADMIN_EMAIL || ADMIN_EMAIL === 'your-email@example.com') {
      return json_({ ok: false, error: 'Set ADMIN_EMAIL in the Apps Script before deploying.' });
    }

    const booking = normalize_(data);
    if (!booking.name || !booking.email || !booking.phone || !booking.city || !booking.pincode) {
      return json_({ ok: false, error: 'Missing required fields' });
    }

    const ss = getSpreadsheet_();
    const sheet = getSheet_();
    ensureHeaders_(sheet);
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
        '',
        'Saved in sheet: ' + ss.getName() + ' / tab: ' + sheet.getName(),
      ]
        .filter(Boolean)
        .join('\n'),
    });

    sheet.getRange(row, HEADERS.length).setValue('Yes');
    return json_({
      ok: true,
      emailed: true,
      saved: true,
      to: ADMIN_EMAIL,
      spreadsheet: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      tab: sheet.getName(),
      row: row,
    });
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

function handleQuizRegimen_(data) {
  const email = String(data.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json_({ ok: false, error: 'Missing quiz email' });
  }
  const products = Array.isArray(data.products) ? data.products.slice(0, 20) : [];
  if (!products.length) {
    return json_({ ok: false, error: 'No products' });
  }

  const userName = String(data.name || '').trim();
  const headline = String(data.headline || 'your hair').trim();
  const quizId = String(data.quizId || '').trim();
  const lines = products.map(function (p, i) {
    const name = [p.brand, p.title].filter(Boolean).join(' ');
    const use = String(p.use || '').trim();
    const url = String(p.url || '').trim();
    return (
      i +
      1 +
      '. ' +
      name +
      (p.badge ? ' (' + p.badge + ')' : '') +
      (use ? '\n   Where to use: ' + use : '') +
      (url ? '\n   Buy: ' + url : '')
    );
  });

  const htmlItems = products
    .map(function (p) {
      const name = escapeHtml_([p.brand, p.title].filter(Boolean).join(' '));
      const use = escapeHtml_(String(p.use || '').trim());
      const url = String(p.url || '').trim();
      const badge = escapeHtml_(String(p.badge || '').trim());
      return (
        '<tr><td style="padding:16px 0;border-bottom:1px solid #e8e2d8;">' +
        '<p style="margin:0 0 4px;font-size:16px;color:#1c1917;"><strong>' +
        name +
        '</strong>' +
        (badge ? ' <span style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#775a19;">' + badge + '</span>' : '') +
        '</p>' +
        (use ? '<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#57534e;">' + use + '</p>' : '') +
        (url
          ? '<a href="' +
            escapeHtml_(url) +
            '" style="color:#775a19;font-size:13px;">Shop on Lookskart</a>'
          : '') +
        '</td></tr>'
      );
    })
    .join('');

  MailApp.sendEmail({
    to: email,
    name: 'Customised Haircare',
    subject: userName ? (userName + ', your haircare routine is ready') : 'Your haircare routine — products to use',
    body: [
      'Hi' + (userName ? ' ' + userName : '') + ',',
      '',
      'Here is your personalised routine for ' + headline + '.',
      '',
      lines.join('\n\n'),
      '',
      'Shop the full hair-care collection: https://lookskart.com/collections/hair-care-products',
      '',
      '— Customised Haircare / Lookskart',
    ].join('\n'),
    htmlBody:
      '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1c1917;">' +
      '<p style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#775a19;">Your haircare routine</p>' +
      (userName ? '<p style="font-size:18px;line-height:1.4;color:#1c1917;">Hi ' + escapeHtml_(userName) + ',</p>' : '') +
      '<h1 style="font-size:24px;font-weight:400;line-height:1.3;">Products picked for ' +
      (userName ? escapeHtml_(userName) + '\'s ' : '') +
      escapeHtml_(headline) +
      '</h1>' +
      '<p style="font-size:15px;line-height:1.6;color:#57534e;">Use this list as your regimen. Each product includes where it belongs in your routine and a link to buy.</p>' +
      '<table width="100%" cellpadding="0" cellspacing="0">' +
      htmlItems +
      '</table>' +
      '<p style="margin-top:28px;font-size:13px;color:#7f7667;">Customised Haircare / Lookskart</p>' +
      '</div>',
  });

  const sheet = getOrCreateSheet_('Quiz regimens', [
    'Timestamp',
    'Name',
    'Email',
    'Headline',
    'Quiz ID',
    'Product count',
    'Email Sent',
  ]);
  sheet.appendRow([
    new Date().toISOString(),
    userName,
    email,
    headline,
    quizId,
    products.length,
    'Yes',
  ]);

  return json_({ ok: true, emailed: true, to: email, count: products.length });
}

function getOrCreateSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSpreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      'This script is not bound to a spreadsheet. Open the Google Sheet → Extensions → Apps Script, paste the code there, then deploy a new version.'
    );
  }
  return ss;
}

function getSheet_() {
  const ss = getSpreadsheet_();
  const named = ss.getSheetByName(SHEET_NAME);
  if (named) return named;
  return ss.getSheets()[0];
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return;
  }
  const first = String(sheet.getRange(1, 1).getValue() || '');
  if (first !== 'Timestamp') {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
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
