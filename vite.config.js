import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { bookingApiPlugin } from './server/booking-api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

function firebaseConfigFromEnv(mode) {
  const env = loadEnv(mode, ROOT, '');
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || '',
  };
}

function firebaseConfigScript(mode) {
  return `window.FIREBASE_CONFIG = ${JSON.stringify(firebaseConfigFromEnv(mode))};`;
}

function firebaseConfigPlugin() {
  return {
    name: 'firebase-config',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url !== '/firebase-config.js') return next();
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(firebaseConfigScript(server.config.mode));
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url !== '/firebase-config.js') return next();
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.end(firebaseConfigScript(server.config.mode));
      });
    },
    closeBundle() {
      const dist = path.join(ROOT, 'dist');
      fs.mkdirSync(dist, { recursive: true });
      fs.writeFileSync(path.join(dist, 'firebase-config.js'), firebaseConfigScript('production'));
    },
  };
}

export default defineConfig({
  plugins: [bookingApiPlugin(), firebaseConfigPlugin()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.join(ROOT, 'index.html'),
        admin: path.join(ROOT, 'admin.html'),
      },
    },
  },
});
