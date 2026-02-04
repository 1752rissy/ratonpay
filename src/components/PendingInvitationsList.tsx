"use client";

import { useEffect, useState } from "react";
import { Loader2, X, Clock } from "lucide-react";
import { getPendingInvitationsForGroup, cancelInvitation } from "@/app/actions/invitations";

export default function PendingInvitationsList({ groupId, currentUserId }: { groupId: string, currentUserId?: string }) {
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        loadInvites();
    }, [groupId]);

    function loadInvites() {
        getPendingInvitationsForGroup(groupId).then(res => {
            if (res.success) {
                setInvitations(res.invitations || []);
            }
            setLoading(false);
        });
    }

    async function handleCancel(inviteId: string) {
        if (!currentUserId) return;
        if (!confirm("¿Cancelar esta invitación?")) return;

        setCancellingId(inviteId);
        const res = await cancelInvitation(inviteId, currentUserId);

        if (res.success) {
            setInvitations(prev => prev.filter(inv => inv.id !== inviteId));
        } else {
            alert(res.error || "Error al cancelar");
        }
        setCancellingId(null);
    }

    if (loading) return <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin inline text-zinc-500" /></div>;
    if (invitations.length === 0) return null;

    return (
        <div className="bg-zinc-900/50 backdrop-blur-md border border-yellow-500/20 rounded-3xl overflow-hidden mt-6">
            <div className="p-4 border-b border-yellow-500/10 flex items-center gap-2 bg-yellow-500/5">
                <Clock className="w-4 h-4 text-yellow-500" />
                <h3 className="font-bold text-sm text-yellow-500">Invitaciones Pendientes ({invitations.length})</h3>
            </div>
            <div className="divide-y divide-zinc-800/50">
                {invitations.map((inv) => (
                    <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
                        <div>
                            <p className="text-zinc-300 font-bold text-sm">Usuario Pendiente</p>
                            <p className="text-zinc-500 text-xs font-mono truncate max-w-[200px]">{inv.toUid}</p>
                            <span className="text-[10px] text-zinc-600">Enviada por: {inv.fromName}</span>
                        </div>
                        <button
                            onClick={() => handleCancel(inv.id)}
                            disabled={cancellingId === inv.id}
                            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all"
                            title="Cancelar Invitación"
                        >
                            {cancellingId === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
