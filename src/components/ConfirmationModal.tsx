"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmationModal({
    isOpen,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDanger = false,
    onConfirm,
    onCancel
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            isDanger ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                        )}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-950 px-6 py-4 flex gap-3 justify-end border-t border-zinc-800">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={cn(
                            "px-4 py-2 text-sm font-bold text-white rounded-lg shadow-lg active:scale-95 transition-all",
                            isDanger
                                ? "bg-red-600 hover:bg-red-500 shadow-red-500/20"
                                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
