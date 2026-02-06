"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, UserPlus, Users, Plus, ArrowLeft, Clock, AlertTriangle, AlertCircle, FileText, CheckCircle2, DollarSign, Trophy, Turtle, LogOut, Upload, Eye, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import InviteMemberModal from "./InviteMemberModal";
import ConfirmationModal from "./ConfirmationModal";
import PaymentVerificationModal from "./PaymentVerificationModal";
import PendingInvitationsList from "./PendingInvitationsList";
import { useAuth } from "@/context/AuthContext";
import { togglePaymentStatus, leaveGroup, uploadPaymentProof, verifyPaymentProof } from "@/app/actions/invitations";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface Member {
    id: string;
    name: string;
    joinedAt: any;
    status?: 'paid' | 'pending' | 'pending_approval';
    paidAt?: string;
    receiptUrl?: string;
}

interface Expense {
    id: string;
    description: string;
    amount: number;
    payerId: string;
    createdAt: string;
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
    expenseReceiptUrl?: string;
    status?: string;
    expenses?: Expense[];
    amount: number; // Ensure amount is defined
}

export default function GroupDashboard({ groupId }: { groupId: string }) {
    // ... existing state ...

    // ... effects ...

    // ... existing renders ...

    {
        (group as any).amount > 0 && (
            <div className="col-span-2 border-t border-zinc-800 pt-4 mt-2 mb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-0.5">Monto Total</p>
                        <p className="text-3xl font-black text-white tracking-tight">
                            $ {(group as any).amount.toLocaleString()}
                        </p>
                    </div>
                    {group.members.length > 0 && (
                        <div className="text-right">
                            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-0.5">C/U Debe Pagar</p>
                            <div className="flex items-center justify-end gap-1 text-emerald-400">
                                <span className="text-xl font-bold font-mono">
                                    $ {Math.ceil((group as any).amount / group.members.length).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-1">
                                (Dividido entre {group.members.length} personas)
                            </p>
                        </div>
                    )}
                </div>

                {/* Expenses List */}
                {group.expenses && group.expenses.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Detalle de Gastos</p>
                        <div className="bg-zinc-950/30 rounded-lg p-2 space-y-2">
                            {group.expenses.map((expense) => (
                                <div key={expense.id} className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-1 last:border-0 last:pb-0">
                                    <span className="text-zinc-300">{expense.description}</span>
                                    <span className="font-mono text-zinc-400">$ {expense.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    {/* Creator Actions: Upload Total Receipt */ }
    <div className="col-span-2 flex items-center justify-between border-t border-zinc-800 pt-4">
        {(group as any).expenseReceiptUrl ? (
            <a
                href={(group as any).expenseReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-xs font-bold uppercase tracking-wider px-3 py-2 bg-emerald-900/10 rounded-lg border border-emerald-500/20"
            >
                <FileText className="w-4 h-4" />
                Ver Comprobante del Gasto
            </a>
        ) : (
            <div className="flex items-center gap-2 text-zinc-500 text-xs italic">
                <AlertCircle className="w-4 h-4" />
                <span>Falta comprobante general</span>
            </div>
        )}

        {isAdmin && !(group as any).expenseReceiptUrl && (
            <div className="relative">
                <input
                    disabled={uploadingInfo?.uploading}
                    id="upload-expense-receipt"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setUploadingInfo({ memberId: 'admin-receipt', uploading: true });
                        try {
                            const storageRef = ref(storage, `receipts/${groupId}/EXPENSE_TOTAL_${Date.now()}`);
                            await uploadBytes(storageRef, file);
                            const url = await getDownloadURL(storageRef);

                            const { uploadExpenseReceipt } = await import("@/app/actions/invitations");
                            await uploadExpenseReceipt(groupId, url);
                        } catch (err) {
                            console.error(err);
                            alert("Error al subir comprobante");
                        } finally {
                            setUploadingInfo(null);
                        }
                    }}
                    className="hidden"
                />
                <label
                    htmlFor="upload-expense-receipt"
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg hover:shadow-purple-500/20"
                >
                    {uploadingInfo?.memberId === 'admin-receipt' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Subir Ticket Total
                </label>
            </div>
        )}
    </div>
                        </div >
                    </div >

        {/* Payment Info Card */ }
        < div className = "bg-zinc-900/30 border border-zinc-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4" >
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

                    </div >

        {/* Members List */ }
        < div className = "bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl overflow-hidden" >
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                            <div>
                                <h2 className="font-bold text-xl text-white">Miembros</h2>
                                <p className="text-xs text-zinc-500">Estado de los pagos</p>
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={() => setIsInviteModalOpen(true)}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-zinc-700 hover:border-zinc-600"
                                >
                                    <UserPlus className="w-3 h-3" />
                                    INVITAR
                                </button>
                            )}
                        </div>

                        <div className="divide-y divide-zinc-800/50">
                            {visibleMembers.map((member) => (
                                <div key={member.id} className={cn(
                                    "p-4 flex items-center justify-between transition-colors hover:bg-zinc-800/20",
                                    member.status === 'paid' ? "bg-emerald-900/5" : ""
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shadow-lg",
                                            member.status === 'paid'
                                                ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-emerald-500/20"
                                                : "bg-zinc-800 text-zinc-400 border-zinc-700"
                                        )}>
                                            {member.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("font-bold text-sm", member.id === user?.uid ? "text-white" : "text-zinc-300")}>
                                                    {member.name} {member.id === user?.uid && <span className="text-zinc-500 font-normal">(Vos)</span>}
                                                </span>
                                                {member.id === group.payerId && (
                                                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold uppercase">Admin</span>
                                                )}
                                            </div>
                                            {member.status === 'paid' && member.paidAt ? (
                                                <span className="text-xs text-emerald-500 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Pagado el {new Date(member.paidAt).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-red-400/70 italic">Pendiente de pago</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* User Action: Upload if pending */}
                                        {member.id === user?.uid && member.status !== 'paid' && member.status !== 'pending_approval' && (
                                            <div className="relative">
                                                <input
                                                    disabled={uploadingInfo?.uploading}
                                                    id={`upload-${member.id}`}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleUploadProof(e, member.id)}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor={`upload-${member.id}`}
                                                    className={cn(
                                                        "cursor-pointer flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-300 transition-colors border border-zinc-700",
                                                        uploadingInfo?.memberId === member.id && "opacity-50 pointer-events-none"
                                                    )}
                                                >
                                                    {uploadingInfo?.memberId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                    {uploadingInfo?.memberId === member.id ? "Subiendo..." : "Subir Pago"}
                                                </label>
                                            </div>
                                        )}

                                        {/* Pending Approval Status */}
                                        {member.status === 'pending_approval' && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 animate-pulse">
                                                    Revisión Pendiente
                                                </span>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => setVerificationModal({
                                                            isOpen: true,
                                                            receiptUrl: member.receiptUrl || "",
                                                            memberName: member.name,
                                                            memberId: member.id
                                                        })}
                                                        className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-950 hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-bounce"
                                                        title="Verificar Comprobante"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {isAdmin && member.id !== group.payerId && member.status !== 'pending_approval' && (
                                            <button
                                                onClick={() => handleTogglePayment(member.id, member.status)}
                                                className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                                    member.status === 'paid'
                                                        ? "bg-emerald-500 text-zinc-950 hover:bg-red-500 hover:text-white shadow-lg shadow-emerald-500/20"
                                                        : "bg-zinc-800 text-zinc-400 hover:bg-emerald-500 hover:text-zinc-950 border border-zinc-700 hover:border-emerald-500"
                                                )}
                                                title={member.status === 'paid' ? "Marcar como Pendiente" : "Confirmar Pago (Manual)"}
                                            >
                                                {member.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                            </button>
                                        )}
                                        {!isAdmin && member.status === 'paid' && (
                                            <div className="w-10 h-10 flex items-center justify-center">
                                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div >

        {/* Pending Invitations Management (Admin Only) */ }
    {
        isAdmin && (
            <PendingInvitationsList groupId={groupId} currentUserId={user?.uid} />
        )
    }
                </div >

        {/* Right Column: Rankings & Actions */ }
        < div className = "space-y-6" >

            {/* Velocistas Card */ }
            < div className = "bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-xl relative overflow-hidden group" >
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
                                                {new Date(member.paidAt!).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-zinc-600 italic text-sm">
                                    ¡Sé el primero en pagar!
                                </div>
                            )}
                        </div>
                    </div >

        {/* Deudores Card */ }
        < div className = "bg-gradient-to-br from-red-950/20 to-zinc-950 p-6 rounded-3xl border border-red-900/20 shadow-xl relative overflow-hidden" >
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
                                            <span key={member.id} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold">
                                                {member.name}
                                            </span>
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
                                    {isExpired ? (
                                        <>
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                            <span className="text-emerald-500">¡Todos pagaron a tiempo! 🎉</span>
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-8 h-8 text-zinc-700" />
                                            <span className="text-sm">El plazo aún no ha finalizado.</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div >
                </div >
            </div >

        { isAdmin && (
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
        )
}

{
    isInviteModalOpen && (
        <InviteMemberModal groupId={groupId} onClose={() => setIsInviteModalOpen(false)} />
    )
}

{
    verificationModal && (
        <PaymentVerificationModal
            isOpen={verificationModal.isOpen}
            receiptUrl={verificationModal.receiptUrl}
            memberName={verificationModal.memberName}
            onClose={() => setVerificationModal(null)}
            onVerify={handleVerify}
        />
    )
}

{/* Leave Group Action */ }
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
        </div >
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
