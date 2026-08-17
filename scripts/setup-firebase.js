/**
 * Finish salon-anchor Firebase setup using the logged-in Firebase CLI account:
 * enable email/password, import the previous admin user, write admins/{uid},
 * publish rules, and copy quizResponses / shopClicks / consultations.
 *
 * Requires Owner/Editor on project salon-anchor.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const EXPORT_FILE = path.join(DATA_DIR, 'hair-quiz-1-export.json');
const AUTH_FILE = path.join(DATA_DIR, 'hair-quiz-1-auth.json');
const DEST = 'salon-anchor';
const SOURCE = 'hair-quiz-1';
const COLLECTIONS = ['quizResponses', 'shopClicks', 'consultations'];

async function firebaseToken() {
  const store = JSON.parse(
    fs.readFileSync(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8'),
  );
  const refresh = store?.tokens?.refresh_token;
  if (!refresh) throw new Error('Firebase CLI is not logged in. Run: npx firebase-tools login');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  });
  const json = await res.json();
  if (!json.access_token) {
    throw new Error('Could not refresh Firebase CLI token. Run: npx firebase-tools login');
  }
  return json.access_token;
}

async function api(method, url, { token, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token || (await firebaseToken())}`,
      'x-goog-user-project': DEST,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text.slice(0, 400) };
  }
  if (!res.ok) {
    const err = new Error(`${method} ${url} → ${res.status} ${parsed.error?.message || text.slice(0, 200)}`);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return parsed;
}

function firestoreFieldsToJson(fields = {}) {
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = decodeValue(value);
  }
  return out;
}

function decodeValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return { __type: 'timestamp', value: value.timestampValue };
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return firestoreFieldsToJson(value.mapValue.fields || {});
  return null;
}

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (value && typeof value === 'object' && value.__type === 'timestamp') {
    return { timestampValue: value.value };
  }
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      fields[k] = encodeValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function jsonToFirestoreFields(data) {
  const fields = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (v === undefined) continue;
    fields[k] = encodeValue(v);
  }
  return fields;
}

async function listCollection(project, name, token) {
  const docs = [];
  let pageToken = '';
  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${name}`,
    );
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const page = await api('GET', url.toString(), { token });
    for (const doc of page.documents || []) {
      const id = doc.name.split('/').pop();
      docs.push({ id, data: firestoreFieldsToJson(doc.fields) });
    }
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  return docs;
}

async function exportSource() {
  const token = await firebaseToken();
  console.log(`Exporting ${SOURCE}...`);
  const payload = { project: SOURCE, exportedAt: new Date().toISOString(), collections: {} };
  for (const name of [...COLLECTIONS, 'admins']) {
    payload.collections[name] = await listCollection(SOURCE, name, token);
    console.log(`  ${name}: ${payload.collections[name].length}`);
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(EXPORT_FILE, JSON.stringify(payload, null, 2));

  execFileSync(
    'npx',
    ['firebase-tools', 'auth:export', AUTH_FILE, '--project', SOURCE, '--format', 'json'],
    { cwd: ROOT, stdio: 'inherit', shell: true },
  );

  const idConfig = await api(
    'GET',
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${SOURCE}/config`,
    { token },
  );
  fs.writeFileSync(
    path.join(DATA_DIR, 'hair-quiz-1-hash.json'),
    JSON.stringify(idConfig.signIn?.hashConfig || {}, null, 2),
  );
  return payload;
}

async function ensureFirestore(token) {
  try {
    const db = await api(
      'GET',
      `https://firestore.googleapis.com/v1/projects/${DEST}/databases/(default)`,
      { token },
    );
    console.log(`Firestore already exists (${db.locationId || 'unknown location'}).`);
    return db;
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  console.log('Creating Firestore database in nam5...');
  return api(
    'POST',
    `https://firestore.googleapis.com/v1/projects/${DEST}/databases?databaseId=(default)`,
    {
      token,
      body: { type: 'FIRESTORE_NATIVE', locationId: 'nam5' },
    },
  );
}

async function enableEmailAuth(token) {
  await api(
    'PATCH',
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${DEST}/config?updateMask=signIn.email`,
    {
      token,
      body: { signIn: { email: { enabled: true, passwordRequired: true } } },
    },
  );
  console.log('Email/password sign-in enabled.');
}

async function importAdminUser() {
  const users = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')).users || [];
  const hash = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'hair-quiz-1-hash.json'), 'utf8'));
  if (!users.length) throw new Error('No Auth users exported from hair-quiz-1');
  if (!hash.signerKey) throw new Error('Missing password hash config from hair-quiz-1');

  const user = users[0];
  console.log(`Importing admin ${user.email}...`);

  execFileSync(
    'npx',
    [
      'firebase-tools',
      'auth:import',
      AUTH_FILE,
      '--project',
      DEST,
      '--hash-algo',
      hash.algorithm || 'SCRYPT',
      '--hash-key',
      hash.signerKey,
      '--salt-separator',
      hash.saltSeparator || 'Bw==',
      '--rounds',
      String(hash.rounds || 8),
      '--mem-cost',
      String(hash.memoryCost || 14),
    ],
    { cwd: ROOT, stdio: 'inherit', shell: true },
  );

  console.log(`Admin UID: ${user.localId}`);
  return { email: user.email, uid: user.localId };
}

async function writeAdminDoc(token, { uid, email }) {
  await api(
    'PATCH',
    `https://firestore.googleapis.com/v1/projects/${DEST}/databases/(default)/documents/admins/${uid}`,
    {
      token,
      body: {
        fields: {
          role: { stringValue: 'admin' },
          email: { stringValue: email },
        },
      },
    },
  );
  console.log(`Wrote admins/${uid}`);
}

function deployRules() {
  execFileSync('npx', ['firebase-tools', 'deploy', '--only', 'firestore:rules', '--project', DEST], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  });
}

async function copyCollections(token, exported) {
  for (const name of COLLECTIONS) {
    const docs = exported.collections[name] || [];
    let copied = 0;
    for (let i = 0; i < docs.length; i += 200) {
      const chunk = docs.slice(i, i + 200);
      await api(
        'POST',
        `https://firestore.googleapis.com/v1/projects/${DEST}/databases/(default)/documents:commit`,
        {
          token,
          body: {
            writes: chunk.map((doc) => ({
              update: {
                name: `projects/${DEST}/databases/(default)/documents/${name}/${doc.id}`,
                fields: jsonToFirestoreFields(doc.data),
              },
            })),
          },
        },
      );
      copied += chunk.length;
    }
    console.log(`Copied ${name}: ${copied}`);
  }
}

async function main() {
  const token = await firebaseToken();
  console.log(`CLI account will be used for ${DEST}.`);

  let exported;
  if (fs.existsSync(EXPORT_FILE) && fs.existsSync(AUTH_FILE)) {
    exported = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'));
    console.log(`Using existing export at ${EXPORT_FILE}`);
  } else {
    exported = await exportSource();
  }

  await ensureFirestore(token);
  await enableEmailAuth(token);
  const admin = await importAdminUser();
  await writeAdminDoc(token, admin);
  deployRules();
  await copyCollections(token, exported);

  console.log('');
  console.log('salon-anchor is ready.');
  console.log(`Admin login: ${admin.email} (same password as hair-quiz-1)`);
  console.log('Add your Cloudflare hostname under Authentication → Settings → Authorized domains.');
}

main().catch((err) => {
  if (err.status === 403) {
    console.error('');
    console.error('This Google account cannot administer salon-anchor.');
    console.error('In the Google account that owns salon-anchor, add this email as Owner:');
    console.error('  b.r.c.bro12385@gmail.com');
    console.error('  https://console.firebase.google.com/project/salon-anchor/settings/iam');
    console.error('Then run: node scripts/setup-firebase.js');
  } else {
    console.error(err.message || err);
  }
  process.exit(1);
});
