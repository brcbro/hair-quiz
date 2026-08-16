import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { getFirebase, isFirebaseConfigured } from './firebase-app.js';

export { isFirebaseConfigured };

function getAuthInstance() {
  const fb = getFirebase();
  if (!fb) return null;
  return getAuth(fb.app);
}

export function watchAuth(callback) {
  const auth = getAuthInstance();
  if (!auth) {
    callback(null, new Error('Firebase is not configured'));
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function adminLogin(email, password) {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Firebase is not configured. Add keys to your .env file.');
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const allowed = await isAdminUid(cred.user.uid);
    if (!allowed) {
      await signOut(auth);
      throw new Error('This account is not authorised for admin access.');
    }
    return cred.user;
  } catch (err) {
    if (err.message && err.message.includes('not authorised')) throw err;
    const code = err.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      throw new Error('Wrong email or password.');
    }
    if (code === 'auth/invalid-email') throw new Error('Enter a valid email address.');
    if (code === 'auth/too-many-requests') throw new Error('Too many attempts. Try again later.');
    throw new Error(err.message || 'Could not sign in.');
  }
}

export async function adminLogout() {
  const auth = getAuthInstance();
  if (!auth) return;
  await signOut(auth);
}

export async function isAdminUid(uid) {
  const fb = getFirebase();
  if (!fb || !uid) return false;
  const snap = await getDoc(doc(fb.db, 'admins', uid));
  return snap.exists();
}

export async function fetchAdminData() {
  const fb = getFirebase();
  if (!fb) throw new Error('Firebase is not configured');

  const [quizzesSnap, clicksSnap, consultSnap] = await Promise.all([
    getDocs(query(collection(fb.db, 'quizResponses'), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(fb.db, 'shopClicks'), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(fb.db, 'consultations'), orderBy('createdAt', 'desc'))).catch(() => ({ docs: [] })),
  ]);

  const quizzes = quizzesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const shopClicks = clicksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const consultations = consultSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const leadsMap = new Map();
  for (const quiz of [...quizzes].reverse()) {
    if (!quiz.email) continue;
    const current = leadsMap.get(quiz.email) || {
      email: quiz.email,
      quizCount: 0,
      firstSeenAt: quiz.createdAt,
    };
    current.quizCount += 1;
    current.lastSeenAt = quiz.createdAt;
    current.latestQuizId = quiz.quizId || quiz.id;
    current.latestProfile = quiz.profile || {};
    leadsMap.set(quiz.email, current);
  }

  return {
    leads: [...leadsMap.values()].sort((a, b) =>
      String(b.lastSeenAt || '').localeCompare(String(a.lastSeenAt || ''))
    ),
    quizzes,
    shopClicks,
    consultations,
  };
}
