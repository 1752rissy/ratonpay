"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Check, X, Mail, ChevronRight, Trash2 } from "lucide-react";
import { getPendingInvitations, respondToInvitation, getUserGroups, deleteGroup } from "./actions/invitations";
import { cn } from "@/lib/utils";
import ConfirmationModal from "@/components/ConfirmationModal";
import WelcomeRataCard from "@/components/WelcomeRataCard";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => { }
  });

  // Fetch pending invitations and groups
  useEffect(() => {
    if (user) {
      Promise.all([
        getPendingInvitations(user.uid),
        getUserGroups(user.uid)
      ]).then(([invRes, groupsRes]) => {
        if (invRes.success && invRes.invitations) setInvitations(invRes.invitations);
        if (groupsRes.success && groupsRes.groups) setMyGroups(groupsRes.groups);
        setLoadingInvites(false);
      });
    }
  }, [user]);

  async function handleRespond(inviteId: string, accept: boolean) {
    if (!user) return;
    // Optimistic update
    setInvitations(prev => prev.filter(inv => inv.id !== inviteId));

    const res = await respondToInvitation(inviteId, accept, {
      uid: user.uid,
      displayName: user.displayName || 'Usuario',
      email: user.email || ''
    });

    if (res.success && accept && res.groupId) {
      router.push(`/group/${res.groupId}`);
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

      <main className="max-w-md w-full space-y-10 relative z-10">
        <header className="absolute top-0 right-0 p-4 z-20">
          <Link href="/profile" className="group">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden hover:border-emerald-500/50 transition-colors shadow-lg">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-emerald-500 font-bold font-mono text-sm">{user.displayName?.charAt(0) || "U"}</span>
                </div>
              )}
            </div>
          </Link>
        </header>

        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse"></div>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                transition={{
                  duration: 0.8,
                  ease: "backOut",
                  times: [0, 0.6, 1]
                }}
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-2xl relative overflow-hidden"
              >
                <Image
                  src="/rata-logo.png"
                  alt="Rata MVP Logo"
                  width={128}
                  height={128}
                  className="w-32 h-32 object-contain"
                />
              </motion.div>
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-lg">
            RATA<span className="text-emerald-500">.</span>MVP
          </h1>
          <p className="text-lg text-zinc-400 font-mono tracking-tight">
            Gestión de gastos simple y sin fricción.
          </p>
        </div>

        <div className="grid gap-4">

          {/* Pending Invitations Section */}
          {!loadingInvites && invitations.length > 0 && (
            <div className="mb-4 space-y-3">
              <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider pl-2">Invitaciones Pendientes</h3>
              {invitations.map(inv => (
                <div key={inv.id} className="bg-zinc-900 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-500/5 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{inv.groupName}</p>
                      <p className="text-zinc-500 text-xs">De: {inv.fromName}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(inv.id, false)}
                      className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRespond(inv.id, true)}
                      className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}



          <Link
            href="/create-group"
            className="group relative overflow-hidden bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 p-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-purple-500/10"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-300 border border-purple-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">Crear Grupo</h2>
                <p className="text-sm text-zinc-500">Para gastos recurrentes</p>
              </div>
              <ArrowRight className="ml-auto w-5 h-5 text-zinc-700 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* My Groups List */}
          {!loadingInvites && myGroups.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between pl-2">
                <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Mis Grupos</h2>
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

              <div className="grid gap-3">
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

                      <Link
                        href={`/group/${group.id}`}
                        className={cn(
                          "flex-1 bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between transition-all group",
                          !isManageMode ? "hover:border-emerald-500/30" : "pointer-events-none opacity-80"
                        )}
                      >
                        <div>
                          <h3 className="text-white font-bold">{group.name}</h3>
                          <p className="text-zinc-600 text-xs font-mono">{group.alias}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                      </Link>
                    </div>
                  );
                })}
              </div>

              {isManageMode && selectedGroups.size > 0 && (
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: "Eliminar Grupos Seleccionados",
                      description: `⚠️ ¿Confirmas la eliminación de los ${selectedGroups.size} grupos seleccionados?\n\nEsta acción es irreversible y eliminará todos los datos asociados.`,
                      onConfirm: async () => {
                        if (!user) return;

                        let deletedCount = 0;
                        for (const groupId of Array.from(selectedGroups)) {
                          const res = await deleteGroup(groupId, user.uid);
                          if (res.success) deletedCount++;
                        }

                        // Refresh list
                        setLoadingInvites(true);
                        getUserGroups(user.uid).then(res => {
                          if (res.success && res.groups) setMyGroups(res.groups);
                          setLoadingInvites(false);
                        });

                        setSelectedGroups(new Set());
                        setIsManageMode(false);
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                      }
                    });
                  }}
                  className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar seleccionados ({selectedGroups.size})
                </button>
              )}
            </div>
          )}

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

        <footer className="pt-12 text-center">
          <p className="text-xs text-zinc-700 font-mono">v0.2.0 • BETA • AppsTraccion</p>
        </footer>
      </main>

      <WelcomeRataCard />
    </div>
  );
}
