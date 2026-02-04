"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Turtle, X } from "lucide-react";

export default function WelcomeRataCard() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has seen this before
        const hasSeen = localStorage.getItem("rata_welcome_seen");
        if (!hasSeen) {
            // Delay slightly for effect
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("rata_welcome_seen", "true");
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 z-50 pointer-events-none"
                >
                    <div className="bg-zinc-900/90 backdrop-blur-xl border border-emerald-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden pointer-events-auto">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 shrink-0">
                                <Turtle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">¡Bienvenido! 🐀</h3>
                                <p className="text-zinc-300 text-sm leading-relaxed">
                                    <span className="font-bold text-emerald-400">Paga</span>,
                                    subí el comprobante y...
                                    <br />
                                    <span className="italic font-bold text-white">¡No seas rata!</span>
                                </p>
                                <button
                                    onClick={handleDismiss}
                                    className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    LISTO, ENTENDIDO
                                </button>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
