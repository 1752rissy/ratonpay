const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const demoUid = 'demo-user-1234';

async function run() {
    try {
        console.log("Configuring demo user...");
        await setDoc(doc(db, 'users', demoUid), {
            uid: demoUid,
            displayName: 'Usuario Demo',
            searchName: 'usuario demo',
            email: 'demo@gmail.com',
            createdAt: new Date().toISOString()
        });
        console.log('Demo user successfully created in Firestore.');
        process.exit(0);
    } catch (error) {
        console.error("Error creating demo user:", error);
        process.exit(1);
    }
}

run();
