'use server';

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, arrayUnion, orderBy, deleteDoc } from "firebase/firestore";

// Re-using this file for general user-related queries for now
export async function getUserGroups(userId: string) {
    try {
        const groupsRef = collection(db, "groups");
        // Create an index for this if needed, but array-contains is standard
        const q = query(groupsRef, where("memberIds", "array-contains", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const groups = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, groups };
    } catch (error) {
        console.error("Error fetching user groups:", error);
        return { success: false, groups: [], error: "Error al cargar grupos" };
    }
}


// Status: 'pending' | 'pending_approval' | 'paid'

export async function uploadPaymentProof(groupId: string, memberId: string, receiptUrl: string) {
    try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) return { success: false, error: "Grupo no encontrado" };

        const groupData = groupSnap.data();
        const updatedMembers = (groupData.members || []).map((m: any) => {
            if (m.id === memberId) {
                return {
                    ...m,
                    status: 'pending_approval',
                    receiptUrl: receiptUrl,
                    submittedAt: new Date().toISOString()
                };
            }
            return m;
        });

        await updateDoc(groupRef, { members: updatedMembers });
        return { success: true };
    } catch (error) {
        console.error("Error uploading proof:", error);
        return { success: false, error: "Error al subir comprobante" };
    }
}

export async function uploadExpenseReceipt(groupId: string, receiptUrl: string) {
    try {
        const groupRef = doc(db, "groups", groupId);
        await updateDoc(groupRef, {
            expenseReceiptUrl: receiptUrl,
            status: 'completed' // Mark group as fully completed?
        });
        return { success: true };
    } catch (error) {
        console.error("Error uploading expense receipt:", error);
        return { success: false, error: "Error al subir comprobante general" };
    }
}

export async function verifyPaymentProof(groupId: string, memberId: string, approved: boolean) {
    try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) return { success: false, error: "Grupo no encontrado" };

        const groupData = groupSnap.data();
        const updatedMembers = (groupData.members || []).map((m: any) => {
            if (m.id === memberId) {
                return {
                    ...m,
                    status: approved ? 'paid' : 'pending', // Revert to pending if rejected
                    paidAt: approved ? new Date().toISOString() : null, // Set paidAt only if approved
                    receiptUrl: approved ? m.receiptUrl : null // Keep URL if paid (record), remove if rejected (cleanup)? Let's keep it generally but for rejection logic maybe plain pending is better.
                };
            }
            return m;
        });

        await updateDoc(groupRef, { members: updatedMembers });
        return { success: true };
    } catch (error) {
        console.error("Error verifying proof:", error);
        return { success: false, error: "Error al verificar pago" };
    }
}

export async function togglePaymentStatus(groupId: string, memberId: string, isPaid: boolean) {
    try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            return { success: false, error: "Grupo no encontrado" };
        }

        const groupData = groupSnap.data();

        const updatedMembers = (groupData.members || []).map((m: any) => {
            if (m.id === memberId) {
                return {
                    ...m,
                    status: isPaid ? 'paid' : 'pending',
                    paidAt: isPaid ? new Date().toISOString() : null
                };
            }
            return m;
        });

        await updateDoc(groupRef, {
            members: updatedMembers
        });

        return { success: true };
    } catch (error) {
        console.error("Error toggling payment:", error);
        return { success: false, error: "Error al actualizar pago" };
    }
}

export async function leaveGroup(groupId: string, userId: string) {
    try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            return { success: false, error: "Grupo no encontrado" };
        }

        const groupData = groupSnap.data();

        // Check if user is creator or payer - if so, DELETE the group
        if (groupData.payerId === userId || groupData.createdBy === userId) {
            await deleteDoc(groupRef);
            return { success: true, message: "Grupo eliminado correctamente" };
        }

        // Filter out the user from members array
        const updatedMembers = (groupData.members || []).filter((m: any) => m.id !== userId);
        // Filter out from memberIds
        const updatedMemberIds = (groupData.memberIds || []).filter((id: string) => id !== userId);

        await updateDoc(groupRef, {
            members: updatedMembers,
            memberIds: updatedMemberIds
        });

        return { success: true, message: "Has salido del grupo" };
    } catch (error) {
        console.error("Error leaving group:", error);
        return { success: false, error: "Error al salir del grupo" };
    }
}

export async function deleteGroup(groupId: string, userId: string) {
    try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            return { success: false, error: "Grupo no encontrado" };
        }

        const groupData = groupSnap.data();

        // Security check: Only creator/payer can delete
        if (groupData.payerId !== userId && groupData.createdBy !== userId) {
            return { success: false, error: "No tienes permiso para eliminar este grupo" };
        }

        await deleteDoc(groupRef);

        return { success: true };
    } catch (error) {
        console.error("Error deleting group:", error);
        return { success: false, error: "Error al eliminar el grupo" };
    }
}

interface InvitationResult {
    success: boolean;
    error?: string;
    message?: string;
    users?: any[];
}

