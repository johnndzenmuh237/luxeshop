/* ============================================================
   LUXESHOP — firebase-config.js
   Shared Firebase initialisation, reused by login.html,
   signup.html, luxe-auth.js and account.html.
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyB4zLVvw6SVuFa7TxU4Ee7Ic7381K6Kz0s",
  authDomain: "swiftchain-827f2.firebaseapp.com",
  databaseURL: "https://swiftchain-827f2-default-rtdb.firebaseio.com",
  projectId: "swiftchain-827f2",
  storageBucket: "swiftchain-827f2.firebasestorage.app",
  messagingSenderId: "709059558659",
  appId: "1:709059558659:web:7c3eb1d6ddba07bb14bd36",
  measurementId: "G-5SSGXJL3DS"
};

/* ── Initialise Firebase ── */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };