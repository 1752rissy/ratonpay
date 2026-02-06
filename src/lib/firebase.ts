import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForBuildProcess",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

// Debugging: Log if we are using the fallback key
if (typeof window !== 'undefined') {
    // Add a global check to window to see if we already alerted to avoid spam
    if (!(window as any).hasAlertedFirebase) {
        const isDummy = firebaseConfig.apiKey === "AIzaSyDummyKeyForBuildProcess";

        // Use console.error for visibility even if not an error
        console.error("[Firebase Debug] App Version: 2026-02-06_15-50");
        console.error("[Firebase Debug] Is Dummy Key?:", isDummy);

        // Log first few chars of key to verify it's not "undefined" or weird, without leaking full key
        const key = firebaseConfig.apiKey || "";
        console.error(`[Firebase Debug] Key Start: ${key.substring(0, 5)}... Length: ${key.length}`);
        console.error(`[Firebase Debug] AuthDomain: ${firebaseConfig.authDomain}`);
        console.error(`[Firebase Debug] ProjectId: ${firebaseConfig.projectId}`);

        if (isDummy) {
            alert("⚠️ ERROR CRÍTICO: Claves DUMMY detectadas. Revisa las variables de entorno en Vercel.");
        }
        (window as any).hasAlertedFirebase = true;
    }
}

import { getStorage } from "firebase/storage";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let messaging: any = null;
if (typeof window !== 'undefined') {
    import("firebase/messaging").then(({ getMessaging }) => {
        messaging = getMessaging(app);
    });
}

export { db, storage, auth, googleProvider, messaging };
