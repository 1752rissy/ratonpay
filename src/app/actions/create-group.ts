'use server'

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function createGroup(formData: FormData) {
    const name = formData.get("name") as string;
    const payerName = formData.get("payerName") as string;
    const alias = formData.get("alias") as string;

    if (!name || !payerName || !alias) {
        throw new Error("Faltan datos requeridos");
    }

    const payerId = crypto.randomUUID();

    const ownerEmail = formData.get("ownerEmail") as string;
    const ownerUid = formData.get("ownerUid") as string;
    const description = formData.get("description") as string;
    const timeLimit = formData.get("timeLimit") as string;

    let deadlineDate = null;
    if (timeLimit && timeLimit !== 'none') {
        const now = new Date();
        if (timeLimit === '24h') {
            now.setHours(now.getHours() + 24);
            deadlineDate = now.toISOString();
        } else if (timeLimit === '48h') {
            now.setHours(now.getHours() + 48);
            deadlineDate = now.toISOString();
        } else if (timeLimit === '7d') {
            now.setDate(now.getDate() + 7);
            deadlineDate = now.toISOString();
        } else if (timeLimit === 'custom') {
            const custom = formData.get("customDeadline") as string;
            if (custom) deadlineDate = new Date(custom).toISOString();
        }
    }

    // Amount Handling
    const amountStr = formData.get("amount");
    const amount = amountStr ? parseFloat(amountStr as string) : 0;

    // Existing members to invite (Recycle Group Logic)
    const existingMembersJson = formData.get("existingMembers");
    const membersToInvite = existingMembersJson ? JSON.parse(existingMembersJson as string) : [];

    const groupData = {
        name,
        payerName,
        payerId, // This might become redundant if we use ownerUid, but keeping for backward compat for now
        alias,
        description: description || null,
        amount: amount, // Total amount
        deadlineDate,
        createdBy: ownerUid || 'anonymous',
        ownerEmail: ownerEmail || null,
        members: [
            {
                id: ownerUid || payerId, // Prefer UID if available
                name: payerName,
                email: ownerEmail || null,
                joinedAt: new Date().toISOString(),
                joinedAt: new Date().toISOString(),
                status: 'paid', // Admin starts as valid since they paid the bill
                paidAt: new Date().toISOString() // Mark as paid now
            }
        ],
        memberIds: [ownerUid || payerId], // Array for easy querying
        createdAt: new Date().toISOString()
    };

    console.log("Creating/Saving group with data:", JSON.stringify(groupData, null, 2));

    try {
        const docRef = await addDoc(collection(db, "groups"), groupData);

        // Process Invitations for Recycled Members
        if (membersToInvite && membersToInvite.length > 0) {
            const { sendInvitation } = await import("./invitations");

            // We iterate and send invites
            // Note: This might be slow if many members, but ok for MVP.
            // Also, we need 'fromUser' info.
            const fromUser = { uid: ownerUid || payerId, name: payerName };

            // Import Notification sender (dynamic import to avoid issues if admin invalid)
            const { sendPushNotification } = await import("./notifications");
            const { getDoc, doc } = await import("firebase/firestore");
            // The 'db' import is already at the top, but the user's instruction includes it again.
            // I will keep the user's instruction as is, but note that `db` is already imported.
            const { db: firestoreDb } = await import("@/lib/firebase"); // Renamed to avoid conflict with top-level 'db'
            // Ideally should check user docs for tokens.

            for (const member of membersToInvite) {
                // Don't invite self
                if (member.id === fromUser.uid) continue;

                // Create invitation
                await sendInvitation(docRef.id, member.id, fromUser);

                // --- SEND PUSH NOTIFICATION ---
                try {
                    // Fetch user token directly here to be fast
                    // Wait, db import above might be client SDK. Server actions run on server (Node).
                    // We need to fetch the target user's document to get fcmToken.
                    // Re-using the client SDK 'db' is fine in Next.js Server Actions usually if config is standard.

                    // We need to get the user's token.
                    // This is a bit "heavy" inside a loop, but for MVP < 10 members is fine.
                    // A better way is batch fetching tokens, but let's keep it simple.

                    // Note: 'member.id' is the UID.
                    // We need to read from 'users' collection.
                    // Importing getDoc/doc from firestore inside loop is ok? Better outside.

                    // Let's assume we can get token.
                    // Fetch user doc
                    // I will do it cleaner below.
                } catch (e) {
                    console.error("Notif error prep", e);
                }
            }

            // Post-loop notification loop (better for readability)
            for (const member of membersToInvite) {
                if (member.id === fromUser.uid) continue;
                try {
                    const userRef = doc(firestoreDb, "users", member.id); // Using firestoreDb to avoid conflict
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        if (userData?.fcmToken) {
                            await sendPushNotification(
                                userData.fcmToken,
                                `🐀 Nuevo Gasto: ${name}`,
                                `${payerName} te agregó a un gasto. Toca para ver detalle.`,
                                `/group/${docRef.id}`
                            );
                        }
                    }
                } catch (err) {
                    console.error("Failed to notify user", member.id, err);
                }
            }

        }

        // We return payerId so the client can store it in localStorage
        return { success: true, groupId: docRef.id, payerId };
    } catch (error) {
        console.error("Error creating group:", error);
        return { success: false, error: "Error al crear el grupo" };
    }
}
