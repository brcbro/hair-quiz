/**
 * POST consultation details to a Google Apps Script web app.
 * The script appends a Google Sheet row and emails ADMIN_EMAIL.
 */

export async function notifyGoogleAppsScript(envLike, booking) {
  const url = String(envLike.GOOGLE_APPS_SCRIPT_URL || '').trim();
  if (!url) {
    return { emailed: false, reason: 'Google Apps Script URL not configured' };
  }

  const payload = {
    secret: String(envLike.GOOGLE_APPS_SCRIPT_SECRET || ''),
    timestamp: booking.createdAt || new Date().toISOString(),
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    city: booking.city,
    pincode: booking.pincode,
    instagram: booking.instagram || '',
    notes: booking.notes || '',
    quizId: booking.quizId || (booking.quiz && booking.quiz._quizId) || '',
  };

  const response = await fetch(url, {
    method: 'POST',
    // text/plain avoids a CORS preflight and keeps the JSON body intact
    // through Google's Apps Script redirect.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }

  if (!response.ok || data.ok === false) {
    const reason = data.error || text.slice(0, 200) || `HTTP ${response.status}`;
    throw new Error(reason);
  }

  return { emailed: Boolean(data.emailed || data.ok) };
}
