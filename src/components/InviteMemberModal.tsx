"use client";

import React, { useState } from "react";
import { Loader2, Search, UserPlus, X, CheckCircle, AlertCircle, Copy, MessageCircle } from "lucide-react";
import { searchUsers, sendInvitation } from "@/app/actions/invitations";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

interface InviteMemberModalProps {
    groupId: string;
    groupName: string;
    onClose: () => void;
    onInviteSent?: () => void;
}

export default function InviteMemberModal({ groupId, groupName, onClose, onInviteSent }: InviteMemberModalProps) {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);
    const [foundUsers, setFoundUsers] = useState<any[]>([]); // Array for multiple results
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/group/${groupId}/join` : '';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(joinUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsAppShare = () => {
        const text = `🐭 ¡Tienes una invitación para unirte al grupo "${groupName}" dentro de La Rata!\n\nIngresa a la app y revisa tus invitaciones pendientes para aceptarla y ver los detalles del gasto:\nhttps://ratonpay.vercel.app`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    // Live search effect
    React.useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                setSearching(true);
                setFoundUsers([]);
                setResult(null);
                try {
                    const res = await searchUsers(searchTerm);
                    if (res.success && res.users) {
                        setFoundUsers(res.users);
                    }
                } catch (error) {
                    console.error("Auto search error", error);
                } finally {
                    setSearching(false);
                }
            } else {
                setFoundUsers([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        // Manual search trigger (keep if user presses enter)
        if (searchTerm.length < 2) return;

        setSearching(true);
        setFoundUsers([]);
        setResult(null);

        try {
            const res = await searchUsers(searchTerm);
            if (res.success && res.users && res.users.length > 0) {
                setFoundUsers(res.users);
            } else {
                setResult({ success: false, message: "No se encontraron usuarios" });
            }
        } catch (err) {
            setResult({ success: false, message: "Error al buscar" });
        } finally {
            setSearching(false);
        }
    }

    async function handleSendInvite(targetUser: any) {
        if (!user) return;
        setSendingId(targetUser.uid);
        try {
            // In a real app we would pass the group name properly, or fetch it.
            // For now passing user info for the notification.
            const res = await sendInvitation(groupId, targetUser.uid, { uid: user.uid, name: user.displayName || 'Alguien' });
            if (res.success) {
                setResult({ success: true, message: `¡Invitación enviada a ${targetUser.displayName}!` });
                if (onInviteSent) onInviteSent();
                // Remove from list or just show success? Let's just update feedback
            } else {
                setResult({ success: false, message: res.error || "Error al enviar" });
            }
        } catch (err) {
            setResult({ success: false, message: "Error inesperado" });
        } finally {
            setSendingId(null);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-6">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center">
                    <h2 className="text-xl font-bold text-white mb-2">Invitar Miembro</h2>
                    <p className="text-zinc-500 text-sm italic">Busca por nombre o email.</p>
                </div>

                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nombre o email..."
                        className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        required
                    />
                    <Search className="w-5 h-5 text-zinc-600 absolute left-4 top-1/2 -translate-y-1/2" />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {searching && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
                    </div>
                </form>

                {result && !result.success && foundUsers.length === 0 && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-xl text-sm justify-center">
                        <AlertCircle className="w-4 h-4" />
                        {result.message}
                    </div>
                )}

                {result && result.success && (
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-3 rounded-xl text-sm justify-center mb-4">
                        <CheckCircle className="w-4 h-4" />
                        {result.message}
                    </div>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {foundUsers.map((u) => (
                        <div key={u.uid} className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative border border-zinc-700">
                                    {u.photoURL ? (
                                        <Image src={u.photoURL} alt="User" width={40} height={40} className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-mono font-bold">
                                            {u.displayName?.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{u.displayName}</p>
                                    <p className="text-zinc-500 text-[10px]">{u.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSendInvite(u)}
                                disabled={sendingId === u.uid}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 text-xs rounded-lg transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-1 font-bold"
                            >
                                {sendingId === u.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <>INVITAR <UserPlus className="w-3 h-3" /></>}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="pt-4 mt-2 border-t border-zinc-800 space-y-3">
                    <button
                        type="button"
                        onClick={handleWhatsAppShare}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 py-3 rounded-xl font-bold transition-colors border border-emerald-500/20"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Avisar por WhatsApp
                    </button>
                    <p className="text-center text-[10px] text-zinc-500">
                        El usuario debe registrarse o iniciar sesión con el email al que lo invitaste para poder unirse.
                    </p>
                </div>
            </div>
        </div>
    );
}
