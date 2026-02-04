"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
    const { user, loading, signInWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-100 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <main className="max-w-md w-full bg-zinc-900/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-zinc-800 space-y-10 relative z-10 text-center">
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse"></div>
                            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-2xl relative overflow-hidden">
                                <Image
                                    src="/rata-logo.png"
                                    alt="Rata MVP Logo"
                                    width={128}
                                    height={128}
                                    className="w-24 h-24 object-contain"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-lg">
                            RATA<span className="text-emerald-500">.</span>MVP
                        </h1>
                        <p className="text-zinc-500 font-medium">
                            Tu cuenta para dividir gastos.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={signInWithGoogle}
                        className="w-full bg-white hover:bg-zinc-100 text-zinc-900 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 group"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span className="group-hover:text-black">Continuar con Google</span>
                    </button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-zinc-900 px-2 text-zinc-500">O bien</span>
                        </div>
                    </div>

                    <EmailAuthForm />

                    <p className="text-xs text-zinc-600">
                        Al continuar, aceptás ser una rata responsable.
                    </p>
                </div>
            </main>
        </div>
    );
}

function EmailAuthForm() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { registerWithEmail, loginWithEmail } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === 'register') {
                if (!name.trim()) throw new Error("El nombre es requerido");
                await registerWithEmail(email, password, name);
            } else {
                await loginWithEmail(email, password);
            }
            router.push("/");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Este email ya está registrado.");
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError("Email o contraseña incorrectos.");
            } else if (err.code === 'auth/weak-password') {
                setError("La contraseña es muy débil (mínimo 6 caracteres).");
            } else {
                setError("Ocurrió un error. Intenta nuevamente.");
            }
            setLoading(false);
        }
    };

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-4 px-6 rounded-xl transition-all shadow-lg active:scale-95 text-sm"
            >
                Entrar con Email y Contraseña
            </button>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-top-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex bg-zinc-800 p-1 rounded-lg mb-4">
                <button
                    onClick={() => setMode('login')}
                    className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${mode === 'login' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Ingresar
                </button>
                <button
                    onClick={() => setMode('register')}
                    className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${mode === 'register' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Registrarse
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'register' && (
                    <input
                        type="text"
                        placeholder="Nombre completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600 text-sm"
                        required
                    />
                )}
                <input
                    type="email"
                    placeholder="Tu correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600 text-sm"
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600 text-sm"
                    required
                />

                {error && (
                    <p className="text-xs text-red-500 font-medium">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? "Procesando..." : (mode === 'login' ? "Ingresar" : "Crear Cuenta")}
                </button>
            </form>

            <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="w-full text-center mt-4 text-xs text-zinc-500 hover:text-zinc-400 underline"
            >
                Cancelar
            </button>
        </div>
    );
}
