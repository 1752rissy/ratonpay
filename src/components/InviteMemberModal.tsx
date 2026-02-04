"use client";

import React, { useState } from "react";
import { Loader2, Search, UserPlus, X, CheckCircle, AlertCircle } from "lucide-react";
import { searchUsers, sendInvitation } from "@/app/actions/invitations";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

interface InviteMemberModalProps {
    groupId: string;
    onClose: () => void;
}

export default function InviteMemberModal({ groupId, onClose }: InviteMemberModalProps) {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);
    const [foundUsers, setFoundUsers] = useState<any[]>([]); // Array for multiple results
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

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
                    <p className="text-zinc-500 text-sm">Busca por nombre.</p>
                </div>

                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nombre del usuario..."
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
                                    <p className="text-zinc-500 text-[10px] hidden">{u.email}</p>
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

                {/* WhatsApp Action - Always visible or when list is empty */}
                <div className="pt-4 border-t border-zinc-800">
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent("Hola! Te invito a unirte a mi grupo de gastos en Rata MVP. Descargá la app y unite: https://rata-pay.vercel.app")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-zinc-800 hover:bg-[#25D366]/10 hover:text-[#25D366] text-zinc-400 border border-zinc-700 hover:border-[#25D366]/50 p-4 rounded-xl flex items-center justify-center gap-3 transition-all group"
                    >
                        {/* Simple WhatsApp Icon */}
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118 571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                        <div className="text-left">
                            <span className="block text-xs font-bold text-white group-hover:text-[#25D366]">¿No está en la lista?</span>
                            <span className="text-[10px] w-full block">Invitá a un amigo por WhatsApp</span>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
