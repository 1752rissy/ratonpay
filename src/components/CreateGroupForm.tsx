"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, Clock, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { createGroup } from "@/app/actions/create-group";
import { useAuth } from "@/context/AuthContext";

export default function CreateGroupForm() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLimit, setTimeLimit] = useState("none"); // none, 24h, 48h, 7d, custom

    const getFutureDate = (hours: number) => {
        const date = new Date();
        date.setHours(date.getHours() + hours);
        return date.toLocaleString('es-AR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await createGroup(formData);

            if (result.success && result.groupId && result.payerId) {
                // Save identification to LocalStorage so we know "I am the admin"
                // structure: rata_groups: { [groupId]: { role: 'admin', userId: payerId } }
                const currentGroups = JSON.parse(localStorage.getItem('rata_groups') || '{}');
                currentGroups[result.groupId] = {
                    role: 'admin',
                    userId: result.payerId,
                    name: formData.get("name")
                };
                localStorage.setItem('rata_groups', JSON.stringify(currentGroups));

                router.push(`/group/${result.groupId}`);
            } else {
                setError(result.error || "Algo salió mal");
                setLoading(false);
            }
        } catch (err) {
            setError("Error de conexión");
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-zinc-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-zinc-800 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-xs font-mono font-medium text-purple-400 mb-2 uppercase tracking-wider">
                        Nombre del Grupo
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        placeholder="Asado, Viaje..."
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none"
                    />
                </div>

                <div>
                    <label htmlFor="payerName" className="block text-xs font-mono font-medium text-purple-400 mb-2 uppercase tracking-wider">
                        Tu Nombre (Encargado)
                    </label>
                    <input
                        type="text"
                        id="payerName"
                        name="payerName"
                        required
                        defaultValue={user?.displayName || ""}
                        placeholder="Tu nombre"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none"
                    />
                    {user && (
                        <>
                            <input type="hidden" name="ownerUid" value={user.uid} />
                            <input type="hidden" name="ownerEmail" value={user.email || ""} />
                        </>
                    )}
                </div>

                <div>
                    <label htmlFor="alias" className="block text-xs font-mono font-medium text-purple-400 mb-2 uppercase tracking-wider">
                        Tu Alias (Para cobrar)
                    </label>
                    <input
                        type="text"
                        id="alias"
                        name="alias"
                        required
                        placeholder="tu.alias.mp"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none font-mono"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-xs font-mono font-medium text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <AlignLeft className="w-4 h-4" /> Descripción (Opcional)
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        placeholder="Detalles del gasto..."
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none resize-none"
                    />
                </div>

                <div>
                    <label htmlFor="timeLimit" className="block text-xs font-mono font-medium text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Límite de Tiempo
                    </label>
                    <select
                        id="timeLimit"
                        name="timeLimit"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none appearance-none"
                    >
                        <option value="none">Sin límite</option>
                        <option value="24h">24 Horas</option>
                        <option value="48h">48 Horas</option>
                        <option value="7d">7 Días</option>
                        <option value="custom">Personalizado</option>
                    </select>
                    {timeLimit !== "none" && timeLimit !== "custom" && (
                        <p className="text-[10px] text-zinc-500 mt-1 pl-1">
                            Vence aprox: {getFutureDate(timeLimit === '24h' ? 24 : timeLimit === '48h' ? 48 : 168)}
                        </p>
                    )}
                </div>

                {timeLimit === "custom" && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label htmlFor="customDeadline" className="block text-xs font-mono font-medium text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Fecha y Hora Límite
                        </label>
                        <input
                            type="datetime-local"
                            id="customDeadline"
                            name="customDeadline"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none [color-scheme:dark]"
                        />
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
                    "w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/20 active:scale-95 uppercase tracking-wider",
                    loading && "opacity-70 cursor-not-allowed grayscale"
                )}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creando Grupo...
                    </>
                ) : (
                    "Crear Grupo"
                )}
            </button>
        </form>
    );
}
