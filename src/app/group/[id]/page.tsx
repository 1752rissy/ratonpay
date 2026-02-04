import GroupDashboard from "@/components/GroupDashboard";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="flex min-h-screen flex-col items-center p-6 bg-zinc-950 text-zinc-100 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>
            <main className="max-w-md w-full relative z-10">
                <GroupDashboard groupId={id} />
            </main>
        </div>
    );
}
