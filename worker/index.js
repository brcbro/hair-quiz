function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return corsPreflight();

    const path = new URL(request.url).pathname;

    if (request.method !== 'POST') {
      return json({ error: 'Not found' }, 404);
    }

    let data = {};
    try {
      data = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    // Quiz emails and consultations are stored in Firestore from the browser.
    // These endpoints exist so the live site does not depend on the local Vite API.
    if (path === '/api/lead') {
      const email = String(data.email || '').trim().toLowerCase();
      if (!isEmail(email)) return json({ error: 'Please enter a valid email.' }, 400);
      return json({ ok: true, lead: { id: data.quizId || 'lead', email } }, 201);
    }

    if (path === '/api/book') {
      const name = String(data.name || '').trim();
      const email = String(data.email || '').trim();
      const phone = String(data.phone || '').trim();
      if (!name || name.length < 2) return json({ error: 'Please enter your name.' }, 400);
      if (!isEmail(email)) return json({ error: 'Please enter a valid email.' }, 400);
      if (!phone || phone.replace(/\D/g, '').length < 10) {
        return json({ error: 'Please enter a valid phone number.' }, 400);
      }
      return json(
        {
          ok: true,
          booking: { id: 'bk_cf', type: 'consultation', name },
          emailed: false,
        },
        201,
      );
    }

    return json({ error: 'Not found' }, 404);
  },
};
