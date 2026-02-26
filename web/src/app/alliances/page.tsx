"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Alliance {
    id: string;
    name: string;
    description: string | null;
    _count: { members: number };
    createdBy: { displayName: string | null; serverCode: string | null };
}

export default function AlliancesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [alliances, setAlliances] = useState<Alliance[]>([]);
    const [myAllianceId, setMyAllianceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Admin Create Form State
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");

    useEffect(() => {
        fetch("/api/alliance/list")
            .then((res) => res.json())
            .then((data) => {
                if (data.alliances) setAlliances(data.alliances);
                if (data.myAllianceId) setMyAllianceId(data.myAllianceId);
                setLoading(false);
            });
    }, []);

    const handleJoin = async (id: string) => {
        if (!confirm("Join this alliance?")) return;
        const res = await fetch("/api/alliance/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ allianceId: id }),
        });
        const data = await res.json();
        if (data.success) {
            alert("Joined successfully!");
            router.push(`/alliances/${id}`); // Redirect to Dashboard
        } else {
            alert(data.error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id) return;

        try {
            const res = await fetch("/api/alliance/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    description: newDesc,
                    leaderId: session.user.id,
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert("Alliance created!");
                router.push(`/alliances/${data.alliance.id}`); // Redirect to Dashboard
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Failed to create");
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold font-heading text-sky-400">Alliances</h1>
                    {(session?.user?.role === "ADMIN" || (session?.user as any)?.isApprovedLeader) && (
                        <button
                            onClick={() => setIsCreating(!isCreating)}
                            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded font-bold"
                        >
                            {isCreating ? "Cancel" : "+ Create Alliance"}
                        </button>
                    )}
                </div>

                {isCreating && (
                    <div className="mb-8 p-6 bg-slate-800 rounded border border-slate-700">
                        <h3 className="text-xl font-bold mb-4">Create New Alliance</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Alliance Name"
                                className="w-full p-2 rounded bg-slate-700 text-white"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                required
                            />
                            <textarea
                                placeholder="Description"
                                className="w-full p-2 rounded bg-slate-700 text-white"
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded"
                            >
                                Create
                            </button>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {alliances.map((alliance) => {
                        const isMyAlliance = myAllianceId === alliance.id;
                        const canJoin = !myAllianceId;

                        return (
                            <div
                                key={alliance.id}
                                className={`bg-slate-800 p-6 rounded-lg border transition-colors ${isMyAlliance ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-slate-700 hover:border-sky-500'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-2xl font-bold text-white">{alliance.name}</h2>
                                    {isMyAlliance && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/50">MY ALLIANCE</span>}
                                </div>
                                <p className="text-slate-400 mb-4">{alliance.description || "No description"}</p>

                                <div className="flex justify-between items-center text-sm text-slate-500 mb-4">
                                    <span>Members: {alliance._count.members}</span>
                                    <span>Leader: {alliance.createdBy?.displayName || "Unknown"}</span>
                                </div>

                                <div className="flex gap-2">
                                    <Link
                                        href={`/alliance/${alliance.id}`}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-center"
                                    >
                                        View
                                    </Link>

                                    {isMyAlliance ? (
                                        <Link
                                            href={`/alliance/${alliance.id}`}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-center font-bold"
                                        >
                                            Dashboard
                                        </Link>
                                    ) : canJoin ? (
                                        <button
                                            onClick={() => handleJoin(alliance.id)}
                                            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2 rounded"
                                        >
                                            Join
                                        </button>
                                    ) : (
                                        <button disabled className="flex-1 bg-slate-800 text-slate-600 border border-slate-700 py-2 rounded cursor-not-allowed">
                                            Join
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {alliances.length === 0 && (
                        <p className="text-slate-500 col-span-3 text-center py-12">
                            No alliances found. Ask an Admin to create one.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
