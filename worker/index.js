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
      const city = String(data.city || '').trim();
      const pincode = String(data.pincode || '').trim();
      const instagram = String(data.instagram || '').trim();
      if (!name || name.length < 2) return json({ error: 'Please enter your name.' }, 400);
      if (!isEmail(email)) return json({ error: 'Please enter a valid email.' }, 400);
      if (!phone || phone.replace(/\D/g, '').length < 10) {
        return json({ error: 'Please enter a valid phone number.' }, 400);
      }
      if (!city || city.length < 2) return json({ error: 'Please enter your city or location.' }, 400);
      if (!/^[1-9][0-9]{5}$/.test(pincode)) {
        return json({ error: 'Please enter a valid 6-digit pincode.' }, 400);
      }
      if (instagram) {
        const instagramOk = /^(https?:\/\/)?(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/i.test(instagram)
          || /^@?[A-Za-z0-9._]{1,30}$/.test(instagram);
        if (!instagramOk) return json({ error: 'Please enter a valid Instagram handle or link.' }, 400);
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
