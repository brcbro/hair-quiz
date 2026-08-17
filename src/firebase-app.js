import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

function readConfig() {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
  if (!cfg.apiKey || !cfg.projectId) return null;
  return cfg;
}

let app;
let db;

export function isFirebaseConfigured() {
  return Boolean(readConfig());
}

export function getFirebase() {
  const cfg = readConfig();
  if (!cfg) return null;
  if (!app) {
    app = initializeApp(cfg);
    db = getFirestore(app);
    if (cfg.measurementId) {
      isSupported()
        .then((ok) => {
          if (ok) getAnalytics(app);
        })
        .catch(() => {});
    }
  }
  return { app, db };
}

export function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out;
  }
  return value;
}
