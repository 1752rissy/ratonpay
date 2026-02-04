"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PizzaVisualizer from "./PizzaVisualizer";
import { Share2, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import PaymentModal from "./PaymentModal";

interface Friend {
    id: string;
    name: string;
    status: 'pending' | 'paid';
    amount: number;
    paymentLink?: string;
}

interface Bill {
    description: string;
    alias?: string;
    totalAmount: number;
    friendsCount: number;
    amountPerPerson: number;
    friends: Friend[];
    status: 'active' | 'completed';
}

export default function BillDashboard({ billId }: { billId: string }) {
    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

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
                <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">{bill.description}</h1>
                <div className="text-zinc-400 font-mono">
                    Total: <span className="font-bold text-emerald-400 text-xl">${bill.totalAmount}</span>
                </div>
                {bill.alias && (
                    <div className="bg-zinc-900 border border-zinc-800 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs mt-2 shadow-inner">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider">Alias:</span>
                        <span className="font-mono font-bold text-emerald-400 select-all tracking-wider">{bill.alias}</span>
                    </div>
                )}
            </div>

            <PizzaVisualizer friends={bill.friends} />

            {isCompleted && (
                <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl text-center font-bold animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    🎉 ¡Todos pagaron! La cuenta está cerrada.
                </div>
            )}

            <div className="grid gap-3">
                {bill.friends.map((friend, i) => (
                    <div key={friend.id} className="bg-zinc-900/50 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-all">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md transition-all",
                                friend.status === 'paid'
                                    ? "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/20"
                                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            )}>
                                {friend.status === 'paid' ? <CheckCircle className="w-5 h-5 text-white" /> : (i + 1)}
                            </div>
                            <div>
                                <p className="font-bold text-zinc-200">{friend.name}</p>
                                <p className="text-xs text-zinc-500 font-mono">${friend.amount}</p>
                            </div>
                        </div>

                        {friend.status === 'pending' && (
                            <button
                                className="text-xs bg-zinc-800 border border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 text-zinc-300 px-3 py-2 rounded-lg transition-all flex items-center gap-2 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                onClick={() => setSelectedFriend(friend)}
                            >
                                Ya pagué
                            </button>
                        )}
                        {friend.status === 'paid' && (
                            <span className="text-emerald-400 text-sm font-bold flex items-center gap-1 drop-shadow-sm">
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
                className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl text-center transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
            >
                <Share2 className="w-5 h-5" />
                Compartir por WhatsApp
            </a>

            {selectedFriend && bill && (
                <PaymentModal
                    isOpen={!!selectedFriend}
                    onClose={() => setSelectedFriend(null)}
                    billId={billId}
                    friend={selectedFriend}
                    amount={bill.amountPerPerson}
                    alias={bill.alias || 'No definido'}
                />
            )}
        </div>
    );
}
