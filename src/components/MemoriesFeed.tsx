"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Image as ImageIcon, Loader2, Send, X, Trash2, Share2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { addPost, deletePost } from '@/app/actions/posts';
import ConfirmationModal from './ConfirmationModal';

interface Post {
    id: string;
    groupId: string;
    authorId: string;
    authorName: string;
    imageUrl: string;
    caption: string;
    createdAt: string;
}

export default function MemoriesFeed({ groupId, isAdmin, groupName }: { groupId: string, isAdmin: boolean, groupName: string }) {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, postId: "" });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const q = query(
            collection(db, "posts"),
            where("groupId", "==", groupId),
            // Note: Requires a composite index in Firestore if we sort, 
            // but we can sort client-side for now to avoid manual index creation for the MVP.
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const fetchedPosts: Post[] = [];
            snapshot.forEach((doc) => {
                fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
            });

            // Sort client-side: newest first
            fetchedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setPosts(fetchedPosts);
            setLoading(false);
        });

        return () => unsub();
    }, [groupId]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert("La imagen es muy grande. Máximo 10MB.");
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleUploadPost = async () => {
        if (!selectedFile || !user) return;
        setIsUploading(true);

        try {
            // 1. Upload image to Storage
            const storageRef = ref(storage, `memories/${groupId}/${user.uid}_${Date.now()}`);
            await uploadBytes(storageRef, selectedFile);
            const downloadUrl = await getDownloadURL(storageRef);

            // 2. Create Post Document
            const res = await addPost(
                groupId,
                user.uid,
                user.displayName || 'Usuario',
                downloadUrl,
                caption.trim()
            );

            if (!res.success) {
                alert("Error al crear el post: " + res.error);
            }

            // Reset state
            setPreviewUrl(null);
            setSelectedFile(null);
            setCaption("");
        } catch (error) {
            console.error("Upload failed", error);
            alert("Error al subir la imagen");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!user || !deleteModal.postId) return;

        const res = await deletePost(deleteModal.postId, user.uid);
        if (!res.success) {
            alert("No se pudo eliminar: " + res.error);
        }
        setDeleteModal({ isOpen: false, postId: "" });
    };

    const handleShare = async (post: Post) => {
        const shareText = `¡Mira este recuerdo de ${groupName} en Rata! 🐀\n\n${post.caption ? `"${post.caption}"` : ''}`;
        const targetUrl = typeof window !== "undefined" ? window.location.href : "";

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Recuerdo de ${groupName} - Rata`,
                    text: shareText,
                    url: targetUrl
                });
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(`${shareText}\n${targetUrl}`);
                alert("¡Enlace copiado al portapapeles para compartir!");
            } catch (err) {
                alert("No se pudo compartir ni copiar el enlace.");
            }
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-emerald-500" /></div>;
    }

    return (
        <div className="space-y-6">

            {/* Action Bar */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-lg">
                <div className="text-sm text-zinc-400">
                    <span className="font-bold text-white">📸 {posts.length}</span> fotos
                </div>

                <div className="flex gap-2">
                    {/* Hidden inputs */}
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    {/* Capture environment = rear camera on mobile */}
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={cameraInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"
                        title="Subir de galería"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2 font-bold text-sm"
                    >
                        <Camera className="w-5 h-5" />
                        <span className="hidden sm:inline">Tomar Foto</span>
                    </button>
                </div>
            </div>

            {/* Upload Modal/Preview */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col p-4 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold text-lg">Nuevo Recuerdo</h3>
                        <button
                            onClick={() => { setPreviewUrl(null); setSelectedFile(null); setCaption(""); }}
                            className="p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full gap-4">
                        <div className="relative aspect-[4/5] w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
                            <Image
                                src={previewUrl}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Escribe un comentario o recuerdo (opcional)..."
                                className="w-full bg-transparent text-white placeholder:text-zinc-600 resize-none outline-none min-h-[80px]"
                                maxLength={200}
                            />
                            <div className="flex justify-between items-center mt-2 border-t border-zinc-800/50 pt-2">
                                <span className="text-xs text-zinc-600">{caption.length}/200</span>
                                <button
                                    onClick={handleUploadPost}
                                    disabled={isUploading}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {isUploading ? 'Subiendo...' : 'Publicar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feed */}
            {posts.length === 0 ? (
                <div className="text-center py-20 px-4 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl border-dashed">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 shadow-xl rotate-[-10deg]">
                        <Camera className="w-8 h-8 text-zinc-500" />
                    </div>
                    <h3 className="text-white font-bold mb-2 text-lg">Aún no hay recuerdos</h3>
                    <p className="text-zinc-500 text-sm max-w-[250px] mx-auto">
                        Anímate a sacar la primera foto de la salida del grupo.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                    {posts.map((post) => {
                        const isAuthor = user?.uid === post.authorId;
                        const canDelete = isAuthor || isAdmin;

                        // Parse date for display
                        const dateObj = new Date(post.createdAt);
                        const dateStr = dateObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                        const timeStr = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={post.id} className="bg-white p-3 pb-8 rounded-sm shadow-xl hover:shadow-2xl transition-all hover:rotate-1 rotate-[-1deg] odd:rotate-1 relative group">
                                <div className="relative aspect-square w-full bg-zinc-200 mb-3 overflow-hidden border border-zinc-300">
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.caption || "Recuerdo del grupo"}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />

                                    {/* Action Buttons Layer */}
                                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        {/* <button
                                            onClick={(e) => { e.stopPropagation(); handleShare(post); }}
                                            className="bg-black/50 hover:bg-emerald-500 text-white p-2 rounded-full active:scale-95 backdrop-blur-sm"
                                            title="Compartir recuerdo"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button> */}

                                        {canDelete && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, postId: post.id }); }}
                                                className="bg-black/50 hover:bg-red-500 text-white p-2 rounded-full active:scale-95 backdrop-blur-sm"
                                                title="Eliminar foto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="px-2">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="font-bold text-zinc-900 text-sm font-mono tracking-tight">{post.authorName}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{dateStr} {timeStr}</span>
                                    </div>
                                    {post.caption && (
                                        <p className="text-zinc-700 text-xs italic font-serif leading-relaxed line-clamp-3">
                                            "{post.caption}"
                                        </p>
                                    )}
                                </div>

                                {/* Tape effect */}
                                <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 border border-white/20 backdrop-blur-sm shadow-sm rotate-[-3deg] z-10"></div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="⚠️ Eliminar Recuerdo"
                description="¿Estás seguro que deseas eliminar esta foto del grupo? Esta acción no se puede deshacer."
                confirmText="Eliminar permanentemente"
                cancelText="Cancelar"
                isDanger={true}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteModal({ isOpen: false, postId: "" })}
            />

        </div>
    );
}
