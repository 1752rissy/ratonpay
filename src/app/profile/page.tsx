"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Loader2, LogOut, ArrowLeft, User as UserIcon, ChevronRight, Trash2 } from "lucide-react";
import { getUserGroups, leaveGroup, deleteGroup } from "@/app/actions/invitations";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    const [myGroups, setMyGroups] = useState<any[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [isManageMode, setIsManageMode] = useState(false);


    const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => { }
    });

    function fetchGroups() {
        if (user) {
            setLoadingGroups(true);
            getUserGroups(user.uid).then(res => {
                if (res.success && res.groups) {
                    setMyGroups(res.groups);
                }
                setLoadingGroups(false);
            });
        }
    }

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }

        if (user) {
            fetchGroups();
        }
    }, [user, loading, router]);

    async function handleLeaveGroup(groupId: string, groupName: string) {
        setConfirmModal({
            isOpen: true,
            title: "Abandonar Grupo",
            description: `¿Deseas salir del grupo "${groupName}"?\n\nDejarás de tener acceso a este gasto.`,
            onConfirm: async () => {
                if (!user) return;
                const res = await leaveGroup(groupId, user.uid);
                if (res.success) {
                    fetchGroups();
                } else {
                    alert("Error al salir del grupo");
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }

    async function handleDeleteGroup(groupId: string, groupName: string) {
        setConfirmModal({
            isOpen: true,
            title: "Eliminar Grupo",
            description: `⚠️ Advertencia\n\n¿Estás seguro de que deseas eliminar permanentemente el grupo "${groupName}"?\n\nEsta acción es irreversible y se perderán todos los datos.`,
            onConfirm: async () => {
                if (!user) return;
                const res = await deleteGroup(groupId, user.uid);
                if (res.success) {
                    fetchGroups();
                } else {
                    alert("Error al eliminar el grupo");
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }

    if (loading || !user) {
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

            <main className="max-w-md w-full bg-zinc-900/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-zinc-800 space-y-8 relative z-10">
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-zinc-500 hover:text-emerald-400 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-black text-white tracking-tight">MI PERFIL</h1>
                    <div className="w-6" /> {/* Spacer */}
                </div>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                            {user?.photoURL ? (
                                <Image
                                    src={user.photoURL}
                                    alt={user.displayName || "User"}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                    <UserIcon className="w-10 h-10 text-emerald-500" />
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-4 border-zinc-900"></div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
                        <p className="text-sm text-zinc-500 font-mono">{user.email}</p>
                    </div>
                </div>

                {/* Groups List */}
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between pl-2">
                        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Mis Grupos</h3>
                        {myGroups.some(g => g.payerId === user?.uid || g.createdBy === user?.uid) && (
                            <button
                                onClick={() => {
                                    if (isManageMode) setSelectedGroups(new Set());
                                    setIsManageMode(!isManageMode);
                                }}
                                className={cn(
                                    "text-xs font-bold px-3 py-1 rounded-lg transition-colors",
                                    isManageMode ? "bg-zinc-800 text-white" : "text-emerald-500 hover:bg-emerald-500/10"
                                )}
                            >
                                {isManageMode ? "Cancelar" : "Gestionar"}
                            </button>
                        )}
                    </div>

                    {loadingGroups ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin w-5 h-5 text-zinc-600" /></div>
                    ) : myGroups.length > 0 ? (
                        <div className="space-y-4">
                            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1">
                                {myGroups.map((group) => {
                                    const isAdmin = user && (group.payerId === user.uid || group.createdBy === user.uid);

                                    return (
                                        <div key={group.id} className="flex gap-2 items-center">
                                            {isManageMode && isAdmin && (
                                                <div className="shrink-0 animate-in fade-in zoom-in duration-200">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedGroups.has(group.id)}
                                                        onChange={(e) => {
                                                            const newSet = new Set(selectedGroups);
                                                            if (e.target.checked) newSet.add(group.id);
                                                            else newSet.delete(group.id);
                                                            setSelectedGroups(newSet);
                                                        }}
                                                        className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/50"
                                                    />
                                                </div>
                                            )}

                                            <div className={cn(
                                                "flex-1 bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between transition-all group",
                                                !isManageMode && "hover:border-emerald-500/30"
                                            )}>
                                                <Link href={`/group/${group.id}`} className={cn("flex-1 flex items-center justify-between mr-4", isManageMode && "pointer-events-none opacity-80")}>
                                                    <div>
                                                        <h3 className="text-white font-bold text-sm">{group.name}</h3>
                                                        <p className="text-zinc-600 text-[10px] font-mono">{group.alias}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                                                </Link>

                                                {!isManageMode && (
                                                    <div className="flex items-center border-l border-zinc-800 pl-3">
                                                        {isAdmin ? (
                                                            <button
                                                                onClick={() => handleDeleteGroup(group.id, group.name)}
                                                                className="text-zinc-600 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                                                                title="Eliminar Grupo"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleLeaveGroup(group.id, group.name)}
                                                                className="text-zinc-600 hover:text-yellow-500 transition-colors p-2 hover:bg-yellow-500/10 rounded-lg"
                                                                title="Salir del Grupo"
                                                            >
                                                                <LogOut className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {isManageMode && selectedGroups.size > 0 && (
                                <button
                                    onClick={async () => {
                                        if (!confirm(`¿Eliminar ${selectedGroups.size} grupos seleccionados? Esta acción es irreversible.`)) return;
                                        if (!user) return;

                                        let deletedCount = 0;
                                        for (const groupId of Array.from(selectedGroups)) {
                                            const res = await deleteGroup(groupId, user.uid);
                                            if (res.success) deletedCount++;
                                        }

                                        setSelectedGroups(new Set());
                                        setIsManageMode(false);
                                        fetchGroups();
                                        alert(`Se eliminaron ${deletedCount} grupos.`);
                                    }}
                                    className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar seleccionados ({selectedGroups.size})
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-zinc-600 text-sm">
                            No tenés grupos todavía.
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-zinc-800">
                    <button
                        onClick={logout}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        CERRAR SESIÓN
                    </button>
                </div>
            </main>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmText="Confirmar"
                cancelText="Cancelar"
                isDanger={true}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
