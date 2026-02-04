"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createGroup } from "@/app/actions/create-group"; // Updated import
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext"; // Import Auth

export default function CreateBillForm() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const groupId = searchParams.get("groupId");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [groupData, setGroupData] = useState<any>(null); // Re-adding state variables that were lost

    useEffect(() => {
        if (groupId) {
            getDoc(doc(db, "groups", groupId)).then(snap => {
                if (snap.exists()) {
                    setGroupData(snap.data());
                }
            });
        }
    }, [groupId]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        // Add User Context
        if (user) {
            formData.append("ownerUid", user.uid);
            formData.append("ownerEmail", user.email || "");
            formData.append("payerName", user.displayName || "Usuario");
        } else {
            // Fallback or require login? For recycling group, user MUST be logged in usually.
            // If manual, maybe not.
            if (!formData.get("payerName")) formData.append("payerName", "Anónimo");
        }

        // Mapping fields to createGroup expectation
        // createGroup expects: name (which is description here?), payerName, alias, description
        // Form has: description, alias, amount
        formData.append("name", formData.get("description") as string); // Mapping description to Name 

        // Pass existing members if recycling
        if (groupData && groupData.members) {
            formData.append("existingMembers", JSON.stringify(groupData.members));
        }

        // Time Limit Default (24h for now or add selector?)
        formData.append("timeLimit", "24h");

        try {
            const result = await createGroup(formData);

            if (result.success) {
                // If we recycled group, maybe we want to redirect to the new group
                router.push(`/group/${result.groupId}`);
            } else {
                setError(result.error || "Algo salió mal");
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError("Error de conexión");
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-zinc-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-zinc-800 space-y-8 relative overflow-hidden">
            {/* Tech decorative line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
            <div className="space-y-4">
                <div>
                    <label htmlFor="description" className="block text-xs font-mono font-medium text-emerald-500/80 mb-2 uppercase tracking-wider">
                        ¿Qué pagaste? (Nombre del Gasto)
                    </label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        required
                        placeholder="Cena en Palermo, Regalo..."
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                    />
                </div>

                <div>
                    <label htmlFor="alias" className="block text-xs font-mono font-medium text-emerald-500/80 mb-2 uppercase tracking-wider">
                        Alias para recibir
                    </label>
                    <input
                        type="text"
                        id="alias"
                        name="alias"
                        required
                        placeholder="tu.alias.mp"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                        defaultValue={groupData?.alias}
                    />
                </div>

                <div>
                    <label htmlFor="amount" className="block text-xs font-mono font-medium text-emerald-500/80 mb-2 uppercase tracking-wider">
                        Monto Total ($)
                    </label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        required
                        min="1"
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                    />
                </div>

                {groupData ? (
                    <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-zinc-300">
                            <span className="text-sm">Se invitará a los mismos miembros:</span>
                            <span className="font-bold text-white bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 text-xs">
                                {groupData.members.length - 1} Personas
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 italic">
                            Recibirán una notificación para unirse a este nuevo gasto.
                        </p>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Nota:</label>
                        <p className="text-xs text-zinc-400">
                            Podrás invitar amigos con un link o por WhatsApp una vez creado el gasto.
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-mono">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className={cn(
                    "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 uppercase tracking-wider",
                    loading && "opacity-70 cursor-not-allowed grayscale"
                )}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creando...
                    </>
                ) : (
                    "Crear Gasto"
                )}
            </button>
        </form>
    );
}
