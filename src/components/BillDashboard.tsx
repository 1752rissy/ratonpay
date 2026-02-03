"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PizzaVisualizer from "./PizzaVisualizer";
import { Share2, CheckCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPaymentPreference } from "@/app/actions/create-preference";

interface Friend {
    id: string;
    name: string;
    status: 'pending' | 'paid';
    amount: number;
    paymentLink?: string;
}

interface Bill {
    description: string;
    totalAmount: number;
    friendsCount: number;
    amountPerPerson: number;
    friends: Friend[];
    status: 'active' | 'completed';
}

export default function BillDashboard({ billId }: { billId: string }) {
    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "bills", billId), (doc) => {
            if (doc.exists()) {
                setBill(doc.data() as Bill);
            }
            setLoading(false);
        });

        return () => unsub();
    }, [billId]);

    if (loading) return <div className="flex justify-center p-12">Loading...</div>;
    if (!bill) return <div className="flex justify-center p-12">Bill not found</div>;

    const paidCount = bill.friends.filter(f => f.status === 'paid').length;
    const isCompleted = paidCount === bill.friends.length;

    const shareText = `Hola! Tenemos que pagar $${bill.amountPerPerson} cada uno por "${bill.description}". Entrá acá para pagar tu parte: ${window.location.href}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">{bill.description}</h1>
                <div className="text-slate-500">
                    Total: <span className="font-mono font-bold text-slate-900">${bill.totalAmount}</span>
                </div>
            </div>

            <PizzaVisualizer friends={bill.friends} />

            {isCompleted && (
                <div className="bg-green-100 text-green-800 p-4 rounded-xl text-center font-bold animate-bounce">
                    🎉 ¡Todos pagaron! La cuenta está cerrada.
                </div>
            )}

            <div className="grid gap-3">
                {bill.friends.map((friend, i) => (
                    <div key={friend.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white",
                                friend.status === 'paid' ? "bg-green-500" : "bg-slate-300"
                            )}>
                                {friend.status === 'paid' ? <CheckCircle className="w-5 h-5" /> : (i + 1)}
                            </div>
                            <div>
                                <p className="font-medium">{friend.name}</p>
                                <p className="text-xs text-slate-500">${friend.amount}</p>
                            </div>
                        </div>

                        {friend.status === 'pending' && (
                            <button

                                className="text-xs bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                                onClick={async () => {
                                    const btn = document.getElementById(`btn-${friend.id}`);
                                    if (btn) btn.innerHTML = "Cargando...";
                                    try {
                                        const result = await createPaymentPreference(
                                            billId,
                                            friend.id,
                                            friend.amount,
                                            bill.description
                                        );

                                        if (result.url) {
                                            window.location.href = result.url;
                                        } else {
                                            alert("Error al generar pago");
                                            if (btn) btn.innerHTML = "Pagar";
                                        }
                                    } catch (e) {
                                        alert("Error de conexión");
                                        if (btn) btn.innerHTML = "Pagar";
                                    }
                                }}
                                id={`btn-${friend.id}`}
                            >
                                Pagar
                            </button>
                        )}
                        {friend.status === 'paid' && (
                            <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Pagado
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl text-center transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
                <Share2 className="w-5 h-5" />
                Compartir por WhatsApp
            </a>
        </div>
    );
}
