"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBill } from "@/app/actions/create-bill";

export default function CreateBillForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await createBill(formData);

            if (result.success) {
                router.push(`/bill/${result.billId}`);
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
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 space-y-6">
            <div className="space-y-4">
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                        ¿Qué pagaste?
                    </label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        required
                        placeholder="Cena en Palermo, Regalo de Juan..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
                    />
                </div>

                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
                        Monto Total ($)
                    </label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        required
                        min="1"
                        placeholder="10000"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-lg font-mono font-medium"
                    />
                </div>

                <div>
                    <label htmlFor="friends" className="block text-sm font-medium text-slate-700 mb-1">
                        Cantidad de Personas (incluyéndote)
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            id="friends"
                            name="friends"
                            min="2"
                            max="20"
                            defaultValue="3"
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            onInput={(e) => {
                                const span = document.getElementById('friend-count');
                                if (span) span.innerText = (e.target as HTMLInputElement).value;
                            }}
                        />
                        <span id="friend-count" className="text-xl font-bold text-green-600 min-w-[2ch] text-center">3</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className={cn(
                    "w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95",
                    loading && "opacity-70 cursor-not-allowed"
                )}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creando...
                    </>
                ) : (
                    "Crear División"
                )}
            </button>
        </form>
    );
}
