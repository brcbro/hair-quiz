import {
  adminLogin,
  adminLogout,
  fetchAdminData,
  isFirebaseConfigured,
  watchAuth,
  isAdminUid,
} from './firebase-admin.js';

const loginScreen = document.getElementById('login-screen');
const dashScreen = document.getElementById('dash-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const loginHint = document.getElementById('login-hint');
const statGrid = document.getElementById('stat-grid');
const leadsBody = document.getElementById('leads-body');
const emptyState = document.getElementById('empty-state');
const detailPanel = document.getElementById('detail-panel');
const searchInput = document.getElementById('search-input');
const dashCount = document.getElementById('dash-count');
const listView = document.getElementById('list-view');
const detailView = document.getElementById('detail-view');
const dashTitle = document.getElementById('dash-title');
const backBtn = document.getElementById('back-btn');

let cache = { leads: [], quizzes: [], shopClicks: [], consultations: [] };
let selectedId = null;
let signedIn = false;

function formatDate(value) {
  if (!value) return '—';
  if (typeof value.toDate === 'function') value = value.toDate();
  else if (value.seconds) value = new Date(value.seconds * 1000);
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function quizIdFromUrl() {
  return new URLSearchParams(window.location.search).get('quiz');
}

function accordion(title, hint, inner, open) {
  return `<details class="detail-acc"${open ? ' open' : ''}>
    <summary>
      <span class="acc-title">${escapeHtml(title)}</span>
      ${hint ? `<span class="acc-hint">${escapeHtml(hint)}</span>` : ''}
      <span class="acc-chevron" aria-hidden="true"></span>
    </summary>
    <div class="detail-acc-body">${inner}</div>
  </details>`;
}

function showLogin(message) {
  signedIn = false;
  loginScreen.hidden = false;
  dashScreen.hidden = true;
  dashScreen.classList.remove('is-open');
  cache = { leads: [], quizzes: [], shopClicks: [], consultations: [] };
  selectedId = null;
  if (statGrid) statGrid.innerHTML = '';
  if (leadsBody) leadsBody.innerHTML = '';
  if (detailPanel) {
    detailPanel.innerHTML =
      '<p class="detail-placeholder">Select a quiz to see answers, suggested products, and shop activity.</p>';
  }
  if (message) loginError.textContent = message;
}

function showDash() {
  signedIn = true;
  loginScreen.hidden = true;
  dashScreen.hidden = false;
  dashScreen.classList.add('is-open');
}

function showListView() {
  selectedId = null;
  listView.hidden = false;
  detailView.hidden = true;
  dashTitle.textContent = 'Quiz insights';
  document.title = 'Quiz Admin';
}

function showDetailView() {
  listView.hidden = true;
  detailView.hidden = false;
  dashTitle.textContent = 'Quiz details';
}

function clicksForQuiz(quizId, email) {
  return cache.shopClicks.filter((c) => {
    if (quizId && c.quizId === quizId) return true;
    if (!quizId && email && c.email === email) return true;
    return false;
  });
}

function normalizeConsultation(raw, quiz) {
  const q = quiz || {};
  return {
    name: raw.name || q.consultationName || '',
    email: raw.email || q.consultationEmail || q.email || '',
    phone: raw.phone || q.consultationPhone || '',
    city: raw.city || q.consultationCity || '',
    pincode: raw.pincode || q.consultationPincode || '',
    instagram: raw.instagram || q.consultationInstagram || '',
    notes: raw.notes || q.consultationNotes || '',
    status: raw.status || q.consultationStatus || 'requested',
    createdAt: raw.createdAt || q.consultationRequestedAt || '',
    quizId: raw.quizId || q.quizId || q.id || '',
  };
}

function consultationCard(record) {
  const rows = [
    ['Full name', record.name],
    ['Email', record.email],
    ['Phone', record.phone],
    ['City / location', record.city],
    ['Pincode', record.pincode],
    ['Instagram', record.instagram],
    ['Notes', record.notes],
    ['Status', record.status],
    ['Requested at', formatDate(record.createdAt)],
    ['Quiz ID', record.quizId],
  ];
  return `<article class="consult-card">
    <h3>${escapeHtml(record.name || 'Consultation request')}</h3>
    <dl class="consult-grid">
      ${rows
        .map(
          ([label, value]) =>
            `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || '—')}</dd></div>`
        )
        .join('')}
    </dl>
  </article>`;
}

