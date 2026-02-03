import CreateBillForm from "@/components/CreateBillForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateBillPage() {
    return (
        <div className="flex min-h-screen flex-col items-center p-6 bg-slate-50">
            <main className="max-w-md w-full space-y-6">
                <Link href="/" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Volver
                </Link>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900">Crear División</h1>
                    <p className="text-slate-600">Ingresá los detalles del gasto para empezar.</p>
                </div>

                <CreateBillForm />
            </main>
        </div>
    );
}
