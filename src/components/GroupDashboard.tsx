"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Loader2, DollarSign, Users, ChevronLeft, Plus, Edit, Share2, Check, ExternalLink, Activity, Info, ChevronRight, X, AlertCircle, Trash2, Camera, Receipt, Clock, CheckCircle2, ShieldCheck, Mail, MapPin, Eye, ImageIcon, UserPlus, Trophy, Turtle, LogOut, Upload, List, ArrowLeft, X as XIcon, AlertTriangle, Wallet, Copy
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import InviteMemberModal from "./InviteMemberModal";
import ConfirmationModal from "./ConfirmationModal";
import PaymentVerificationModal from "./PaymentVerificationModal";
import PendingInvitationsList from "./PendingInvitationsList";
import { useAuth } from "@/context/AuthContext";
import { removeMember } from "@/app/actions/remove-member";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { addItemToExpense } from "@/app/actions/add-expense";
import { deleteExpense } from "@/app/actions/delete-expense";
import { togglePaymentStatus, leaveGroup, uploadPaymentProof, verifyPaymentProof } from "@/app/actions/invitations";
import confetti from "canvas-confetti";
import PlacesRecommendations from "./PlacesRecommendations";

interface Member {
    id: string;
    name: string;
    joinedAt: any;
    status?: 'paid' | 'pending' | 'pending_approval';
    paidAt?: string;
    receiptUrl?: string;
    payments?: {
        [expenseId: string]: {
            status: 'paid' | 'pending' | 'pending_approval';
            paidAt?: string;
            receiptUrl?: string;
            submittedAt?: string;
        }
    };
}

interface Expense {
    id: string;
    description: string;
    amount: number;
    payerId: string;
    createdAt: string;
    type?: 'single' | 'multiple';
    items?: { description: string, amount: number }[];
    deadlineDate?: string;
}

interface Group {
    id: string;
    name: string;
    payerName: string;
    payerId: string;
    alias: string;
    description?: string;
    deadlineDate?: string;
    createdAt?: string;
    members: Member[];
    memberIds?: string[];
    expenseReceiptUrl?: string;
    status?: string;
    expenses?: Expense[];
    amount: number;
    type?: 'single' | 'multiple';
    items?: { description: string, amount: number }[];
}

