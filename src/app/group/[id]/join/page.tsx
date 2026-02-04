"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { joinGroup } from "@/app/actions/join-group";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

import { use } from "react";

export default function JoinGroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Protect route: Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/login?redirect=/group/${id}/join`);
        }
    }, [user, authLoading, router, id]);

    if (authLoading || !user) return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
    );

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await joinGroup(id, formData);

            if (result.success && result.userId && result.name) {
                // Save identification
                const currentGroups = JSON.parse(localStorage.getItem('rata_groups') || '{}');
                currentGroups[id] = {
                    role: 'member',
                    userId: result.userId,
                    name: result.name
                };
                localStorage.setItem('rata_groups', JSON.stringify(currentGroups));

                router.push(`/group/${id}`);
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
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-100">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <main className="max-w-md w-full bg-zinc-900/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-zinc-800 space-y-8 relative z-10">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">Unirse al Grupo</h1>
                    <p className="text-zinc-500 font-medium">Ingresá tu nombre para unirte.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
                            Tu Nombre
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            defaultValue={user?.displayName || ""}
                            placeholder="EJ: PEDRO"
                            className="w-full px-4 py-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none font-bold tracking-wide"
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-xl font-bold">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 uppercase tracking-wider",
                            loading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                UNIÉNDOME...
                            </>
                        ) : (
                            "UNIRME AL GRUPO"
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
}
