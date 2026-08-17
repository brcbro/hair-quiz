/**
 * Copy Firestore collections from the previous project (hair-quiz-1)
 * into salon-anchor. Auth users cannot be copied; recreate the admin
 * account in the new project, then add admins/{uid} in Firestore.
 *
 * Usage:
 *   npm run migrate:firestore
 *
 * You will be asked for an admin email + password from the OLD project
 * (hair-quiz-1). That account must exist in the `admins` collection there.
 */
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  writeBatch,
} from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const COLLECTIONS = ['quizResponses', 'shopClicks', 'consultations'];
const BATCH_SIZE = 400;

function cfg(prefix) {
  const out = {
    apiKey: process.env[`${prefix}API_KEY`],
    authDomain: process.env[`${prefix}AUTH_DOMAIN`],
    projectId: process.env[`${prefix}PROJECT_ID`],
    storageBucket: process.env[`${prefix}STORAGE_BUCKET`],
    messagingSenderId: process.env[`${prefix}MESSAGING_SENDER_ID`],
    appId: process.env[`${prefix}APP_ID`],
  };
  if (!out.apiKey || !out.projectId) {
    throw new Error(`Missing ${prefix}* Firebase keys in .env`);
  }
  return out;
}

function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (value && typeof value === 'object' && value.constructor === Object) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out;
  }
  return value;
}

function prepareDoc(name, data) {
  const out = stripUndefined({ ...data });
  if (typeof out.email !== 'string' || !out.email) out.email = 'unknown@migrated.local';
  if (name === 'shopClicks' && typeof out.productKey !== 'string') out.productKey = '';
  if (name === 'consultations') {
    if (typeof out.name !== 'string' || !out.name) out.name = 'Unknown';
    if (typeof out.phone !== 'string' || !out.phone) out.phone = '0000000000';
  }
  return out;
}

async function promptCredentials() {
  const emailFromEnv = process.env.SOURCE_ADMIN_EMAIL || '';
  const passFromEnv = process.env.SOURCE_ADMIN_PASSWORD || '';
  if (emailFromEnv && passFromEnv) {
    return { email: emailFromEnv.trim(), password: passFromEnv };
  }

  const rl = readline.createInterface({ input, output });
  try {
    const email = (await rl.question('Old project admin email: ')).trim();
    output.write('Old project admin password: ');
    const password = (await rl.question('')).trim();
    return { email, password };
  } finally {
    rl.close();
  }
}

async function copyCollection(sourceDb, destDb, name) {
  const snap = await getDocs(query(collection(sourceDb, name)));
  if (snap.empty) {
    console.log(`  ${name}: 0 documents`);
    return 0;
  }

  let written = 0;
  let batch = writeBatch(destDb);
  let inBatch = 0;

  async function flush() {
    if (!inBatch) return;
    await batch.commit();
    written += inBatch;
    batch = writeBatch(destDb);
    inBatch = 0;
  }

  for (const d of snap.docs) {
    batch.set(doc(destDb, name, d.id), prepareDoc(name, d.data()), { merge: true });
    inBatch += 1;
    if (inBatch >= BATCH_SIZE) await flush();
  }
  await flush();
  console.log(`  ${name}: copied ${written} document${written === 1 ? '' : 's'}`);
  return written;
}

async function main() {
  const sourceCfg = cfg('SOURCE_FIREBASE_');
  const destCfg = cfg('VITE_FIREBASE_');

  if (sourceCfg.projectId === destCfg.projectId) {
    throw new Error('Source and destination Firebase projects are the same.');
  }

  console.log(`Source:      ${sourceCfg.projectId}`);
  console.log(`Destination: ${destCfg.projectId}`);

  const sourceApp = initializeApp(sourceCfg, 'source');
  const destApp = initializeApp(destCfg, 'dest');
  const sourceDb = getFirestore(sourceApp);
  const destDb = getFirestore(destApp);
  const sourceAuth = getAuth(sourceApp);

  const { email, password } = await promptCredentials();
  if (!email || !password) throw new Error('Admin email and password are required.');

  const cred = await signInWithEmailAndPassword(sourceAuth, email, password);
  const adminSnap = await getDoc(doc(sourceDb, 'admins', cred.user.uid));
  if (!adminSnap.exists()) {
    await signOut(sourceAuth);
    throw new Error('This account is not in the old project admins collection.');
  }

  console.log(`Signed in as ${cred.user.email} (${cred.user.uid})`);
  console.log('Copying collections...');

  let total = 0;
  for (const name of COLLECTIONS) {
    total += await copyCollection(sourceDb, destDb, name);
  }

  const adminsSnap = await getDocs(collection(sourceDb, 'admins'));
  console.log(`  admins: ${adminsSnap.size} document(s) left uncopied (UIDs change in a new Auth project)`);

  await signOut(sourceAuth);
  console.log(`Done. Copied ${total} documents into ${destCfg.projectId}.`);
  console.log('');
  console.log('Still required in salon-anchor:');
  console.log('  1. Authentication → Email/Password → enable');
  console.log('  2. Authentication → Users → add your admin user');
  console.log('  3. Firestore collection `admins` → document ID = that user UID → { role: "admin" }');
  console.log('  4. Authentication → Settings → Authorized domains → add your Cloudflare hostname');
}

main().catch((err) => {
  const code = err.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    console.error('Wrong email or password for the old Firebase project.');
  } else if (code === 'permission-denied') {
    console.error('Permission denied. Deploy firestore.rules to salon-anchor, and use an admin account on hair-quiz-1.');
  } else {
    console.error(err.message || err);
  }
  process.exit(1);
});
