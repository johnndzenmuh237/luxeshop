/* ============================================================
   LUXESHOP — luxe-auth.js
   Shared helpers that connect Firebase Authentication to the
   existing localStorage-based account.html UI, without touching
   how orders / addresses / payment methods already work.

   Firestore documents live in their own "luxeshop_users"
   collection (separate from any other app sharing this Firebase
   project), keyed by uid:
     { uid, firstName, lastName, email, phone, createdAt, lastLogin }
   ============================================================ */

import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LS_PROFILE_KEY = 'luxeshop_profile';

function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

/* Splits "Jane Smith" -> { firstName: "Jane", lastName: "Smith" } */
export function splitName(full) {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');
  return { firstName, lastName };
}

/* Mirrors a Firestore profile into the exact shape account.html's
   localStorage "luxeshop_profile" already expects, so every
   existing render function (renderProfileSummary, loadProfileForm,
   etc.) keeps working unmodified. */
export function syncProfileToLocal(fsProfile, uid) {
  const existing = readLS(LS_PROFILE_KEY, {});
  const memberSince = (fsProfile.createdAt && fsProfile.createdAt.toDate)
    ? fsProfile.createdAt.toDate().toISOString()
    : (existing.memberSince || new Date().toISOString());

  const { firstName, lastName } = fsProfile.firstName
    ? { firstName: fsProfile.firstName, lastName: fsProfile.lastName || '' }
    : splitName(fsProfile.displayName || '');

  const profile = {
    uid,
    firstName,
    lastName,
    email: fsProfile.email || '',
    phone: fsProfile.phone || '',
    memberSince
  };
  writeLS(LS_PROFILE_KEY, profile);
  return profile;
}

/* Call at the top of account.html. Redirects to login if signed
   out; otherwise pulls the Firestore profile down into
   localStorage and resolves. */
export function requireLuxeUser({ redirectTo = 'login.html' } = {}) {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) {
        window.location.href = redirectTo;
        return reject('not-authenticated');
      }
      let fsProfile = { email: user.email, displayName: user.displayName };
      try {
        const snap = await getDoc(doc(db, 'luxeshop_users', user.uid));
        if (snap.exists()) fsProfile = snap.data();
      } catch (e) {
        console.warn('[luxe-auth] could not load profile doc, using auth fallback', e);
      }
      const profile = syncProfileToLocal(fsProfile, user.uid);
      resolve({ user, profile });
    });
  });
}

export async function signOutLuxe(redirectTo = 'login.html') {
  await signOut(auth);
  window.location.href = redirectTo;
}

/* Best-effort push from the Profile Settings form back to Firestore. */
export async function updateLuxeProfile(uid, { firstName, lastName, email, phone }) {
  await updateDoc(doc(db, 'luxeshop_users', uid), { firstName, lastName, email, phone: phone || '' });
}

/* Used by signup.html right after account creation. */
export async function createLuxeAccount(uid, { firstName, lastName, email, phone }) {
  const data = {
    uid,
    firstName,
    lastName,
    email,
    phone: phone || '',
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp()
  };
  await setDoc(doc(db, 'luxeshop_users', uid), data, { merge: true });
  return data;
}