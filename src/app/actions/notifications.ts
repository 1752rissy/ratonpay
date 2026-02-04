'use server';

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    // Note: In production, use environment variables for service account
    // For this MVP/Client-side demo, we might need a workaround or instruct user to add service account.
    // However, user just gave VAPID key which is for CLIENT.
    // Admin SDK requires a SERVICE ACCOUNT JSON or credentials.
    // If we assume running locally or in an environment where ADC (Application Default Credentials) 
    // works, we can try default init.

    // BUT: If the user hasn't set up the Service Account Key, this will fail.
    // Since I cannot ask the user for a huge JSON file easily here, I will check 
    // if I can use a simpler approach or if I should mock it/warn.

    // IMPORTANT: For Verce/Host deployment, usually GOOGLE_APPLICATION_CREDENTIALS env var is used.
    // For now, I will add a try/catch block.

    try {
        // Trying default credentials or mock if missing
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    } catch (e) {
        console.warn("Firebase Admin Init failed (likely missing credentials). Notifications won't send on server.", e);
    }
}

export async function sendPushNotification(token: string, title: string, body: string, link?: string) {
    if (!token) return { success: false, error: "No token" };

    try {
        if (!admin.apps.length) {
            console.warn("Skipping notification: Admin SDK not initialized");
            return { success: false, error: "Server config missing" };
        }

        await admin.messaging().send({
            token: token,
            notification: {
                title,
                body,
            },
            webpush: {
                fcmOptions: {
                    link: link || '/'
                },
                notification: {
                    icon: '/icons/icon-192x192.png'
                }
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Error sending push notification:", error);
        return { success: false, error: "Failed to send" };
    }
}
