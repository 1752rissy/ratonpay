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

            for (const member of membersToInvite) {
                // Don't invite self
                if (member.id === fromUser.uid) continue;

                // We need 'sendInvitation' to be robust. 
                // Since we have their UIDs, we can create the invitation directly.
                // Ensure we don't duplicate if logic exists.
                await sendInvitation(docRef.id, member.id, fromUser);
            }
        }

        // We return payerId so the client can store it in localStorage
        return { success: true, groupId: docRef.id, payerId };
    } catch (error) {
        console.error("Error creating group:", error);
        return { success: false, error: "Error al crear el grupo" };
    }
}
