importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// We hardcode these for the SW as it can't access process.env easily at runtime without build steps
// But better to fetch from a config endpoint or just rely on the default init if possible.
// Actually, for SW, we usually need the full config or at least senderId.
// Let's try to just use basic init. 

firebase.initializeApp({
    apiKey: "AIzaSyDW9ZgUg5sJvamCYwAbVTcKfIE-otqbMz4",
    authDomain: "rata-pay.firebaseapp.com",
    projectId: "rata-pay",
    storageBucket: "rata-pay.firebasestorage.app",
    messagingSenderId: "1036456250996",
    appId: "1:1036456250996:web:f6aced51858cc08f624b21"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
