'use server';

import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, increment, getDoc } from "firebase/firestore";

export async function addExpense(groupId: string, data: { description: string, amount: number, payerId: string, type?: 'single' | 'multiple', items?: { description: string, amount: number }[] }) {
    try {
        const groupRef = doc(db, "groups", groupId);

        // Verify group exists
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists()) {
            return { success: false, error: "Grupo no encontrado" };
        }

        const expenseType = data.type || 'single';
        const expenseItems = data.items || [];

        // If multiple items, ensure the total amount is the sum of items
        let totalAmount = data.amount;
        if (expenseType === 'multiple' && expenseItems.length > 0) {
            totalAmount = expenseItems.reduce((sum, item) => sum + item.amount, 0);
        }
        const timeLimit = groupSnap.data().timeLimit || 'none';
        let deadlineDate = null;
        if (timeLimit && timeLimit !== 'none' && timeLimit !== 'custom') {
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
            }
        }

        const newExpense = {
            id: crypto.randomUUID(),
            description: data.description,
            amount: totalAmount,
            payerId: data.payerId,
            type: expenseType,
            items: expenseItems,
            createdAt: new Date().toISOString(),
            ...(deadlineDate && { deadlineDate: deadlineDate })
        };

        // Atomically update group and members' payment status
        const groupData = groupSnap.data();
        const updatedMembers = (groupData.members || []).map((m: any) => {
            if (m.id === data.payerId) {
                return {
                    ...m,
                    payments: {
                        ...(m.payments || {}),
                        [newExpense.id]: {
                            status: 'paid',
                            paidAt: new Date().toISOString()
                        }
                    }
                };
            }
            return m;
        });

        await updateDoc(groupRef, {
            expenses: arrayUnion(newExpense),
            members: updatedMembers
        });

        return { success: true, expenseId: newExpense.id };
    } catch (error) {
        console.error("Error adding expense:", error);
        return { success: false, error: "Error al agregar gasto" };
    }
}

export async function addItemToExpense(groupId: string, expenseId: string, item: { description: string, amount: number }) {
    try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            return { success: false, error: "Grupo no encontrado" };
        }

        const groupData = groupSnap.data();
        let updated = false;
        let updateData: any = {};

        if (expenseId === 'root') {
            // Update legacy initial expense (root items) if it still exists
            const currentItems = groupData.items || [];
            updateData.items = [...currentItems, item];
            updateData.amount = (groupData.amount || 0) + item.amount;
            updated = true;
        } else {
            // Update expense in the expenses array
            const expenses = groupData.expenses || [];
            const expenseIndex = expenses.findIndex((e: any) => e.id === expenseId);

            if (expenseIndex !== -1) {
                const expense = expenses[expenseIndex];
                const updatedExpense = {
                    ...expense,
                    items: [...(expense.items || []), item],
                    amount: (expense.amount || 0) + item.amount
                };

                const updatedExpenses = [...expenses];
                updatedExpenses[expenseIndex] = updatedExpense;

                updateData.expenses = updatedExpenses;
                // DO NOT update root groupData.amount
                updated = true;
            }
        }

        if (!updated) {
            return { success: false, error: "Gasto no encontrado" };
        }

        await updateDoc(groupRef, updateData);
        return { success: true };
    } catch (error) {
        console.error("Error adding item to expense:", error);
        return { success: false, error: "Error al agregar ítem" };
    }
}
