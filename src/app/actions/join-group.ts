'use server'

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

export async function joinGroup(groupId: string, formData: FormData) {
    const name = formData.get("name") as string;

    if (!name) {
        throw new Error("El nombre es requerido");
    }

    try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            return { success: false, error: "Grupo no encontrado" };
        }

        const userId = crypto.randomUUID();

        await updateDoc(groupRef, {
            members: arrayUnion({
                id: userId,
                name,
                joinedAt: new Date().toISOString()
            })
        });

        return { success: true, groupId, userId, name };
    } catch (error) {
        console.error("Error joining group:", error);
        return { success: false, error: "Error al unirse al grupo" };
    }
}
