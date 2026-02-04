"use client";

import { Check, X, Loader2, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

interface PaymentVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptUrl: string;
    memberName: string;
    onVerify: (approved: boolean) => Promise<void>;
}

export default function PaymentVerificationModal({
    isOpen,
    onClose,
    receiptUrl,
    memberName,
    onVerify
}: PaymentVerificationModalProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleApprove = async () => {
        setLoading(true);
        // Trigger Festivity
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#34D399', '#059669'] // Emerald shades
        });

        await onVerify(true);
        setLoading(false);
        onClose();
    };

    const handleReject = async () => {
        if (!confirm("¿Rechazar este comprobante? El usuario volverá a estado 'Pendiente'.")) return;
        setLoading(true);
        await onVerify(false);
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <div>
                        <h3 className="text-lg font-bold text-white">Verificar Pago</h3>
                        <p className="text-xs text-zinc-500">De <span className="text-emerald-400 font-bold">{memberName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Receipt Image Area */}
                <div className="flex-1 overflow-auto bg-black relative min-h-[300px] flex items-center justify-center p-4">
                    {receiptUrl ? (
                        <div className="relative w-full h-full min-h-[400px]">
                            <Image
                                src={receiptUrl}
                                alt="Comprobante"
                                fill
                                className="object-contain"
                            />
                            <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-4 right-4 bg-zinc-900/80 hover:bg-zinc-900 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-2 backdrop-blur-sm border border-zinc-700 transition-colors"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Abrir Original
                            </a>
                        </div>
                    ) : (
                        <div className="text-zinc-500 flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                <X className="w-6 h-6" />
                            </div>
                            <p>No se pudo cargar la imagen</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900 grid grid-cols-2 gap-4">
                    <button
                        onClick={handleReject}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 border border-transparent transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Rechazar"}
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Check className="w-4 h-4" /> Aprobar</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
