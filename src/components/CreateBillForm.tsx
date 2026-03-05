"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, Trash2, List, CreditCard, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createGroup } from "@/app/actions/create-group";
import { addExpense } from "@/app/actions/add-expense";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function CreateBillForm() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const groupId = searchParams.get("groupId");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [groupData, setGroupData] = useState<any>(null);

    // New State for Multi-Item Support
    const [expenseType, setExpenseType] = useState<'single' | 'multiple'>('single');
    const [items, setItems] = useState<{ id: string, description: string, amount: string }[]>([
        { id: crypto.randomUUID(), description: '', amount: '' }
    ]);

    useEffect(() => {
        if (groupId) {
            getDoc(doc(db, "groups", groupId)).then(snap => {
                if (snap.exists()) {
                    setGroupData(snap.data());
                }
            });
        }
    }, [groupId]);

    const addItem = () => {
        setItems([...items, { id: crypto.randomUUID(), description: '', amount: '' }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        } else {
            setItems([{ id: crypto.randomUUID(), description: '', amount: '' }]);
        }
    };

    const updateItem = (id: string, field: 'description' | 'amount', value: string) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const calculatedTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const description = formData.get("description") as string;
        const amountStr = formData.get("amount");
        const amount = expenseType === 'multiple' ? calculatedTotal : (amountStr ? parseFloat(amountStr as string) : 0);

        // Si es pago único, el monto debe ser obligatorio y mayor a 0
        if (expenseType === 'single' && amount <= 0) {
            setError("El monto debe ser mayor a 0");
            setLoading(false);
            return;
        }

        const filteredItems = items
            .filter(item => item.description.trim() !== '' && !isNaN(parseFloat(item.amount)))
            .map(item => ({ description: item.description, amount: parseFloat(item.amount) }));

        try {
            if (groupId) {
                // ADDING EXPENSE TO EXISTING GROUP
                let payerId = user?.uid;

                // Fallback to localStorage if not logged in (Guest Admin)
                if (!payerId) {
                    const localGroups = JSON.parse(localStorage.getItem('rata_groups') || '{}');
                    if (localGroups[groupId]?.role === 'admin') {
                        payerId = localGroups[groupId].userId;
                    }
                }

                if (!payerId) throw new Error("Debes ser el administrador o estar logueado para agregar gastos");

                const result = await addExpense(groupId, {
                    description,
                    amount,
                    payerId: payerId,
                    type: expenseType,
                    items: filteredItems
                });

                if (result.success) {
                    router.push(`/group/${groupId}`);
                } else {
                    setError(result.error || "Error al agregar gasto");
                    setLoading(false);
                }
            } else {
                // CREATING NEW GROUP
                if (user) {
                    formData.append("ownerUid", user.uid);
                    formData.append("ownerEmail", user.email || "");
                    formData.append("payerName", user.displayName || "Usuario");
                }

                // If description is provided, use it as the group name for now or just pass it
                formData.set("name", description || "Nuevo Grupo");
                formData.set("type", expenseType);
                formData.set("amount", amount.toString());
                formData.set("items", JSON.stringify(filteredItems));

                const result = await createGroup(formData);

                if (result.success) {
                    router.push(`/group/${result.groupId}`);
                } else {
                    setError(result.error || "Algo salió mal");
                    setLoading(false);
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error de conexión");
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto bg-zinc-900/80 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-2xl border border-zinc-800 space-y-6 md:space-y-8 relative overflow-hidden">
            {/* Tech decorative line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>

            <div className="space-y-6">
                <div>
                    <label htmlFor="description" className="block text-[10px] font-mono font-bold text-emerald-500/80 mb-2 uppercase tracking-[0.2em]">
                        Concepto del Gasto
                    </label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        required
                        placeholder="Cena, Supermercado, Regalo..."
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                    />
                </div>

                {/* Expense Type Toggle */}
                <div className="space-y-3">
                    <label className="block text-[10px] font-mono font-bold text-zinc-500 mb-2 uppercase tracking-[0.2em]">
                        Modo de Registro
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setExpenseType('single')}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg text-[10px] font-bold transition-all text-center",
                                expenseType === 'single'
                                    ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/10"
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                <span>Pago Único</span>
                            </div>
                            {expenseType === 'single' && <span className="text-[8px] opacity-70 uppercase tracking-tighter leading-none">Fija el total</span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => setExpenseType('multiple')}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg text-[10px] font-bold transition-all text-center",
                                expenseType === 'multiple'
                                    ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/10"
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <List className="w-4 h-4" />
                                <span>Varios Gastos</span>
                            </div>
                            {expenseType === 'multiple' && <span className="text-[8px] opacity-70 uppercase tracking-tighter leading-none">Se acumula</span>}
                        </button>
                    </div>
                    <p className="text-[9px] text-zinc-600 italic px-2">
                        {expenseType === 'single'
                            ? "💡 El Pago Único establece el monto total final del grupo, ignorando gastos anteriores."
                            : "💡 Este gasto se sumará al total acumulado que ya tenga el grupo."}
                    </p>
                </div>

                {expenseType === 'single' ? (
                    <div>
                        <label htmlFor="amount" className="block text-[10px] font-mono font-bold text-emerald-500/80 mb-2 uppercase tracking-[0.2em]">
                            Monto Total ($)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-mono text-xl">$</span>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                required={expenseType === 'single'}
                                min="1"
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-mono font-bold text-emerald-500/80 uppercase tracking-[0.2em]">
                                Detalle de Ítems
                            </label>
                            <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                                Total: <span className="text-emerald-400 font-bold">$ {calculatedTotal.toLocaleString()}</span>
                            </span>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex gap-2 group animate-in zoom-in-95 duration-200">
                                    <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex divide-x divide-zinc-800 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                            placeholder={`Item ${index + 1}`}
                                            className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-zinc-700 outline-none"
                                        />
                                        <div className="flex items-center bg-zinc-900/50 px-2 min-w-[100px]">
                                            <span className="text-zinc-600 mr-1">$</span>
                                            <input
                                                type="number"
                                                value={item.amount}
                                                onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-transparent py-2 text-sm text-white font-mono outline-none"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 self-center"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            className="w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5 flex items-center justify-center gap-2 text-xs font-bold transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar otro ítem
                        </button>
                    </div>
                )}

                {!groupId && (
                    <div>
                        <label htmlFor="alias" className="block text-[10px] font-mono font-bold text-emerald-500/80 mb-2 uppercase tracking-[0.2em]">
                            Alias para recibir pagos
                        </label>
                        <input
                            type="text"
                            id="alias"
                            name="alias"
                            required={!groupId}
                            placeholder="tu.alias.mp"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                            defaultValue={groupData?.alias}
                        />
                    </div>
                )}

                {groupId && groupData && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <Plus className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
                                Agregando a: {groupData.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-tighter">
                                El nuevo total se dividirá entre todos los miembros actuales.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-mono animate-shake">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className={cn(
                    "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95 uppercase tracking-widest text-sm",
                    loading && "opacity-70 cursor-not-allowed grayscale"
                )}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                    </>
                ) : (
                    <>
                        {groupId ? "Registrar Gasto" : "Crear Grupo y Gasto"}
                        <ChevronRight className="w-4 h-4" />
                    </>
                )}
            </button>
        </form>
    );
}
