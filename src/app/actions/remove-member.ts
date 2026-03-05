'use server'

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function removeMember(groupId: string, memberIdToRemove: string, requestingUserId: string) {
    try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            return { success: false, error: "Grupo no encontrado" };
        }

        const groupData = groupSnap.data();
        const isAdmin = groupData.payerId === requestingUserId || (groupData as any).createdBy === requestingUserId;

        // Allowed if admin, or if the user is removing themselves
        if (!isAdmin && requestingUserId !== memberIdToRemove) {
            return { success: false, error: "No tienes permiso para eliminar a este miembro" };
        }

        // Cannot remove the admin
        if (memberIdToRemove === groupData.payerId || memberIdToRemove === (groupData as any).createdBy) {
            return { success: false, error: "No se puede eliminar al administrador del grupo" };
        }

        const newMembers = groupData.members.filter((m: any) => m.id !== memberIdToRemove);
        const newMemberIds = groupData.memberIds?.filter((id: string) => id !== memberIdToRemove) || [];

        await updateDoc(groupRef, {
            members: newMembers,
            memberIds: newMemberIds
        });

        return { success: true };
    } catch (error) {
        console.error("Error removing member:", error);
        return { success: false, error: "Error al eliminar miembro" };
    }
}
