"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, X, Pin } from "lucide-react";
import { useSession } from "next-auth/react";

export default function QuickMenu() {
    const { data: session } = useSession();
    const [pinnedBoards, setPinnedBoards] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allGlobalBoards, setAllGlobalBoards] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch pinned boards on load
    useEffect(() => {
        if (session) {
            fetch("/api/user/pinned-boards").then(res => res.json()).then(data => {
                if (data.pinnedBoards) setPinnedBoards(data.pinnedBoards);
            });
        }
    }, [session]);

    // Fetch global boards when opening modal
    useEffect(() => {
        if (isModalOpen && allGlobalBoards.length === 0) {
            setLoading(true);
            fetch("/api/board/list?isGlobal=true").then(res => res.json()).then(data => {
                if (data.boards) setAllGlobalBoards(data.boards);
                setLoading(false);
            });
        }
    }, [isModalOpen]);

    const togglePin = async (boardId: string, isPinned: boolean) => {
        // Optimistic Update
        let newPinned = [...pinnedBoards];
        if (isPinned) {
            const board = allGlobalBoards.find(b => b.id === boardId);
            if (board) newPinned.push(board);
        } else {
            newPinned = newPinned.filter(b => b.id !== boardId);
        }
        setPinnedBoards(newPinned);

        await fetch("/api/user/pinned-boards", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ boardId, isPinned })
        });
    };

    return (
        <div className="bg-wos-surface rounded-xl border border-white/5 overflow-hidden shadow-lg">
            <div className="p-3 bg-white/5 font-bold text-white border-b border-white/5 flex justify-between items-center">
                <span>Quick Menu</span>
                {session && (
                    <button onClick={() => setIsModalOpen(true)} className="text-slate-400 hover:text-ice-400 transition-colors" title="Add Board">
                        <Plus size={16} />
                    </button>
                )}
            </div>
            <div className="flex flex-col text-sm">
                {/* Pinned Boards */}
                {pinnedBoards.map(board => (
                    <div key={board.id} className="relative group border-b border-white/5">
                        <Link
                            href={board.allianceId ? `/alliance/${board.allianceId}/boards/${board.slug}` : `/boards/${board.slug}`}
                            className="block p-3 hover:bg-white/5 flex justify-between items-center text-slate-300 hover:text-ice-400 transition-colors"
                        >
                            <span className="truncate">📄 {board.title}</span>
                        </Link>
                        <button
                            onClick={(e) => { e.preventDefault(); togglePin(board.id, false); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                            title="Unpin"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                {/* Default Static Items */}
                <Link href="/alliances" className="p-3 hover:bg-white/5 border-b border-white/5 flex justify-between text-slate-300 hover:text-ice-400">
                    <span>🛡️ Find Alliance</span>
                </Link>
                <Link href="/calendar" className="p-3 hover:bg-white/5 border-b border-white/5 flex justify-between text-slate-300 hover:text-ice-400">
                    <span>📅 Event Calendar</span>
                </Link>

                {!session && <div className="p-3 text-xs text-slate-500 text-center">Login to pin boards</div>}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                            <h3 className="font-bold text-white">Pin Global Boards</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 bg-slate-800">
                            {loading ? <div className="p-4 text-center text-slate-500">Loading...</div> :
                                allGlobalBoards.map(board => {
                                    const isPinned = pinnedBoards.some(pb => pb.id === board.id);
                                    return (
                                        <button
                                            key={board.id}
                                            onClick={() => togglePin(board.id, !isPinned)}
                                            className={`w-full text-left p-2 rounded flex items-center justify-between transition-colors ${isPinned ? "bg-sky-500/10 border border-sky-500/30 text-sky-400" : "hover:bg-slate-700 text-slate-300"}`}
                                        >
                                            <span>{board.title}</span>
                                            {isPinned ? <Pin size={14} className="fill-current" /> : <Plus size={14} />}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
