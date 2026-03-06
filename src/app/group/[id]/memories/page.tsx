import MemoriesFeed from "@/components/MemoriesFeed";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const p = await params;
    const groupRef = doc(db, "groups", p.id);
    const groupDoc = await getDoc(groupRef);
    const group = groupDoc.data();

    return {
        title: `Recuerdos de ${group?.name || 'Grupo'} - Rata`,
        description: 'Mira las fotos y recuerdos de este grupo en nuestra app Rata.',
        openGraph: {
            title: `Recuerdos de ${group?.name || 'Grupo'} - Rata 🐀`,
            description: 'Compartimos momentos y gastos sin estrés.',
            images: ['/icons/icon-512x512.png'],
        }
    };
}

export default async function MemoriesPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const groupRef = doc(db, "groups", params.id);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
        redirect("/");
    }

    const group = groupDoc.data();

    // In a real app we'd verify the user has access to this group
    // But for the MVP, having the URL is enough access, same as the dashboard.

    return (
        <div className="min-h-screen bg-black">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-safe">

                {/* Header */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/group/${params.id}`}
                            className="p-2 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-xl transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-white flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-emerald-500" />
                                Recuerdos del grupo
                            </h1>
                            <p className="text-zinc-500 font-bold text-sm tracking-widest uppercase">{group?.name}</p>
                        </div>
                    </div>
                </div>

                {/* Feed passing isAdmin as false for MVP/simplification since we don't have user session on server easily here without passing it down */}
                <MemoriesFeed groupId={params.id} isAdmin={false} groupName={group?.name} />

            </div>
        </div>
    );
}