function allConsultationRecords() {
  const fromCol = (cache.consultations || []).map((c) => normalizeConsultation(c));
  const seen = new Set(
    fromCol.map((c) => `${String(c.email).toLowerCase()}|${c.phone}|${c.createdAt}`)
  );
  const extras = [];
  for (const quiz of cache.quizzes || []) {
    if (!quiz.consultationStatus && !quiz.consultationName) continue;
    const rec = normalizeConsultation({}, quiz);
    const key = `${String(rec.email).toLowerCase()}|${rec.phone}|${rec.createdAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    extras.push(rec);
  }
  return [...fromCol, ...extras].sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  );
}

function consultationsForQuiz(quiz) {
  const email = String(quiz.email || '').trim().toLowerCase();
  const ids = new Set([quiz.id, quiz.quizId].filter(Boolean));
  return (cache.consultations || [])
    .filter((c) => {
      if (c.quizId && ids.has(c.quizId)) return true;
      return email && String(c.email || '').trim().toLowerCase() === email;
    })
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function consultationStatus(quiz) {
  const list = consultationsForQuiz(quiz);
  if (list.length) {
    const status = String(list[0].status || 'requested').toLowerCase();
    if (status === 'requested') return { label: 'Requested', kind: 'requested' };
    return { label: status.replace(/_/g, ' '), kind: 'requested' };
  }
  if (quiz.consultationStatus) {
    const status = String(quiz.consultationStatus).toLowerCase();
    if (status === 'requested') return { label: 'Requested', kind: 'requested' };
    return { label: status.replace(/_/g, ' '), kind: 'requested' };
  }
  return { label: 'Not requested', kind: 'none' };
}

function ritualStatus(quiz) {
  if (quiz.ritualDownloaded) {
    return { label: 'Downloaded', kind: 'requested' };
  }
  return { label: 'Not downloaded', kind: 'none' };
}

function filteredQuizzes() {
  const q = (searchInput.value || '').trim().toLowerCase();
  const list = cache.quizzes;
  if (!q) return list;
  return list.filter((quiz) => {
    const hay = [
      quiz.email,
      quiz.headline,
      quiz.profile?.hair_type,
      quiz.profile?.hair_pain_point,
      quiz.profile?.focus_brand,
      consultationStatus(quiz).label,
      ritualStatus(quiz).label,
      ...(quiz.suggestedProducts || []).map((p) => `${p.title} ${p.brand}`),
      ...(quiz.selections || []).map((s) => `${s.title} ${s.optionText}`),
      ...consultationsForQuiz(quiz).map((c) => `${c.name} ${c.phone} ${c.city} ${c.pincode} ${c.instagram} ${c.notes}`),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

function renderStats() {
  const uniqueEmails = new Set(cache.quizzes.map((q) => q.email).filter(Boolean));
  const productViews = cache.quizzes.reduce(
    (n, q) => n + (Array.isArray(q.suggestedProducts) ? q.suggestedProducts.length : 0),
    0
  );
  const cards = [
    ['Emails collected', uniqueEmails.size],
    ['Quizzes taken', cache.quizzes.length],
    ['Products suggested', productViews],
    ['Shop clicks', cache.shopClicks.length],
    ['Consultations', cache.consultations.length],
    ['Ritual downloads', cache.quizzes.filter((q) => q.ritualDownloaded).length],
  ];
  statGrid.innerHTML = cards
    .map(
      ([label, value]) =>
        `<article class="stat-card"><span>${escapeHtml(label)}</span><strong>${value}</strong></article>`
    )
    .join('');
}

function renderTable() {
  const rows = filteredQuizzes();
  dashCount.textContent = `${rows.length} quiz${rows.length === 1 ? '' : 'zes'}`;
  emptyState.hidden = rows.length > 0;
  leadsBody.innerHTML = rows
    .map((quiz) => {
      const profile = quiz.profile || {};
      const clicks = clicksForQuiz(quiz.quizId || quiz.id, quiz.email);
      const products = quiz.suggestedProducts || [];
      const consult = consultationStatus(quiz);
      const ritual = ritualStatus(quiz);
      return `<tr data-id="${escapeHtml(quiz.id)}">
        <td>
          <div class="email-cell">${escapeHtml(quiz.email || '—')}</div>
          <div class="muted">${escapeHtml(profile.focus_brand || 'Mixed brands')}</div>
        </td>
        <td class="muted">${escapeHtml(formatDate(quiz.createdAt))}</td>
        <td>
          ${escapeHtml(profile.hair_type || '—')} · ${escapeHtml(profile.hair_pain_point || '—')}
          <div class="muted">${escapeHtml(profile.pain_severity || '')} ${escapeHtml(profile.damage_level ? '· ' + profile.damage_level : '')}</div>
        </td>
        <td>${products.length}</td>
        <td>${clicks.length}</td>
        <td>
          <span class="status-pill status-pill--${consult.kind}">${escapeHtml(consult.label)}</span>
          ${
            consult.kind !== 'none'
              ? `<div class="muted">${escapeHtml(
                  (consultationsForQuiz(quiz)[0] || {}).name || quiz.consultationName || ''
                )}</div>`
              : ''
          }
        </td>
        <td><span class="status-pill status-pill--${ritual.kind}">${escapeHtml(ritual.label)}</span></td>
        <td><span class="view-link">View details</span></td>
      </tr>`;
    })
    .join('');
}

function renderDetail(quiz) {
  if (!quiz) {
    detailPanel.innerHTML =
      '<p class="detail-placeholder">This quiz was not found. Go back and pick an email from the list.</p>';
    return;
  }

  const profile = quiz.profile || {};
  const clicks = clicksForQuiz(quiz.quizId || quiz.id, quiz.email);
  const shoppedKeys = new Set(clicks.map((c) => c.productKey).filter(Boolean));
  const shoppedTitles = new Set(clicks.map((c) => (c.title || '').toLowerCase()).filter(Boolean));
  const consult = consultationStatus(quiz);
  const consults = consultationsForQuiz(quiz);
  const ritual = ritualStatus(quiz);
  const pills = [
    profile.hair_type,
    profile.hair_pain_point,
    profile.pain_severity,
    profile.damage_level ? `Damage ${profile.damage_level}` : null,
    profile.heat_tools,
    profile.wants_volume ? `Volume ${profile.wants_volume}` : null,
    profile.focus_brand,
    `Consultation: ${consult.label}`,
    `Ritual: ${ritual.label}`,
  ].filter(Boolean);

  const answers = (quiz.selections || [])
    .map(
      (s) => `<li><strong>${escapeHtml(s.title)}</strong><span>${escapeHtml(s.optionText)}</span></li>`
    )
    .join('');

  const products = (quiz.suggestedProducts || [])
    .map((p) => {
      const shopped =
        shoppedKeys.has(p.key) || shoppedTitles.has(String(p.title || '').toLowerCase());
      const link = p.url
        ? ` · <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">Open</a>`
        : '';
      return `<li class="${shopped ? 'shopped' : ''}">
        <strong>${escapeHtml(p.title || p.key || 'Product')}</strong>
        <span class="muted">${escapeHtml([p.brand, p.price].filter(Boolean).join(' · '))}${link}</span>
        ${shopped ? '<div class="shopped-flag">Clicked</div>' : ''}
      </li>`;
    })
    .join('');

  const clickItems = clicks
    .map((c) => {
      const link = c.url
        ? ` · <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener">Open</a>`
        : '';
      return `<li><strong>${escapeHtml(c.title || c.productKey || 'Product')}</strong><span class="muted">${escapeHtml(formatDate(c.createdAt))}${link}</span></li>`;
    })
    .join('');

  const others = cache.quizzes.filter(
    (q) => q.email && quiz.email && q.email === quiz.email && q.id !== quiz.id
  );
  const otherInner = others.length
    ? `<div class="other-quizzes">${others
        .map(
          (q) =>
            `<button type="button" class="other-quiz" data-id="${escapeHtml(q.id)}">${escapeHtml(formatDate(q.createdAt))}<div class="muted">${escapeHtml((q.profile || {}).hair_type || '')} · ${escapeHtml((q.profile || {}).hair_pain_point || '')}</div></button>`
        )
        .join('')}</div>`
    : '<p class="muted">No other quizzes from this email.</p>';

  const consultRows = consults.length
    ? consults.map((c) => consultationCard(normalizeConsultation(c, quiz))).join('')
    : quiz.consultationStatus || quiz.consultationName
      ? consultationCard(normalizeConsultation({}, quiz))
      : '<p class="muted">No consultation requested.</p>';

  const ritualCount = Number(quiz.ritualDownloadCount || 0);
  const ritualInner = quiz.ritualDownloaded
    ? `<ul class="click-list"><li>
        <strong>Downloaded</strong>
        <span class="muted">${escapeHtml(formatDate(quiz.ritualDownloadedAt))}</span>
        <div class="consult-meta">
          <div><span>Times</span> ${escapeHtml(String(ritualCount || 1))}</div>
        </div>
      </li></ul>`
    : '<p class="muted">Ritual not downloaded.</p>';

  document.title = `${quiz.email || 'Quiz'} · Admin`;
  detailPanel.innerHTML = `
    <p class="dash-eyebrow">Quiz detail</p>
    <h2 class="detail-email">${escapeHtml(quiz.email || 'Unknown')}</h2>
    <p class="muted">${escapeHtml(formatDate(quiz.createdAt))}${quiz.headline ? ' · ' + escapeHtml(quiz.headline) : ''}</p>
    <div class="pill-row">${pills.map((p) => `<span class="pill">${escapeHtml(p)}</span>`).join('')}</div>
    <div class="detail-acc-list">
      ${accordion('Selected answers', `${quiz.selections?.length || 0}`, `<ul class="answer-list">${answers || '<li class="muted">No answers stored.</li>'}</ul>`)}
      ${accordion('Suggested products', `${quiz.suggestedProducts?.length || 0}`, `<ul class="product-list">${products || '<li class="muted">Products were not captured for this quiz yet.</li>'}</ul>`)}
      ${accordion('Shop clicks', `${clicks.length}`, `<ul class="click-list">${clickItems || '<li class="muted">No shop clicks yet.</li>'}</ul>`)}
      ${accordion('Consultation', consult.label, consultRows, consult.kind !== 'none')}
      ${accordion('Ritual download', ritual.label, ritualInner)}
      ${others.length ? accordion('Other quizzes from this email', `${others.length}`, otherInner) : ''}
    </div>
  `;
}

