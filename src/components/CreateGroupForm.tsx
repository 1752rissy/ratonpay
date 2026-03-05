"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { createGroup } from "@/app/actions/create-group";
import { useAuth } from "@/context/AuthContext";

export default function CreateGroupForm() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    // Form States
    const [name, setName] = useState("");
    const [alias, setAlias] = useState("");
    const [timeLimit, setTimeLimit] = useState("none"); // none, 24h, 48h, 7d, custom
    const [customDeadline, setCustomDeadline] = useState("");

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

    const handleNextStep = () => {
        if (!name.trim()) {
            setError("Por favor, ingresa el nombre del grupo.");
            return;
        }
        setError(null);
        setStep(2);
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!alias.trim()) {
            setError("Tu alias es requerido.");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("alias", alias);
        formData.append("timeLimit", timeLimit);
        if (timeLimit === "custom") {
            formData.append("customDeadline", customDeadline);
        }

        formData.append("payerName", user?.displayName || "Admin");
        if (user) {
            formData.append("ownerUid", user.uid);
            formData.append("ownerEmail", user.email || "");
        }
        formData.append("description", "");
        formData.append("amount", "0");
        formData.append("items", "[]");

        try {
            const result = await createGroup(formData);

            if (result.success && result.groupId && result.payerId) {
                const currentGroups = JSON.parse(localStorage.getItem('rata_groups') || '{}');
                currentGroups[result.groupId] = {
                    role: 'admin',
                    userId: result.payerId,
                    name: name
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
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-zinc-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-zinc-800 relative overflow-hidden min-h-[380px] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

            {/* Step Indicators */}
            <div className="flex gap-2 mb-8 justify-center">
                <div className={cn("h-1.5 w-8 rounded-full transition-colors duration-500", step === 1 ? "bg-purple-500" : "bg-zinc-800")} />
                <div className={cn("h-1.5 w-8 rounded-full transition-colors duration-500", step === 2 ? "bg-purple-500" : "bg-zinc-800")} />
            </div>

            <div className="relative flex-1 overflow-hidden">
                {/* Step 1: Group Name */}
                <div className={cn(
                    "absolute top-0 left-0 w-full transition-all duration-500 ease-out flex flex-col h-full",
                    step === 1 ? "translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-full opacity-0 pointer-events-none"
                )}>
                    <div className="space-y-4 flex-1">
                        <div>
                            <label htmlFor="name" className="block text-xs font-mono font-medium text-purple-400 mb-2 uppercase tracking-wider">
                                Nombre del Grupo
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Asado, Viaje, Regalo..."
                                className="w-full px-4 py-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none text-lg"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleNextStep();
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {error && step === 1 && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-mono">
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleNextStep}
                        className="w-full mt-auto bg-zinc-100 text-zinc-900 hover:bg-white font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 uppercase tracking-wider group"
                    >
                        Siguiente
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Step 2: Details */}
                <div className={cn(
                    "absolute top-0 left-0 w-full transition-all duration-500 ease-out flex flex-col h-full",
                    step === 2 ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none"
                )}>
                    <div className="space-y-5 flex-1 overflow-y-auto pb-4 custom-scrollbar">
                        <div>
                            <label htmlFor="alias" className="block text-xs font-mono font-medium text-purple-400 mb-2 uppercase tracking-wider">
                                Tu Alias (Para cobrar)
                            </label>
                            <input
                                type="text"
                                id="alias"
                                value={alias}
                                onChange={(e) => setAlias(e.target.value)}
                                placeholder="tu.alias.mp"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none font-mono"
                            />
                        </div>

                        <div>
                            <label htmlFor="timeLimit" className="block text-xs font-mono font-medium text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Tiempo para que paguen
                            </label>
                            <select
                                id="timeLimit"
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
                            <div className="animate-in fade-in slide-in-from-top-2 pb-2">
                                <label htmlFor="customDeadline" className="block text-xs font-mono font-medium text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Fecha y Hora Límite
                                </label>
                                <input
                                    type="datetime-local"
                                    id="customDeadline"
                                    value={customDeadline}
                                    onChange={(e) => setCustomDeadline(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none [color-scheme:dark]"
                                />
                            </div>
                        )}
                    </div>

                    {error && step === 2 && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-mono shrink-0">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 mt-auto pt-4 shrink-0 bg-zinc-900/80">
                        <button
                            type="button"
                            onClick={() => { setStep(1); setError(null); }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-4 px-4 rounded-xl transition-colors active:scale-95"
                            aria-label="Volver al paso 1"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/20 active:scale-95 uppercase tracking-wider",
                                loading && "opacity-70 cursor-not-allowed grayscale"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                "Crear Grupo"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
