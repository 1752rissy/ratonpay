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
        console.log("[Firebase Init] Config Version: 2026-02-06_15-40");
        console.log("[Firebase Init] API Key:", firebaseConfig.apiKey);

        if (isDummy) {
            console.error("CRITICAL: Running with DUMMY keys.");
            // Force an alert so the user sees it immediately
            alert("⚠️ ERROR CRÍTICO DE CONFIGURACIÓN ⚠️\n\nLa aplicación está corriendo con claves de prueba (DUMMY KEYS).\n\nEsto significa que Vercel no está cargando las variables de entorno correctamente.\n\nPor favor, asegúrate de haber hecho REDEPLOY después de agregar las variables.");
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
