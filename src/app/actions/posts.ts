"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, deleteDoc } from "firebase/firestore";

export async function addPost(groupId: string, authorId: string, authorName: string, imageUrl: string, caption: string) {
    try {
        const postData = {
            groupId,
            authorId,
            authorName,
            imageUrl,
            caption,
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, "posts"), postData);

        return { success: true, postId: docRef.id };
    } catch (error: any) {
        console.error("Error adding post:", error);
        return { success: false, error: error.message };
    }
}

export async function deletePost(postId: string, userId: string) {
    try {
        const docRef = doc(db, "posts", postId);
        const postSnap = await getDoc(docRef);

        if (!postSnap.exists()) {
            return { success: false, error: "Post not found" };
        }

        const data = postSnap.data();
        if (data?.authorId !== userId) {
            // Check if user is the admin of the group
            const groupRef = doc(db, "groups", data?.groupId);
            const groupSnap = await getDoc(groupRef);
            const groupData = groupSnap.data();

            if (groupData?.payerId !== userId && groupData?.createdBy !== userId) {
                return { success: false, error: "Unauthorized" };
            }
        }

        await deleteDoc(docRef);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting post:", error);
        return { success: false, error: error.message };
    }
}