function renderConsultations() {
  const wrap = document.getElementById('consultations-body');
  const countEl = document.getElementById('consultations-count');
  if (!wrap) return;
  const rows = allConsultationRecords();
  if (countEl) countEl.textContent = `${rows.length} request${rows.length === 1 ? '' : 's'}`;
  if (!rows.length) {
    wrap.innerHTML =
      '<tr><td colspan="9" class="muted">No consultation requests yet.</td></tr>';
    return;
  }
  wrap.innerHTML = rows
    .map((c) => {
      const quiz = cache.quizzes.find((q) => q.id === c.quizId || q.quizId === c.quizId);
      const quizCell = quiz
        ? `<button type="button" class="view-link" data-id="${escapeHtml(quiz.id)}">Open quiz</button>`
        : '—';
      return `<tr>
        <td>${escapeHtml(c.name || '—')}</td>
        <td>${escapeHtml(c.email || '—')}</td>
        <td>${escapeHtml(c.phone || '—')}</td>
        <td>${escapeHtml(c.city || '—')}</td>
        <td>${escapeHtml(c.pincode || '—')}</td>
        <td>${escapeHtml(c.instagram || '—')}</td>
        <td>${escapeHtml(c.notes || '—')}</td>
        <td class="muted">${escapeHtml(formatDate(c.createdAt))}<div>${escapeHtml(c.status || '')}</div></td>
        <td>${quizCell}</td>
      </tr>`;
    })
    .join('');
}