export async function searchUsers(term: string): Promise<InvitationResult> {
    try {
        const usersRef = collection(db, "users");
        const searchTerm = term.toLowerCase();

        // Search by lowercase name (prefix search)
        // searchName >= "dan" AND searchName <= "dan" + "\uf8ff"
        const q = query(
            usersRef,
            where("searchName", ">=", searchTerm),
            where("searchName", "<=", searchTerm + '\uf8ff')
        );

        const querySnapshot = await getDocs(q);

        const users: any[] = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data());
        });

        // Limit results to 5 to avoid spam/overload
        return { success: true, users: users.slice(0, 5) };
    } catch (error) {
        console.error("Error searching users:", error);
        return { success: false, error: "Error al buscar usuarios" };
    }
}

export async function sendInvitation(groupId: string, targetUid: string, fromUser: { uid: string, name: string }): Promise<InvitationResult> {
    try {
        // Verify group exists
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            return { success: false, error: "Grupo no encontrado" };
        }

        const groupData = groupSnap.data();

        // Check if already member
        if (groupData.memberIds?.includes(targetUid)) {
            return { success: false, error: "El usuario ya es miembro del grupo" };
        }

        // Check if invitation already pending
        const invRef = collection(db, "invitations");
        const q = query(invRef,
            where("groupId", "==", groupId),
            where("toUid", "==", targetUid),
            where("status", "==", "pending")
        );
        const existing = await getDocs(q);
        if (!existing.empty) {
            return { success: false, error: "Ya existe una invitación pendiente para este usuario" };
        }

        await addDoc(collection(db, "invitations"), {
            groupId,
            groupName: groupData.name,
            toUid: targetUid,
            fromUid: fromUser.uid,
            fromName: fromUser.name,
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        return { success: true, message: "Invitación enviada" };
    } catch (error) {
        console.error("Error sending invitation:", error);
        return { success: false, error: "Error al enviar invitación" };
    }
}

export async function getPendingInvitations(userUid: string) {
    try {
        const invRef = collection(db, "invitations");
        const q = query(invRef, where("toUid", "==", userUid), where("status", "==", "pending"));
        const snapshot = await getDocs(q);

        const invitations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, invitations };
    } catch (error) {
        console.error("Error fetching invitations:", error);
        return { success: false, invitations: [] };
    }
}

export async function getGroupPendingInvitationsCount(groupId: string) {
    try {
        const invRef = collection(db, "invitations");
        // Count invitations for this group that are pending
        const q = query(invRef, where("groupId", "==", groupId), where("status", "==", "pending"));
        const snapshot = await getDocs(q);

        return { success: true, count: snapshot.size };
    } catch (error) {
        console.error("Error fetching pending invites count:", error);
        return { success: false, count: 0 };
    }
}

export async function getPendingInvitationsForGroup(groupId: string) {
    try {
        const invRef = collection(db, "invitations");
        const q = query(invRef, where("groupId", "==", groupId), where("status", "==", "pending"));
        const snapshot = await getDocs(q);

        const invitations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, invitations };
    } catch (error) {
        console.error("Error fetching group pending invitations:", error);
        return { success: false, invitations: [] };
    }
}

export async function cancelInvitation(inviteId: string, userId: string) {
    try {
        const inviteRef = doc(db, "invitations", inviteId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
            return { success: false, error: "Invitación no encontrada" };
        }

        const inviteData = inviteSnap.data();

        // Check permission: Only the sender (fromUid) can cancel
        if (inviteData.fromUid !== userId) {
            return { success: false, error: "No tienes permiso para cancelar esta invitación" };
        }

        await deleteDoc(inviteRef);
        return { success: true, message: "Invitación cancelada" };
    } catch (error) {
        console.error("Error cancelling invitation:", error);
        return { success: false, error: "Error al cancelar invitación" };
    }
}

export async function respondToInvitation(inviteId: string, accept: boolean, user: { uid: string, displayName: string, email: string }) {
    try {
        const inviteRef = doc(db, "invitations", inviteId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
            throw new Error("Invitación no encontrada");
        }

        const inviteData = inviteSnap.data();

        // Security check
        if (inviteData.toUid !== user.uid) {
            throw new Error("No tienes permiso para responder a esta invitación");
        }

        if (accept) {
            // Add to group
            const groupRef = doc(db, "groups", inviteData.groupId);
            await updateDoc(groupRef, {
                members: arrayUnion({
                    id: user.uid,
                    name: user.displayName,
                    email: user.email,
                    joinedAt: new Date().toISOString()
                }),
                memberIds: arrayUnion(user.uid)
            });
        }

        // Update status
        await updateDoc(inviteRef, {
            status: accept ? 'accepted' : 'rejected',
            respondedAt: new Date().toISOString()
        });

        return { success: true, groupId: inviteData.groupId };
    } catch (error) {
        console.error("Error responding to invitation:", error);
        return { success: false, error: "Error al procesar la invitación" };
    }
}
