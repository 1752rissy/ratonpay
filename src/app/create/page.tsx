import { Suspense } from "react";
import CreateBillForm from "@/components/CreateBillForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";


export default async function CreateBillPage(props: { searchParams: Promise<{ groupId?: string }> }) {
    const searchParams = await props.searchParams;
    const isAddingExpense = !!searchParams.groupId;

    return (
        <div className="flex min-h-screen flex-col items-center p-6 bg-zinc-950 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
            </div>

            <main className="max-w-md w-full space-y-8 relative z-10">
                <Link href={isAddingExpense ? `/group/${searchParams.groupId}` : "/"} className="flex items-center text-zinc-500 hover:text-emerald-400 transition-colors font-mono text-sm group w-fit">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    VOLVER
                </Link>

                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tight">
                        {isAddingExpense ? "Agregar Gasto" : "Nuevo Grupo"}
                    </h1>
                    <p className="text-zinc-500">
                        {isAddingExpense ? "Sumar un ticket al grupo existente." : "Ingresá los detalles para dividir."}
                    </p>
                </div>

                <Suspense fallback={<div className="text-white text-center">Cargando...</div>}>
                    <CreateBillForm />
                </Suspense>
            </main>
        </div>
    );
}
