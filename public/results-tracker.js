/**
 * Results-page analytics: persist suggested products + shop clicks to Firebase.
 * Uses the CDN SDK so this static public file works in both Vite dev and production builds.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  increment,
  serverTimestamp,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

let db = null;

function getConfig() {
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg || !cfg.apiKey || !cfg.projectId) return null;
  return cfg;
}

function getDb() {
  const cfg = getConfig();
  if (!cfg) return null;
  if (!db) {
    db = getFirestore(initializeApp(cfg, 'quiz-results'));
  }
  return db;
}

function readQuizSession() {
  try {
    const answers = JSON.parse(localStorage.getItem('octane_answers') || '{}');
    return {
      quizId: answers._quizId || null,
      email: answers.email || '',
      answers,
    };
  } catch {
    return { quizId: null, email: '', answers: {} };
  }
}

function strip(value) {
  if (Array.isArray(value)) return value.map(strip);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined || v === null) continue;
      out[k] = strip(v);
    }
    return out;
  }
  return value;
}

function productFromCard(el, key) {
  const title =
    (el.querySelector('.product-card-name, .product-name, .same-brand-card-name') || {})
      .textContent || '';
  const brand =
    (el.querySelector('.product-card-brand-label, .product-brand') || {}).textContent || '';
  const price =
    (el.querySelector('.product-price-main, .product-price, .same-brand-card-price') || {})
      .textContent || '';
  const img = el.querySelector('img');
  const catalog = (window.PRODUCTS && window.PRODUCTS[key]) || {};
  return {
    key: key || '',
    title: title.trim(),
    brand: brand.trim(),
    price: price.trim(),
    url: catalog.url || '',
    image: img ? img.getAttribute('src') || '' : '',
  };
}

export function collectSuggestedProducts() {
  const out = [];
  const seen = new Set();

  function add(item) {
    const key = item.key || item.url || item.title;
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(item);
  }

  document.querySelectorAll('.product-card:not(.hidden)').forEach((el) => {
    const btn = el.querySelector('button[onclick]');
    const match = btn && String(btn.getAttribute('onclick')).match(/openLookskart\('([^']+)'\)/);
    add(productFromCard(el, match ? match[1] : ''));
  });

  document.querySelectorAll('.product-row:not(.hidden)').forEach((el) => {
    if (el.closest('.hidden')) return;
    const btn = el.querySelector('button[onclick]');
    const match = btn && String(btn.getAttribute('onclick')).match(/openLookskart\('([^']+)'\)/);
    add(productFromCard(el, match ? match[1] : ''));
  });

  document.querySelectorAll('.same-brand-card').forEach((el) => {
    const btn = el.querySelector('button');
    const urlMatch = btn && String(btn.getAttribute('onclick') || '').match(/'https?:[^']+'/);
    const url = urlMatch ? urlMatch[0].slice(1, -1) : '';
    const item = productFromCard(el, '');
    item.url = url;
    item.source = 'same-brand';
    add(item);
  });

  return out;
}

export async function persistSuggestedProducts() {
  const firestore = getDb();
  const { quizId } = readQuizSession();
  if (!firestore || !quizId) return;

  const headlineEl = document.getElementById('headline');
  const products = collectSuggestedProducts();
  try {
    await updateDoc(doc(firestore, 'quizResponses', quizId), strip({
      suggestedProducts: products,
      headline: headlineEl ? headlineEl.textContent.trim() : '',
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[quiz] could not save suggested products', err);
  }
}

export async function persistShopClick(productKey, extra = {}) {
  const firestore = getDb();
  const { quizId, email } = readQuizSession();
  if (!firestore || !email) return;

  const catalog = (window.PRODUCTS && window.PRODUCTS[productKey]) || {};
  const now = new Date().toISOString();
  const payload = strip({
    quizId,
    email: String(email).trim().toLowerCase(),
    productKey: productKey || extra.productKey || '',
    title: extra.title || '',
    brand: extra.brand || '',
    url: extra.url || catalog.url || '',
    price: extra.price || '',
    source: extra.source || 'shop-button',
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });

  try {
    await addDoc(collection(firestore, 'shopClicks'), payload);
    if (quizId) {
      await updateDoc(doc(firestore, 'quizResponses', quizId), {
        shopClickCount: increment(1),
        lastShopClickAt: now,
        lastShopProduct: payload.title || payload.productKey,
      });
    }
  } catch (err) {
    console.warn('[quiz] could not save shop click', err);
  }
}

export async function persistConsultation(details = {}) {
  const firestore = getDb();
  const session = readQuizSession();
  const email = String(details.email || session.email || '').trim().toLowerCase();
  const name = String(details.name || '').trim();
  const phone = String(details.phone || '').trim();
  if (!firestore || !email || !name || !phone) return;

  const quizId = details.quizId || session.quizId || null;
  const now = new Date().toISOString();
  const payload = strip({
    quizId,
    email,
    name,
    phone,
    notes: String(details.notes || '').trim(),
    status: details.status || 'requested',
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });

  try {
    await addDoc(collection(firestore, 'consultations'), payload);
    if (quizId) {
      await updateDoc(doc(firestore, 'quizResponses', quizId), {
        consultationStatus: payload.status,
        consultationRequestedAt: now,
        consultationName: name,
        consultationPhone: phone,
        consultationNotes: payload.notes || '',
      });
    }
  } catch (err) {
    console.warn('[quiz] could not save consultation', err);
  }
}

export async function persistRitualDownload() {
  const firestore = getDb();
  const { quizId, email } = readQuizSession();
  if (!firestore || !quizId) return;

  const now = new Date().toISOString();
  try {
    await updateDoc(doc(firestore, 'quizResponses', quizId), {
      ritualDownloaded: true,
      ritualDownloadedAt: now,
      ritualDownloadCount: increment(1),
      ritualDownloadEmail: String(email || '').trim().toLowerCase(),
    });
  } catch (err) {
    console.warn('[quiz] could not save ritual download', err);
  }
}

window.QUIZ_TRACK = {
  persistSuggestedProducts,
  persistShopClick,
  persistConsultation,
  persistRitualDownload,
  collectSuggestedProducts,
};

function boot() {
  if (!getConfig()) return;
  window.setTimeout(() => {
    persistSuggestedProducts();
  }, 400);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
