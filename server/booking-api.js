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

  const summary = [
    `New consultation request`,
    ``,
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    booking.notes ? `Notes: ${booking.notes}` : null,
    ``,
    `Request ID: ${booking.id}`,
  ]
    .filter(Boolean)
    .join('\n');

  await transporter.sendMail({
    from,
    to,
    replyTo: booking.email,
    subject: `New consultation request — ${booking.name}`,
    text: summary,
  });

  await transporter.sendMail({
    from,
    to: booking.email,
    subject: `Consultation request received`,
    text: [
      `Hi ${booking.name},`,
      ``,
      `We received your consultation request.`,
      ``,
      `Our team will contact you shortly to schedule a time.`,
      `Questions? Call or text (239) 204-3388.`,
      ``,
      `— Looks Kart`,
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

  const booking = {
    id: 'bk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    type: 'consultation',
    name,
    email,
    phone,
    notes: notes || null,
    status: 'requested',
    createdAt: new Date().toISOString(),
  };

  const bookings = readBookings();
  bookings.push(booking);
  writeBookings(bookings);

  let mail = { emailed: false };
  try {
    mail = await sendEmails(booking);
  } catch (err) {
    console.error('[booking] email failed:', err.message);
    mail = { emailed: false, reason: err.message };
  }

  console.log('[booking]', booking.id, booking.name, mail.emailed ? 'emailed' : 'saved-only');

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 201;
  res.end(
    JSON.stringify({
      ok: true,
      booking: { id: booking.id, type: booking.type, name: booking.name },
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
