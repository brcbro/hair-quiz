import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const DATA_DIR = path.join(ROOT, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

const SERVICES = new Set([
  'Signature Blowout',
  'Blowout + Scalp Massage',
  'Blowout + Deep Conditioning',
  'Blowout + Braid',
  'Updo',
]);

function readBookings() {
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeBookings(list) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(list, null, 2));
}

function isValidDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getDay(); // 0 Sun … 6 Sat
  if (day === 0 || day === 1) return false; // closed Sun–Mon
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pick = new Date(dateStr + 'T00:00:00');
  return pick >= today;
}

function isValidTime(timeStr) {
  // HH:MM 24h — slots 09:00–16:00 every 30 min
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [h, m] = timeStr.split(':').map(Number);
  if (m !== 0 && m !== 30) return false;
  if (h < 9 || h > 16) return false;
  if (h === 16 && m > 0) return false;
  return true;
}

function slotTaken(bookings, date, time) {
  return bookings.some(
    (b) => b.date === date && b.time === time && b.status !== 'cancelled'
  );
}

async function sendEmails(booking) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.BOOKING_TO_EMAIL || user;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !to) {
    return { emailed: false, reason: 'SMTP not configured' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  const when = `${booking.date} at ${booking.time}`;
  const summary = [
    `New appointment request`,
    ``,
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Service: ${booking.service}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    booking.notes ? `Notes: ${booking.notes}` : null,
    ``,
    `Booking ID: ${booking.id}`,
  ]
    .filter(Boolean)
    .join('\n');

  await transporter.sendMail({
    from,
    to,
    replyTo: booking.email,
    subject: `New booking — ${booking.name} — ${when}`,
    text: summary,
  });

  // Optional confirmation to the client
  await transporter.sendMail({
    from,
    to: booking.email,
    subject: `Appointment request received — Live Love Locks`,
    text: [
      `Hi ${booking.name},`,
      ``,
      `We received your appointment request:`,
      ``,
      `Service: ${booking.service}`,
      `When: ${when}`,
      ``,
      `We'll confirm shortly. Questions? Call or text (239) 204-3388.`,
      ``,
      `— Live Love Locks`,
    ].join('\n'),
  });

  return { emailed: true };
}

export async function handleBookingRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'GET' && (req.url === '/api/bookings/slots' || req.url?.startsWith('/api/bookings/slots?'))) {
    const url = new URL(req.url, 'http://localhost');
    const date = url.searchParams.get('date') || '';
    const bookings = readBookings();
    const taken = bookings
      .filter((b) => b.date === date && b.status !== 'cancelled')
      .map((b) => b.time);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ date, taken }));
    return;
  }

  if (req.method !== 'POST' || req.url?.split('?')[0] !== '/api/book') {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let data;
  try {
    data = JSON.parse(body || '{}');
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const phone = String(data.phone || '').trim();
  const service = String(data.service || '').trim();
  const date = String(data.date || '').trim();
  const time = String(data.time || '').trim();
  const notes = String(data.notes || '').trim().slice(0, 500);

  if (!name || name.length < 2) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Please enter your name.' }));
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Please enter a valid email.' }));
    return;
  }
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Please enter a valid phone number.' }));
    return;
  }
  if (!SERVICES.has(service)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Please choose a service.' }));
    return;
  }
  if (!isValidDate(date)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Please pick a valid date (Tue–Sat, today or later).' }));
    return;
  }
  if (!isValidTime(time)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Please pick a valid time slot.' }));
    return;
  }

  const bookings = readBookings();
  if (slotTaken(bookings, date, time)) {
    res.statusCode = 409;
    res.end(JSON.stringify({ error: 'That time is already booked. Please choose another.' }));
    return;
  }

  const booking = {
    id: 'bk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name,
    email,
    phone,
    service,
    date,
    time,
    notes: notes || null,
    status: 'requested',
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);
  writeBookings(bookings);

  let mail = { emailed: false };
  try {
    mail = await sendEmails(booking);
  } catch (err) {
    console.error('[booking] email failed:', err.message);
    mail = { emailed: false, reason: err.message };
  }

  console.log('[booking]', booking.id, booking.date, booking.time, mail.emailed ? 'emailed' : 'saved-only');

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 201;
  res.end(
    JSON.stringify({
      ok: true,
      booking: { id: booking.id, date: booking.date, time: booking.time, service: booking.service },
      emailed: mail.emailed,
    })
  );
}

/** Vite plugin — local booking API during `npm run dev` / preview */
export function bookingApiPlugin() {
  const mount = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const url = req.url || '';
      if (!url.startsWith('/api/book')) return next();
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      try {
        await handleBookingRequest(req, res);
      } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Server error' }));
      }
    });
  };

  return {
    name: 'booking-api',
    configureServer: mount,
    configurePreviewServer: mount,
  };
}
