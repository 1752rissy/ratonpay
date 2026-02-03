'use server'

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function createBill(formData: FormData) {
    const description = formData.get("description") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const friendsCount = parseInt(formData.get("friends") as string);

    if (!description || !amount || !friendsCount) {
        throw new Error("Faltan datos requeridos");
    }

    const amountPerPerson = amount / friendsCount;

    // Create initial friends array
    // Status: 'pending' | 'paid'
    const friends = Array.from({ length: friendsCount }).map((_, i) => ({
        id: crypto.randomUUID(),
        name: `Amigo ${i + 1}`,
        status: 'pending',
        amount: amountPerPerson,
    }));

    try {
        const docRef = await addDoc(collection(db, "bills"), {
            description,
            totalAmount: amount,
            friendsCount,
            amountPerPerson,
            friends,
            createdAt: serverTimestamp(),
            status: 'active'
        });

        return { success: true, billId: docRef.id };
    } catch (error) {
        console.error("Error creating bill:", error);
        return { success: false, error: "Error al crear la cuenta" };
    }
}