function applyView() {
  const id = quizIdFromUrl();
  selectedId = id;
  if (!id) {
    showListView();
    renderTable();
    renderConsultations();
    return;
  }
  showDetailView();
  renderDetail(cache.quizzes.find((q) => q.id === id) || null);
}

function openQuiz(id) {
  const url = new URL(window.location.href);
  url.searchParams.set('quiz', id);
  window.history.pushState({ quiz: id }, '', url);
  applyView();
}

function goToList() {
  const url = new URL(window.location.href);
  url.searchParams.delete('quiz');
  window.history.pushState({}, '', url);
  applyView();
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function exportCsv() {
  const rows = [
    [
      'email',
      'taken_at',
      'hair_type',
      'concern',
      'severity',
      'damage',
      'heat',
      'volume',
      'focus_brand',
      'answers',
      'products',
      'shop_clicks',
      'consultation_status',
      'consultation_name',
      'consultation_email',
      'consultation_phone',
      'consultation_city',
      'consultation_pincode',
      'consultation_instagram',
      'consultation_notes',
      'ritual_downloaded',
      'ritual_downloaded_at',
      'ritual_download_count',
    ],
  ];
  for (const quiz of cache.quizzes) {
    const profile = quiz.profile || {};
    const clicks = clicksForQuiz(quiz.quizId || quiz.id, quiz.email);
    const consult = consultationsForQuiz(quiz)[0] || {};
    rows.push([
      quiz.email || '',
      quiz.createdAt || '',
      profile.hair_type || '',
      profile.hair_pain_point || '',
      profile.pain_severity || '',
      profile.damage_level || '',
      profile.heat_tools || '',
      profile.wants_volume || '',
      profile.focus_brand || '',
      (quiz.selections || []).map((s) => `${s.title}: ${s.optionText}`).join(' | '),
      (quiz.suggestedProducts || []).map((p) => p.title || p.key).join(' | '),
      clicks.map((c) => c.title || c.productKey).join(' | '),
      consultationStatus(quiz).label,
      consult.name || quiz.consultationName || '',
      consult.email || quiz.consultationEmail || quiz.email || '',
      consult.phone || quiz.consultationPhone || '',
      consult.city || quiz.consultationCity || '',
      consult.pincode || quiz.consultationPincode || '',
      consult.instagram || quiz.consultationInstagram || '',
      consult.notes || quiz.consultationNotes || '',
      ritualStatus(quiz).label,
      quiz.ritualDownloadedAt || '',
      quiz.ritualDownloadCount || 0,
    ]);
  }
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quiz-insights.csv';
  a.click();
  URL.revokeObjectURL(url);
}

async function loadData() {
  cache = await fetchAdminData();
  renderStats();
  applyView();
}

if (!isFirebaseConfigured()) {
  loginHint.textContent =
    'Firebase is not configured yet. Add the VITE_FIREBASE_* keys to your .env file, then restart the dev server.';
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';
  try {
    await adminLogin(
      document.getElementById('login-email').value,
      document.getElementById('login-password').value
    );
  } catch (err) {
    loginError.textContent = err.message || 'Could not sign in.';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign in';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => adminLogout());
document.getElementById('refresh-btn').addEventListener('click', () => {
  loadData().catch((err) => {
    loginError.textContent = err.message;
  });
});
document.getElementById('export-btn').addEventListener('click', exportCsv);
searchInput.addEventListener('input', () => {
  renderTable();
  renderConsultations();
});
backBtn.addEventListener('click', goToList);

leadsBody.addEventListener('click', (e) => {
  const row = e.target.closest('tr[data-id]');
  if (!row) return;
  openQuiz(row.getAttribute('data-id'));
});

document.getElementById('consultations-body')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-id]');
  if (!btn) return;
  openQuiz(btn.getAttribute('data-id'));
});

detailPanel.addEventListener('click', (e) => {
  const btn = e.target.closest('.other-quiz[data-id]');
  if (!btn) return;
  openQuiz(btn.getAttribute('data-id'));
});

window.addEventListener('popstate', () => {
  if (signedIn) applyView();
});

watchAuth(async (user, configError) => {
  if (configError) {
    showLogin();
    return;
  }
  if (!user) {
    selectedId = null;
    showLogin();
    return;
  }
  try {
    const allowed = await isAdminUid(user.uid);
    if (!allowed) {
      await adminLogout();
      showLogin('This account is not authorised for admin access.');
      return;
    }
    showDash();
    await loadData();
  } catch (err) {
    showLogin(err.message || 'Could not load admin data. Check Firestore rules.');
  }
});
