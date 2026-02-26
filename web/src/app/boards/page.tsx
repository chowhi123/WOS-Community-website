"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Board {
    id: string;
    title: string;
    slug: string;
    description: string | null;
}

export default function BoardsPage() {
    const { data: session } = useSession();
    const [boards, setBoards] = useState<Board[]>([]);

    // Admin Create State
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newSlug, setNewSlug] = useState("");
    const [availableCats, setAvailableCats] = useState(""); // Comma separated

    useEffect(() => {
        fetch("/api/board/list")
            .then(res => res.json())
            .then(data => {
                if (data.boards) setBoards(data.boards);
            });
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/board/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: newTitle,
                slug: newSlug,
                availableCategories: availableCats.split(",").map(c => c.trim()).filter(Boolean)
            })
        });
        if (res.ok) {
            alert("Board Created!");
            window.location.reload();
        } else {
            alert("Failed");
        }
    };

    return (
        <div className="min-h-screen bg-wos-bg text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold font-heading text-sky-400">Global Boards</h1>
                    {session?.user?.role === "ADMIN" && (
                        <button
                            onClick={() => setIsCreating(!isCreating)}
                            className="bg-violet-600 px-4 py-2 rounded font-bold"
                        >
                            {isCreating ? "Cancel" : "+ Create Board"}
                        </button>
                    )}
                </div>

                {isCreating && (
                    <form onSubmit={handleCreate} className="mb-8 bg-slate-800 p-6 rounded border border-slate-700 space-y-4">
                        <input className="w-full bg-slate-700 p-2 rounded text-white" placeholder="Title (e.g. IT News)" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                        <input className="w-full bg-slate-700 p-2 rounded text-white" placeholder="Slug (e.g. it-news)" value={newSlug} onChange={e => setNewSlug(e.target.value)} required />
                        <input className="w-full bg-slate-700 p-2 rounded text-white" placeholder="Post Categories (comma separated, e.g. Info, Guide)" value={availableCats} onChange={e => setAvailableCats(e.target.value)} />
                        <button className="bg-sky-600 px-4 py-2 rounded">Create</button>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boards.map(board => (
                        <Link key={board.id} href={`/boards/${board.slug}`} className="block bg-wos-surface p-6 rounded-xl border border-white/5 hover:border-ice-400 group transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-ice-500/10">
                            <h2 className="text-xl font-bold mb-2">{board.title}</h2>
                            <p className="text-slate-500 mt-2">{board.description || "No description"}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
