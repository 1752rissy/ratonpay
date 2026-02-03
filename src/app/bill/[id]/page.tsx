import BillDashboard from "@/components/BillDashboard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BillPage({ params }: { params: { id: string } }) {
    return (
        <div className="flex min-h-screen flex-col items-center p-6 bg-slate-50">
            <main className="max-w-md w-full space-y-6">
                <Link href="/" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Inicio
                </Link>

                <BillDashboard billId={params.id} />
            </main>
        </div>
    );
}
