"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    signInAsGuest: (name: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    registerWithEmail: async () => { },
    loginWithEmail: async () => { },
    signInAsGuest: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
                // Sync user to Firestore for directory searching
                try {
                    await setDoc(doc(db, "users", currentUser.uid), {
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName,
                        searchName: currentUser.displayName?.toLowerCase(),
                        photoURL: currentUser.photoURL,
                        lastSeen: new Date().toISOString()
                    }, { merge: true });

                    // Request Notification Permission and Save Token
                    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                        const { messaging } = await import("@/lib/firebase");
                        const { getToken } = await import("firebase/messaging");

                        if (messaging) {
                            try {
                                const permission = await Notification.requestPermission();
                                if (permission === 'granted') {
                                    const token = await getToken(messaging, {
                                        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                                    });
                                    if (token) {
                                        await setDoc(doc(db, "users", currentUser.uid), {
                                            fcmToken: token
                                        }, { merge: true });
                                        console.log("FCM Token saved");
                                    }
                                }
                            } catch (err) {
                                console.error("Error getting notification token", err);
                            }
                        }
                    }

                } catch (error) {
                    console.error("Error syncing user to Firestore", error);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            // Router redirect handled by component or protected route logic
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const registerWithEmail = async (email: string, password: string, name: string) => {
        try {
            const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
            const result = await createUserWithEmailAndPassword(auth, email, password);

            if (result.user) {
                await updateProfile(result.user, {
                    displayName: name,
                    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
                });

                // Sync to Firestore
                await setDoc(doc(db, "users", result.user.uid), {
                    uid: result.user.uid,
                    email: email,
                    displayName: name,
                    searchName: name.toLowerCase(),
                    photoURL: result.user.photoURL,
                    lastSeen: new Date().toISOString()
                }, { merge: true });
            }
        } catch (error) {
            console.error("Error registering with email", error);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        try {
            const { signInWithEmailAndPassword } = await import("firebase/auth");
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error logging in with email", error);
            throw error;
        }
    };

    const signInAsGuest = async (name: string) => {
        try {
            const { signInAnonymously, updateProfile } = await import("firebase/auth");
            const result = await signInAnonymously(auth);

            if (result.user) {
                await updateProfile(result.user, {
                    displayName: name,
                    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`
                });

                // Force sync to Firestore immediately with correct name
                await setDoc(doc(db, "users", result.user.uid), {
                    uid: result.user.uid,
                    email: null,
                    displayName: name,
                    searchName: name.toLowerCase(),
                    photoURL: result.user.photoURL,
                    lastSeen: new Date().toISOString(),
                    isGuest: true
                }, { merge: true });
            }
        } catch (error) {
            console.error("Error signing in as guest", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Error logging out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, registerWithEmail, loginWithEmail, signInAsGuest, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
