'use server'

import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export async function createBill(formData: FormData) {
    const description = formData.get("description") as string;
    const alias = formData.get("alias") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const friendsCount = parseInt(formData.get("friends") as string);

    if (!description || !alias || !amount || !friendsCount) {
        throw new Error("Faltan datos requeridos");
    }

    const amountPerPerson = amount / friendsCount;

    // Create friends array
    // If groupMembers is present, use it
    const groupMembersJson = formData.get("groupMembers") as string;
    let friends = [];

    if (groupMembersJson) {
        const members = JSON.parse(groupMembersJson);
        friends = members.map((m: any) => ({
            id: m.id,
            name: m.name,
            status: 'pending',
            amount: amountPerPerson,
        }));
    } else {
        // Legacy / Standard behavior
        friends = Array.from({ length: friendsCount }).map((_, i) => ({
            id: crypto.randomUUID(),
            name: `Amigo ${i + 1}`,
            status: 'pending',
            amount: amountPerPerson,
        }));
    }

    const billData = {
        description,
        alias,
        totalAmount: amount,
        friendsCount,
        amountPerPerson,
        friends,
        groupId: formData.get("groupId") || null, // Optional link
        createdAt: new Date().toISOString(),
        status: 'active'
    };

    console.log("Creating/Saving bill with data:", JSON.stringify(billData, null, 2));

    try {
        const docRef = await addDoc(collection(db, "bills"), billData);

        return { success: true, billId: docRef.id };
    } catch (error) {
        console.error("Error creating bill:", error);
        return { success: false, error: "Error al crear la cuenta" };
    }
}
