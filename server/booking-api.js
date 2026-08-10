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
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

function readJsonList(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function writeJsonList(file, list) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(list, null, 2));
}

function readBookings() {
  return readJsonList(BOOKINGS_FILE);
}

function writeBookings(list) {
  writeJsonList(BOOKINGS_FILE, list);
}

function readLeads() {
  return readJsonList(LEADS_FILE);
}

function writeLeads(list) {
  writeJsonList(LEADS_FILE, list);
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
      `Questions? WhatsApp us on +91 99533 33412.`,
      ``,
      `— Customised Haircare / Lookskart`,
    ].join('\n'),
  });

  return { emailed: true };
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body;
}

function json(res, status, payload) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

export async function handleLeadRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url?.split('?')[0] !== '/api/lead') {
    json(res, 404, { error: 'Not found' });
    return;
  }

  let data;
  try {
    data = JSON.parse((await readBody(req)) || '{}');
  } catch {
    json(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const email = String(data.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    json(res, 400, { error: 'Please enter a valid email.' });
    return;
  }

  const answers = data.answers && typeof data.answers === 'object' ? data.answers : {};
  const lead = {
    id: 'lead_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    type: 'quiz_email',
    email,
    hair_pain_point: answers.hair_pain_point || null,
    damage_level: answers.damage_level || null,
    heat_tools: answers.heat_tools || null,
    wants_volume: answers.wants_volume || null,
    hair_type: answers.smart_properties_outputs?.hair_type || answers.hair_type || null,
    answers,
    createdAt: new Date().toISOString(),
  };

  const leads = readLeads();
  leads.push(lead);
  writeLeads(leads);
  console.log('[lead]', lead.id, lead.email);

  json(res, 201, { ok: true, lead: { id: lead.id, email: lead.email } });
}

export async function handleBookingRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url?.split('?')[0] !== '/api/book') {
    json(res, 404, { error: 'Not found' });
    return;
  }

  let data;
  try {
    data = JSON.parse((await readBody(req)) || '{}');
  } catch {
    json(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const phone = String(data.phone || '').trim();
  const notes = String(data.notes || '').trim().slice(0, 500);
  const quiz = data.quiz && typeof data.quiz === 'object' ? data.quiz : null;

  if (!name || name.length < 2) {
    json(res, 400, { error: 'Please enter your name.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    json(res, 400, { error: 'Please enter a valid email.' });
    return;
  }
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    json(res, 400, { error: 'Please enter a valid phone number.' });
    return;
  }

  const booking = {
    id: 'bk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    type: 'consultation',
    name,
    email,
    phone,
    notes: notes || null,
    quiz,
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

  json(res, 201, {
    ok: true,
    booking: { id: booking.id, type: booking.type, name: booking.name },
    emailed: mail.emailed,
  });
}

/** Vite plugin — local booking API during `npm run dev` / preview */
export function bookingApiPlugin() {
  const mount = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const url = req.url || '';
      if (!url.startsWith('/api/book') && !url.startsWith('/api/lead')) return next();
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      try {
        if (url.startsWith('/api/lead')) await handleLeadRequest(req, res);
        else await handleBookingRequest(req, res);
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
