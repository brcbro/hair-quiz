import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getFirebase, stripUndefined } from './firebase-app.js';

export { isFirebaseConfigured } from './firebase-app.js';

export async function saveQuizResponse({ quizId, email, selections, rawAnswers, profile }) {
  const fb = getFirebase();
  if (!fb || !quizId || !email) return { saved: false, reason: 'not-configured' };

  const now = new Date().toISOString();
  const payload = stripUndefined({
    quizId,
    email: email.trim().toLowerCase(),
    selections: selections || [],
    rawAnswers: rawAnswers || {},
    profile: profile || {},
    suggestedProducts: [],
    shopClickCount: 0,
    createdAt: now,
    updatedAt: now,
    createdAtServer: serverTimestamp(),
  });

  await setDoc(doc(fb.db, 'quizResponses', quizId), payload, { merge: true });
  return { saved: true, quizId };
}

export async function trackShopClick({
  quizId,
  email,
  productKey,
  title,
  brand,
  url,
  price,
  source,
}) {
  const fb = getFirebase();
  if (!fb || !email) return { saved: false };

  const now = new Date().toISOString();
  await addDoc(collection(fb.db, 'shopClicks'), stripUndefined({
    quizId: quizId || null,
    email: String(email).trim().toLowerCase(),
    productKey: productKey || '',
    title: title || '',
    brand: brand || '',
    url: url || '',
    price: price || '',
    source: source || 'results',
    createdAt: now,
    createdAtServer: serverTimestamp(),
  }));

  if (quizId) {
    try {
      await updateDoc(doc(fb.db, 'quizResponses', quizId), {
        shopClickCount: increment(1),
        lastShopClickAt: now,
        lastShopProduct: title || productKey || '',
      });
    } catch {
      /* quiz doc may not exist yet */
    }
  }

  return { saved: true };
}
