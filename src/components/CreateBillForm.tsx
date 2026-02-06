"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createGroup } from "@/app/actions/create-group";
import { addExpense } from "@/app/actions/add-expense"; // Imported new action
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function CreateBillForm() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const groupId = searchParams.get("groupId");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [groupData, setGroupData] = useState<any>(null);

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
        const description = formData.get("description") as string;
        const amountStr = formData.get("amount");
        const amount = amountStr ? parseFloat(amountStr as string) : 0;

        try {
            if (groupId) {
                // ADDING EXPENSE TO EXISTING GROUP
                if (!user) throw new Error("Debes estar logueado");

                const result = await addExpense(groupId, {
                    description,
                    amount,
                    payerId: user.uid
                });

                if (result.success) {
                    router.push(`/group/${groupId}`);
                } else {
                    setError(result.error || "Error al agregar gasto");
                    setLoading(false);
                }
            } else {
                // CREATING NEW GROUP
                // Add User Context
                if (user) {
                    formData.append("ownerUid", user.uid);
                    formData.append("ownerEmail", user.email || "");
                    formData.append("payerName", user.displayName || "Usuario");
                } else {
                    if (!formData.get("payerName")) formData.append("payerName", "Anónimo");
                }

                // Mapping fields to createGroup expectation
                formData.append("name", description);

                // Time Limit Default
                formData.append("timeLimit", "24h");

                const result = await createGroup(formData);

                if (result.success) {
                    router.push(`/group/${result.groupId}`);
                } else {
                    setError(result.error || "Algo salió mal");
                    setLoading(false);
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error de conexión");
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

                {!groupId && (
                    <div>
                        <label htmlFor="alias" className="block text-xs font-mono font-medium text-emerald-500/80 mb-2 uppercase tracking-wider">
                            Alias para recibir
                        </label>
                        <input
                            type="text"
                            id="alias"
                            name="alias"
                            required={!groupId}
                            placeholder="tu.alias.mp"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                            defaultValue={groupData?.alias}
                        />
                    </div>
                )}

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

                {groupId && groupData && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                        <p className="text-sm text-emerald-400 font-bold mb-1">
                            Agregando a: {groupData.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                            Este gasto se sumará al total del grupo.
                        </p>
                    </div>
                )}

                {!groupId && (groupData ? (
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
                ))}
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