export default function GroupDashboard({ groupId }: { groupId: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => { }
    });
    const [verificationModal, setVerificationModal] = useState<{ isOpen: boolean; receiptUrl: string; memberName: string; memberId: string; expenseId?: string } | null>(null);
    const [uploadingInfo, setUploadingInfo] = useState<{ memberId: string; uploading: boolean } | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<{ memberId: string; expenseId: string } | null>(null);
    const [deleteExpenseModal, setDeleteExpenseModal] = useState({ isOpen: false, expenseId: "" });
    const [refreshInvites, setRefreshInvites] = useState(0);
    const [accessStatus, setAccessStatus] = useState<"checking" | "allowed" | "denied" | "invited">("checking");

    const [isSubmittingItem, setIsSubmittingItem] = useState(false);
    const [localId, setLocalId] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState<number>(Date.now());
    const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
    const [newItem, setNewItem] = useState({ description: "", amount: "" });
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        // Get local identification for guests
        const adminId = localStorage.getItem(`rata_admin_${groupId}`);
        if (adminId) {
            setLocalId(adminId);
            return;
        }

        const rataGroups = JSON.parse(localStorage.getItem('rata_groups') || '{}');
        if (rataGroups[groupId]?.userId) {
            setLocalId(rataGroups[groupId].userId);
        }
    }, [groupId]);

    const currentUserId = user?.uid || localId;

    const handleAddItem = async (expenseId: string) => {
        if (!newItem.description || !newItem.amount || isSubmittingItem) return;

        setIsSubmittingItem(true);
        const res = await addItemToExpense(groupId, expenseId, {
            description: newItem.description,
            amount: parseFloat(newItem.amount)
        });

        if (res.success) {
            setAddingItemTo(null);
            setNewItem({ description: "", amount: "" });
        } else {
            alert(res.error || "Error al agregar ítem");
        }
        setIsSubmittingItem(false);
    };

    const renderAddItemForm = (expenseId: string) => {
        if (addingItemTo !== expenseId) return (
            <button
                onClick={() => setAddingItemTo(expenseId)}
                className="flex items-center gap-1.5 text-[9px] text-zinc-500 hover:text-emerald-500 transition-colors mt-1 font-bold ml-4"
            >
                <Plus className="w-2.5 h-2.5" />
                AGREGAR ÍTEM
            </button>
        );

        return (
            <div className="mt-2 ml-4 p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/50 space-y-2 animate-in fade-in slide-in-from-top-1">
                <div className="grid grid-cols-[1fr,80px,auto] gap-2">
                    <input
                        type="text"
                        placeholder="Descripción"
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        className="bg-black/40 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
                    />
                    <input
                        type="number"
                        placeholder="$ 0"
                        value={newItem.amount}
                        onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                        className="bg-black/40 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 outline-none focus:border-emerald-500/50 font-mono"
                    />
                    <div className="flex gap-1">
                        <button
                            onClick={() => handleAddItem(expenseId)}
                            disabled={isSubmittingItem || !newItem.description || !newItem.amount}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded disabled:opacity-50 transition-colors flex items-center justify-center min-w-[24px]"
                        >
                            {isSubmittingItem ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        </button>
                        <button
                            onClick={() => { setAddingItemTo(null); setNewItem({ description: "", amount: "" }) }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 p-1 rounded transition-colors"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "groups", groupId), (doc) => {
            if (doc.exists()) {
                setGroup({ id: doc.id, ...doc.data() } as Group);
            }
            setLoading(false);
        });

        return () => unsub();
    }, [groupId]);

    // Universal Timer Ticker
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Check if I am admin (payer/creator)
    const isAdmin = currentUserId && (currentUserId === group?.payerId || (group as any)?.createdBy === currentUserId);

    useEffect(() => {
        if (loading || !group) return;
        const currentId = user?.uid || localId;

        if (!currentId) {
            setAccessStatus("denied");
            return;
        }

        const isMember = group.memberIds?.includes(currentId) || group.members.some((m: any) => m.id === currentId);
        const isCreator = group.payerId === currentId || (group as any).createdBy === currentId;

        if (isMember || isCreator) {
            setAccessStatus("allowed");
        } else {
            const q = query(
                collection(db, "invitations"),
                where("groupId", "==", groupId),
                where("toUid", "==", currentId)
            );
            getDocs(q).then((snapshot) => {
                if (!snapshot.empty) {
                    // There could be multiple invitations, find the most relevant one
                    const pendingDoc = snapshot.docs.find(d => d.data().status === 'pending');
                    const acceptedDoc = snapshot.docs.find(d => d.data().status === 'accepted');

                    if (pendingDoc) {
                        setAccessStatus("invited");
                    } else if (acceptedDoc) {
                        // They accepted it recently, the group doc is just lagging. Prevent "denied" flash.
                        setAccessStatus("allowed");
                    } else {
                        setAccessStatus("denied");
                    }
                } else {
                    setAccessStatus("denied");
                }
            });
        }
    }, [group, user, localId, groupId, loading]);

    async function handleTogglePayment(memberId: string, currentStatus: string | undefined) {
        if (!isAdmin) return;
        const isPaid = currentStatus === 'paid';
        await togglePaymentStatus(groupId, memberId, !isPaid);
    }

    async function handleUploadProof(event: React.ChangeEvent<HTMLInputElement>, memberId: string) {
        const file = event.target.files?.[0];
        if (!file || !currentUserId) return;

        // Limits
        if (file.size > 5 * 1024 * 1024) {
            alert("El archivo es muy grande (Max 5MB)");
            return;
        }

        setUploadingInfo({ memberId, uploading: true });

        try {
            const storageRef = ref(storage, `receipts/${groupId}/${memberId}_${Date.now()}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            await uploadPaymentProof(groupId, memberId, url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Error al subir imagen");
        } finally {
            setUploadingInfo(null);
        }
    }

    async function handleVerify(approved: boolean) {
        if (!verificationModal) return;
        await verifyPaymentProof(
            groupId,
            verificationModal.memberId,
            approved,
            verificationModal.expenseId || 'initial'
        );
    }

    async function handleRemoveMember(memberId: string, memberName: string) {
        if (!isAdmin || !currentUserId) return;
        setConfirmModal({
            isOpen: true,
            title: "Eliminar Miembro",
            description: `¿Estás seguro de que deseas eliminar a ${memberName} del grupo?\n\nEsta acción no se puede deshacer.`,
            onConfirm: async () => {
                const res = await removeMember(groupId, memberId, currentUserId);
                if (!res.success) {
                    alert(res.error || "Error al eliminar miembro");
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }

    const handleDeleteExpense = async () => {
        if (!user || !deleteExpenseModal.expenseId) return;

        try {
            const res = await deleteExpense(groupId, deleteExpenseModal.expenseId, user.uid);
            if (!res.success) {
                alert("Error: " + res.error);
            }
        } catch (e) {
            console.error(e);
            alert("Ocurrió un error al intentar eliminar el gasto.");
        } finally {
            setDeleteExpenseModal({ isOpen: false, expenseId: "" });
        }
    };

    const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
    useEffect(() => {
        const q = query(
            collection(db, "invitations"),
            where("groupId", "==", groupId),
            where("status", "==", "pending")
        );
        const unsub = onSnapshot(q, (snapshot) => {
            setPendingInvitesCount(snapshot.size);
        });
        return () => unsub();
    }, [groupId]);

    // Confetti Effect for All Paid AND Admin Receipt Uploaded
    useEffect(() => {
        if (!group) return;
        const isAllMembersPaid = group.members
            .filter(m => m.id !== group.payerId)
            .every(m => m.status === 'paid');

        // Confetti only if everyone paid AND Admin uploaded the final receipt
        const isFullyCompleted = isAllMembersPaid && (group as any).expenseReceiptUrl;

        if (isFullyCompleted && group.members.length > 1) { // Ensure actionable group
            import("canvas-confetti").then((confetti) => {
                const duration = 3 * 1000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

                const random = (min: number, max: number) => Math.random() * (max - min) + min;

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);
                    // since particles fall down, start a bit higher than random
                    confetti.default({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
                    confetti.default({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
                }, 250);
            });
        }
    }, [group]);

    if (loading || accessStatus === "checking") return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-emerald-500" /></div>;
    if (!group) return <div className="flex justify-center p-12">Grupo no encontrado</div>;

    if (accessStatus === "denied") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white">Acceso Denegado</h2>
                <p className="text-zinc-400">No eres miembro de este grupo ni tienes una invitación pendiente.</p>
                <Link href="/" className="mt-4 px-6 py-2 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors">
                    Volver al Inicio
                </Link>
            </div>
        );
    }

    if (accessStatus === "invited") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white">Invitación Pendiente</h2>
                <p className="text-zinc-400">Tienes una invitación pendiente para unirte a este grupo.</p>
                <Link href="/" className="mt-4 px-6 py-2 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
                    Ir al Inicio para Aceptar
                </Link>
            </div>
        );
    }

    // Ranking Logic
    const visibleMembers = group.members; // Show everyone including payer

    // Helper to get member status for a specific expense
    const getMemberStatus = (member: Member, expenseId: string) => {
        if (member.payments?.[expenseId]) {
            return member.payments[expenseId];
        }
        return { status: 'pending' as const };
    };

    // Debtors are those who haven't paid at least one group expense
    const pendingMembers = group.members.filter(m => {
        if (m.id === group.payerId) return false;
        if (group.expenses && group.expenses.length > 0) {
            return group.expenses.some(e => {
                // If the expense was created by this member, they don't owe it to themselves
                if (e.payerId === m.id) return false;
                return getMemberStatus(m, e.id).status !== 'paid';
            });
        }
        return m.status !== 'paid';
    });

    // Ranking Logic (Velocistas)
    // A member is a velocista if they are not in pendingMembers (meaning they paid everything they owe)
    // Their ranking time is the LAST time they paid an expense.
    const paidMembers = group.members
        .filter(m => {
            if (m.id === group.payerId) return false; // Payer doesn't owe anything
            // Must have at least one expense to pay
            const hasExpensesToPay = (group.expenses || []).some(e => e.payerId !== m.id);
            if (!hasExpensesToPay) return false;
            // Must not be in debtors list
            return !pendingMembers.some(pm => pm.id === m.id);
        })
        .map(m => {
            // Find the latest paidAt date across all their payments
            let latestPaidAt: string | null = m.paidAt || null;
            if (group.expenses && group.expenses.length > 0) {
                group.expenses.forEach(e => {
                    if (e.payerId === m.id) return;
                    const statusInfo = getMemberStatus(m, e.id);
                    if (statusInfo.status === 'paid' && statusInfo.paidAt) {
                        if (!latestPaidAt || new Date(statusInfo.paidAt).getTime() > new Date(latestPaidAt).getTime()) {
                            latestPaidAt = statusInfo.paidAt;
                        }
                    }
                });
            }
            return {
                ...m,
                _calculatedPaidAt: latestPaidAt
            };
        })
        .filter(m => m._calculatedPaidAt !== null)
        .sort((a, b) => new Date(a._calculatedPaidAt!).getTime() - new Date(b._calculatedPaidAt!).getTime());





    // Check if any expense is globally expired
    const isExpired = (group.expenses || []).some(e => e.deadlineDate && new Date(e.deadlineDate).getTime() < currentTime);

    // Debtors appear immediately, not just after deadline
    const debtors = pendingMembers;

    // Synthesis of all expenses into a unified list
    const allExpenses = [
        ...(group.expenses || [])
    ].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    // Calculate pending approvals count
    const pendingApprovalsCount = group.members.reduce((count, member) => {
        if (member.id === group.payerId) return count; // Payer doesn't need approval
        if (group.expenses && group.expenses.length > 0) {
            return count + group.expenses.filter(e => {
                if (e.payerId === member.id) return false; // Member is payer for this expense
                return getMemberStatus(member, e.id).status === 'pending_approval';
            }).length;
        }
        return count + (member.status === 'pending_approval' ? 1 : 0);
    }, 0);

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section with Gradient */}
            <div className="relative -mx-6 -mt-6 p-8 pb-12 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-zinc-950 z-0"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px]"></div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Volver</span>
                        </Link>
                        {hasMounted && isAdmin && (
                            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-purple-500/30">
                                Administrador
                            </span>
                        )}
                    </div>

                    <div>
                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl mb-2">{group.name}</h1>
                        {group.description && (
                            <p className="text-zinc-400 text-lg max-w-2xl">{group.description}</p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-bold text-white">{group.members.length}</span>
                            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Miembros</span>
                            {hasMounted && isAdmin && (
                                <button
                                    onClick={() => setIsInviteModalOpen(true)}
                                    className="ml-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-black px-2 py-1 rounded-md border border-emerald-500/20 transition-all active:scale-95"
                                >
                                    INVITAR
                                </button>
                            )}
                        </div>

                        {/* Removed Top-Level Timer Badge */}
                    </div>
                </div>
            </div>

            {/* Pending Members Warning Banner */}
            {pendingInvitesCount > 0 && (
                <div className="mx-0 mb-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3 relative z-20 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-500 shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-yellow-500 font-bold text-sm uppercase tracking-wide mb-1">
                            Faltan {pendingInvitesCount} invitados por unirse
                        </h3>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                            Te recomendamos <strong>esperar a que todos acepten</strong> la invitación antes de realizar tu pago, para asegurar que el monto final sea correcto.
                        </p>
                    </div>
                </div>
            )}

            {/* Memories Navigation - Temporarily disabled by request */}
            {/*
            <div className="mb-6">
                <Link
                    href={`/group/${groupId}/memories`}
                    className="w-full py-4 rounded-xl text-md font-black bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white transition-all flex items-center justify-center gap-3 shadow-[0_8px_30px_rgb(16,185,129,0.2)] hover:shadow-[0_8px_40px_rgb(16,185,129,0.3)] active:scale-[0.98] group border border-white/20"
                >
                    <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Muro de Recuerdos
                    <ChevronRight className="w-5 h-5 text-emerald-100 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
            */}

            {/* Main Content Info */}
            <div className="grid lg:grid-cols-3 gap-8 relative z-10">

                {/* Left Column: Main Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Pending Approvals Alert for Admin ONLY in Summary Tab */}
                    {pendingApprovalsCount > 0 && isAdmin && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between mb-6 shadow-lg shadow-emerald-500/5 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Validaciones Pendientes</p>
                                    <p className="text-zinc-400 text-xs">Hay {pendingApprovalsCount} comprobante{pendingApprovalsCount !== 1 ? 's' : ''} por revisar.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Action Bar (only in summary tab) */}
                    {isAdmin && (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl mb-6 flex flex-wrap gap-2 justify-center lg:justify-start">
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-2 px-4 rounded-xl font-bold transition-colors border border-emerald-500/20 text-xs flex-1 sm:flex-none justify-center"
                            >
                                <Users className="w-4 h-4" /> INVITAR
                            </button>
                            <Link href={`/group/${groupId}/edit`} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-xl font-bold transition-colors border border-zinc-700 text-xs flex-1 sm:flex-none justify-center">
                                <Edit className="w-4 h-4" /> EDITAR
                            </Link>
                        </div>
                    )}

                    {/* Expenses List Section */}
                    <div className="space-y-8">
                        {allExpenses.length === 0 ? (
                            <div className="bg-zinc-900/30 border border-zinc-800 border-dashed p-12 rounded-3xl text-center">
                                <List className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500 font-medium">No hay gastos registrados aún</p>
                            </div>
                        ) : (
                            allExpenses.map((expense) => {
                                const sectionId = expense.id;
                                const isSectionPool = expense.type === 'multiple';
                                const sectionAmount = expense.amount || 0;
                                const perPerson = group.members.length > 0 ? Math.ceil(sectionAmount / group.members.length) : 0;
                                const isFullyPaid = group.members.every(m => getMemberStatus(m, sectionId).status === 'paid');

                                let expenseTimeLeft = "";
                                let expenseIsExpired = false;

                                if (expense.deadlineDate) {
                                    const deadline = new Date(expense.deadlineDate).getTime();
                                    const distance = deadline - currentTime;

                                    if (distance < 0) {
                                        expenseIsExpired = true;
                                        expenseTimeLeft = "TIEMPO AGOTADO";
                                    } else {
                                        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                                        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                                        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                                        const parts = [];
                                        if (days > 0) parts.push(`${days}d`);
                                        parts.push(`${hours.toString().padStart(2, '0')}h`);
                                        parts.push(`${minutes.toString().padStart(2, '0')}m`);
                                        parts.push(`${seconds.toString().padStart(2, '0')}s`);

                                        expenseTimeLeft = parts.join(' : ');
                                    }
                                }

                                return (
                                    <div key={sectionId} className="group/card animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className={cn(
                                            "border rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-500",
                                            isFullyPaid
                                                ? "bg-emerald-950/20 border-emerald-500/30 shadow-[0_8px_30px_rgb(16,185,129,0.1)]"
                                                : "bg-zinc-900/50 border-zinc-800"
                                        )}>
                                            {/* Decorative glow for prominent cards */}
                                            <div className={cn(
                                                "absolute top-0 right-0 w-32 h-32 blur-[50px] pointer-events-none transition-colors",
                                                isFullyPaid ? "bg-emerald-500/20 group-hover/card:bg-emerald-500/30" : "bg-emerald-500/5 group-hover/card:bg-emerald-500/10"
                                            )}></div>

                                            {/* Expense Header Info */}
                                            <div className={cn(
                                                "p-6 border-b",
                                                isFullyPaid ? "bg-emerald-950/30 border-emerald-500/20" : "border-zinc-800/50 bg-zinc-950/20"
                                            )}>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-xl font-black text-white tracking-tight uppercase">{expense.description}</h3>
                                                            {isSectionPool ? (
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black tracking-widest uppercase">Varios</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-black tracking-widest uppercase">Único</span>
                                                            )}
                                                            {isAdmin && sectionId !== 'root' && (
                                                                <button
                                                                    onClick={() => setDeleteExpenseModal({ isOpen: true, expenseId: sectionId })}
                                                                    className="p-1.5 ml-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors hidden group-hover/card:flex active:scale-95"
                                                                    title="Eliminar gasto"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                                            <Clock className="w-3 h-3" />
                                                            {expense.createdAt ? new Date(expense.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-4 bg-black/40 px-5 py-3 rounded-2xl border border-zinc-800/50 backdrop-blur-sm self-start sm:self-center">
                                                        <div className="text-right">
                                                            <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">Total Gasto</p>
                                                            <p className="text-2xl font-black text-white">$ {sectionAmount.toLocaleString()}</p>
                                                        </div>
                                                        <div className="w-[1px] h-8 bg-zinc-800"></div>
                                                        <div>
                                                            <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">C/U Paga</p>
                                                            <p className="text-lg font-bold text-emerald-400">$ {perPerson.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expense Timer Badge */}
                                                {!isFullyPaid && expense.deadlineDate && (
                                                    <div className={cn(
                                                        "mt-4 flex items-center justify-between px-4 py-2 rounded-xl border transition-all",
                                                        expenseIsExpired
                                                            ? "bg-red-500/10 border-red-500/30 text-red-500"
                                                            : "bg-zinc-900 border-zinc-800 text-zinc-300"
                                                    )}>
                                                        <div className="flex items-center gap-2">
                                                            {expenseIsExpired ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                            <span className="text-[10px] uppercase font-black tracking-wider">
                                                                {expenseIsExpired ? "Vencido" : "Tiempo Limite de Pago"}
                                                            </span>
                                                        </div>
                                                        <span className="font-mono text-xs font-bold tracking-widest">{expenseTimeLeft}</span>
                                                    </div>
                                                )}

                                                {/* Sub-items for 'multiple' or if items exist */}
                                                {(expense.items && expense.items.length > 0 || isSectionPool) && (
                                                    <div className="mt-6 space-y-3">
                                                        <div className="bg-zinc-950/40 rounded-2xl p-4 border border-zinc-800/30">
                                                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                <List className="w-3 h-3" /> Desglose de Ítems
                                                            </p>
                                                            <div className="space-y-2">
                                                                {expense.items?.map((item: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-center text-xs group/item">
                                                                        <span className="text-zinc-400 group-hover/item:text-zinc-200 transition-colors">{item.description}</span>
                                                                        <span className="font-mono text-zinc-500">$ {item.amount?.toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                                {isSectionPool && renderAddItemForm(expense.id)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Payment Grid for this expense */}
                                            <div className={cn(
                                                "p-6 border-t",
                                                isFullyPaid ? "bg-emerald-950/10 border-emerald-500/20" : "bg-zinc-900/40 border-zinc-800/80"
                                            )}>
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-zinc-800/50">
                                                    <div className="space-y-1">
                                                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                            <ShieldCheck className="w-3.5 h-3.5" /> GESTIÓN DE PAGOS
                                                        </h4>
                                                        <div className="flex items-center gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/50 shadow-inner">
                                                            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold border border-purple-500/20">
                                                                <Wallet className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">Pagar a:</p>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-white font-bold text-sm tracking-tight">{group.payerName}</p>
                                                                    <p className="text-emerald-400 font-mono text-xs font-bold bg-emerald-500/10 px-1.5 rounded">{group.alias}</p>
                                                                    <CopyButton text={group.alias} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {currentUserId !== expense.payerId && (
                                                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl max-w-xs shadow-sm shadow-emerald-500/5">
                                                            <p className="text-[10px] text-emerald-400 font-black mb-1.5 uppercase tracking-widest flex items-center gap-2">
                                                                <CheckCircle2 className="w-3 h-3" /> Instrucciones
                                                            </p>
                                                            <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
                                                                Hacé una <span className="text-white font-bold underline decoration-emerald-500/50">captura de tu transferencia</span> y subí el comprobante aquí abajo.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {group.members.map((member) => {
                                                        const statusInfo = getMemberStatus(member, sectionId);
                                                        const isPaid = statusInfo.status === 'paid';
                                                        const isPendingApproval = statusInfo.status === 'pending_approval';
                                                        const isSelf = member.id === currentUserId;
                                                        const isPayer = member.id === expense.payerId;

                                                        return (
                                                            <div key={member.id} className={cn(
                                                                "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                                                                isPaid
                                                                    ? "bg-emerald-500/5 border-emerald-500/20"
                                                                    : isPendingApproval
                                                                        ? "bg-amber-500/5 border-amber-500/20"
                                                                        : (isAdmin && !isPayer)
                                                                            ? "bg-red-950/10 border-red-900/30 hover:border-red-500/30"
                                                                            : "bg-zinc-950/30 border-zinc-800/50 hover:border-zinc-700"
                                                            )}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border",
                                                                        isPaid
                                                                            ? "bg-emerald-500 text-black border-emerald-400"
                                                                            : (isAdmin && !isPayer && !isPendingApproval)
                                                                                ? "bg-red-950/50 text-red-500 border-red-900/50"
                                                                                : "bg-zinc-800 text-zinc-500 border-zinc-700"
                                                                    )}>
                                                                        {member.name.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className={cn("text-xs font-bold", isSelf ? "text-white" : (isAdmin && !isPayer && !isPaid && !isPendingApproval ? "text-red-400/90" : "text-zinc-400"))}>
                                                                            {member.name} {isSelf && "(Vos)"}
                                                                        </p>
                                                                        {isPayer && (
                                                                            <p className="text-[8px] text-purple-400 font-black uppercase tracking-tighter">Admin Gasto</p>
                                                                        )}
                                                                        {isPaid && (
                                                                            <p className="text-[8px] text-emerald-500 font-black uppercase flex items-center gap-1 mt-0.5">
                                                                                <Check className="w-2 h-2" /> PAGADO
                                                                            </p>
                                                                        )}
                                                                        {isPendingApproval && (
                                                                            <p className="text-[8px] text-amber-500 font-black uppercase flex items-center gap-1 mt-0.5 animate-pulse">
                                                                                <Clock className="w-2 h-2" /> PENDIENTE DE VALIDACIÓN
                                                                            </p>
                                                                        )}
                                                                        {!isPaid && !isPendingApproval && !isPayer && isAdmin && (
                                                                            <p className="text-[8px] text-red-500/80 font-black uppercase flex items-center gap-1 mt-0.5">
                                                                                <AlertTriangle className="w-2 h-2" /> FALTA PAGAR
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {uploadSuccess?.memberId === member.id && uploadSuccess?.expenseId === sectionId ? (
                                                                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-300 shadow-lg shadow-emerald-500/10">
                                                                            <CheckCircle2 className="w-4 h-4" />
                                                                            <span className="text-[10px] font-black uppercase tracking-wider">¡Enviado!</span>
                                                                        </div>
                                                                    ) : isSelf && !isPaid && !isPendingApproval && !isPayer && (
                                                                        <label className="cursor-pointer bg-emerald-600/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 active:scale-95 group/upload shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 relative overflow-hidden">
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                className="hidden"
                                                                                onChange={async (e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (!file || !currentUserId) return;
                                                                                    setUploadingInfo({ memberId: member.id, uploading: true });
                                                                                    try {
                                                                                        const storageRef = ref(storage, `receipts/${groupId}/${member.id}_${sectionId}_${Date.now()}`);
                                                                                        await uploadBytes(storageRef, file);
                                                                                        const url = await getDownloadURL(storageRef);
                                                                                        await uploadPaymentProof(groupId, member.id, url, sectionId);

                                                                                        setUploadSuccess({ memberId: member.id, expenseId: sectionId });
                                                                                        confetti({
                                                                                            particleCount: 150,
                                                                                            spread: 70,
                                                                                            origin: { y: 0.8 },
                                                                                            colors: ['#10B981', '#34D399', '#059669']
                                                                                        });
                                                                                        setTimeout(() => setUploadSuccess(null), 3000);
                                                                                    } catch (error) {
                                                                                        console.error(error);
                                                                                        alert("Error al subir imagen");
                                                                                    } finally {
                                                                                        setUploadingInfo(null);
                                                                                    }
                                                                                }}
                                                                            />
                                                                            {uploadingInfo?.memberId === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 group-hover/upload:-translate-y-1 transition-transform" />}
                                                                            <span className="text-[10px] font-black uppercase tracking-wider">Subir Comprobante</span>
                                                                        </label>
                                                                    )}

                                                                    {isAdmin && !isPayer && (
                                                                        <div className="flex items-center gap-2">
                                                                            {isPendingApproval && (
                                                                                <button
                                                                                    onClick={() => setVerificationModal({
                                                                                        isOpen: true,
                                                                                        receiptUrl: statusInfo.receiptUrl || "",
                                                                                        memberName: member.name,
                                                                                        memberId: member.id,
                                                                                        expenseId: sectionId
                                                                                    })}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-[10px] rounded-lg transition-transform active:scale-95 shadow-lg shadow-amber-500/20"
                                                                                >
                                                                                    <Eye className="w-3.5 h-3.5" /> Validar Pago
                                                                                </button>
                                                                            )}
                                                                            {(!isPendingApproval && isPaid) && (
                                                                                <button
                                                                                    onClick={() => togglePaymentStatus(groupId, member.id, !isPaid, sectionId)}
                                                                                    className={cn(
                                                                                        "p-1.5 rounded-lg transition-all border",
                                                                                        isPaid
                                                                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                                                                                            : "bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/10"
                                                                                    )}
                                                                                    title="Desmarcar pago"
                                                                                >
                                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>


                    {/* Payment Info Card - General Payer Info */}
                    <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Se le paga a:</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold border border-purple-500/30">
                                    {group.payerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg leading-tight">{group.payerName}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-emerald-400 font-mono text-sm">{group.alias}</p>
                                        <CopyButton text={group.alias} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Invitations Management (Admin Only) */}
                    {hasMounted && isAdmin && (
                        <PendingInvitationsList groupId={groupId} currentUserId={user?.uid} refreshTrigger={refreshInvites} />
                    )}
                </div>

                {/* Right Column: Rankings & Actions */}
                <div className="space-y-6">

                    {/* Quick Places Search */}
                    <PlacesRecommendations />

                    {/* Velocistas Card */}
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trophy className="w-24 h-24 text-yellow-500 rotate-12" />
                        </div>
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                            </div>
                            <h2 className="font-bold text-lg text-white">Velocistas</h2>
                        </div>

                        <div className="space-y-3 relative z-10">
                            {paidMembers.length > 0 ? (
                                paidMembers.slice(0, 3).map((member, index) => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl border border-white/5">
                                        <div className={cn(
                                            "font-black text-lg w-6 text-center",
                                            index === 0 ? "text-yellow-400" : index === 1 ? "text-zinc-400" : "text-orange-700"
                                        )}>#{index + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{member.name}</p>
                                            <p className="text-zinc-500 font-mono">
                                                {(() => {
                                                    // _calculatedPaidAt is our new metric
                                                    const dStr = (member as any)._calculatedPaidAt;
                                                    const d = dStr && dStr.toDate ? dStr.toDate() : new Date(dStr);
                                                    return d.toLocaleString();
                                                })()}
                                            </p>
                                        </div>
                                        {isAdmin && currentUserId !== member.id && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id, member.name)}
                                                className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-zinc-600 italic text-sm">
                                    ¡Sé el primero en pagar!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Deudores Card */}
                    <div className="bg-gradient-to-br from-red-950/20 to-zinc-950 p-6 rounded-3xl border border-red-900/20 shadow-xl relative overflow-hidden">
                        <div className="absolute -bottom-4 -right-4 opacity-5">
                            <Turtle className="w-32 h-32 text-red-500" />
                        </div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <Turtle className="w-5 h-5 text-red-500" />
                            </div>
                            <h2 className="font-bold text-lg text-white">Deudores</h2>
                        </div>

                        <div className="relative z-10">
                            {debtors.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {debtors.map((member) => (
                                            <div key={member.id} className="flex items-center gap-1 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold group/debtor">
                                                <span>{member.name}</span>
                                                {isAdmin && currentUserId !== member.id && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.id, member.name)}
                                                        className="p-0.5 ml-1 text-red-400 hover:text-red-300 opacity-50 group-hover/debtor:opacity-100 transition-opacity"
                                                    >
                                                        <XIcon className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                                        <p className="text-[10px] text-red-300 italic text-center">
                                            "El último paga la próxima ronda." 🍻
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-zinc-600 font-medium flex flex-col items-center gap-2">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    <span className="text-emerald-500">¡Todos están al día! 🎉</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="sticky bottom-6 z-30">
                    <button
                        onClick={() => {
                            router.push(`/create?groupId=${groupId}`);
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:shadow-[0_10px_50px_rgba(16,185,129,0.5)] active:scale-[0.98] border-t border-white/20"
                    >
                        <Plus className="w-6 h-6" />
                        <span className="text-lg uppercase tracking-wide">Nuevo Gasto</span>
                    </button>
                </div>
            )}

            {isInviteModalOpen && (
                <InviteMemberModal
                    groupId={groupId}
                    groupName={group.name}
                    onClose={() => setIsInviteModalOpen(false)}
                    onInviteSent={() => setRefreshInvites(prev => prev + 1)}
                />
            )}

            <ConfirmationModal
                isOpen={deleteExpenseModal.isOpen}
                title="⚠️ Eliminar gasto"
                description="¿Estás seguro/a que deseas eliminar este gasto de la lista? Se removerá para todos los miembros."
                confirmText="Sí, eliminar de todos modos"
                cancelText="Cancelar"
                isDanger={true}
                onConfirm={handleDeleteExpense}
                onCancel={() => setDeleteExpenseModal({ isOpen: false, expenseId: "" })}
            />

            {verificationModal && (
                <PaymentVerificationModal
                    isOpen={verificationModal.isOpen}
                    receiptUrl={verificationModal.receiptUrl}
                    memberName={verificationModal.memberName}
                    onClose={() => setVerificationModal(null)}
                    onVerify={handleVerify}
                />
            )}

            {/* Leave Group Action */}
            <div className="flex justify-center mt-12 mb-8">
                <button
                    onClick={() => {
                        const isCreator = group.payerId === user?.uid || (group as any).createdBy === user?.uid;

                        setConfirmModal({
                            isOpen: true,
                            title: isCreator ? "⚠️ Eliminar Grupo" : "Abandonar Grupo",
                            description: isCreator
                                ? "Eres el administrador de este grupo.\n\nSi sales, el grupo se eliminará permanentemente para todos los miembros y se perderán los registros.\n\n¿Estás seguro de que deseas continuar?"
                                : "¿Deseas abandonar este grupo? Dejarás de tener acceso a este gasto y a su historial.",
                            onConfirm: async () => {
                                if (!user) return;
                                const res = await leaveGroup(groupId, user.uid);
                                if (res.success) {
                                    router.push("/");
                                } else {
                                    alert("No se pudo procesar la solicitud.");
                                }
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                            }
                        });
                    }}
                    className="flex items-center gap-2 text-zinc-600 hover:text-red-500 transition-colors text-sm font-medium px-4 py-2 hover:bg-red-500/10 rounded-lg"
                >
                    <LogOut className="w-4 h-4" />
                    {isAdmin ? "Abandonar y Eliminar Grupo" : "Salir del Grupo"}
                </button>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmText={isAdmin ? "Eliminar para siempre" : "Salir del grupo"}
                cancelText="Cancelar"
                isDanger={true}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
            title="Copiar Alias"
        >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
    );
}
