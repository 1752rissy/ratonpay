'use server';

import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, increment, getDoc } from "firebase/firestore";

export async function addExpense(groupId: string, data: { description: string, amount: number, payerId: string }) {
    try {
        const groupRef = doc(db, "groups", groupId);

        // Verify group exists
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists()) {
            return { success: false, error: "Grupo no encontrado" };
        }

        const newExpense = {
            id: crypto.randomUUID(),
            description: data.description,
            amount: data.amount,
            payerId: data.payerId,
            createdAt: new Date().toISOString()
        };

        // Atomically add expense and increment total amount
        await updateDoc(groupRef, {
            expenses: arrayUnion(newExpense),
            amount: increment(data.amount)
        });

        return { success: true, expenseId: newExpense.id };
    } catch (error) {
        console.error("Error adding expense:", error);
        return { success: false, error: "Error al agregar gasto" };
    }
}
