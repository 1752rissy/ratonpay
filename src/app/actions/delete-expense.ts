'use server';

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function deleteExpense(groupId: string, expenseId: string, adminId: string) {
    try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            return { success: false, error: "Grupo no encontrado" };
        }

        const groupData = groupSnap.data();

        // Basic authorization check - if the caller doesn't match the group's payerId
        // we could throw an error, assuming payerId is the admin.
        if (groupData.payerId !== adminId) {
            return { success: false, error: "No tienes permiso para eliminar gastos" };
        }

        const expenses = groupData.expenses || [];
        const expenseIndex = expenses.findIndex((e: any) => e.id === expenseId);

        if (expenseIndex === -1 && expenseId !== 'root') {
            return { success: false, error: "Gasto no encontrado" };
        }

        if (expenseId === 'root') {
            return { success: false, error: "No se puede eliminar el pozo principal directamente desde aquí." };
        }

        // Remove the expense
        const updatedExpenses = expenses.filter((e: any) => e.id !== expenseId);

        // Also clean up members' payments entries for this expense to keep data tidy
        const updatedMembers = (groupData.members || []).map((m: any) => {
            if (m.payments && m.payments[expenseId]) {
                const newPayments = { ...m.payments };
                delete newPayments[expenseId];
                return { ...m, payments: newPayments };
            }
            return m;
        });

        await updateDoc(groupRef, {
            expenses: updatedExpenses,
            members: updatedMembers
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting expense:", error);
        return { success: false, error: "Error al eliminar el gasto" };
    }
}
