import BillDashboard from "@/components/BillDashboard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="flex min-h-screen flex-col items-center p-6 bg-zinc-950 text-zinc-100 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>
            <main className="max-w-md w-full space-y-6 relative z-10">
                <Link href="/" className="flex items-center text-zinc-500 hover:text-emerald-400 transition-colors group font-mono text-sm uppercase tracking-wider">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Inicio
                </Link>

                <BillDashboard billId={id} />
            </main>
        </div>
    );
}
