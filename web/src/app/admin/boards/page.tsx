"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminBoards() {
    const { data: session } = useSession();
    const router = useRouter();
    const [boards, setBoards] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    // Form State
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [availCats, setAvailCats] = useState("");
    const [desc, setDesc] = useState("");

    useEffect(() => {
        if (session?.user?.role !== "ADMIN") {
            return;
        }
        fetchBoards();
    }, [session]);

    const fetchBoards = () => {
        fetch("/api/board/list")
            .then(res => res.json())
            .then(data => {
                if (data.boards) setBoards(data.boards);
            });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const categories = availCats.split(',').map(c => c.trim()).filter(c => c.length > 0);

        const url = editingId ? "/api/board/update" : "/api/board/create";
        const method = editingId ? "PUT" : "POST";
        const body = editingId
            ? { id: editingId, title, slug, availableCategories: categories, description: desc }
            : { title, slug, availableCategories: categories, description: desc };

        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            setShowModal(false);
            fetchBoards();
            resetForm();
        } else {
            alert(editingId ? "Failed to update board." : "Failed to create board. Check slug uniqueness.");
        }
    };

    const resetForm = () => {
        setTitle("");
        setSlug("");
        setAvailCats("");
        setDesc("");
        setEditingId(null);
    }

    const openEdit = (board: any) => {
        setEditingId(board.id);
        setTitle(board.title);
        setSlug(board.slug);
        setAvailCats(board.availableCategories?.join(", ") || "");
        setDesc(board.description || "");
        setShowModal(true);
        setActiveMenuId(null);
    }

    // Delete Handler
    const handleDelete = async (boardId: string, boardTitle: string) => {
        if (confirm(`Are you sure you want to delete "${boardTitle}"?\n\nWARNING: ALL POSTS in this board will be PERMANENTLY DELETED.`)) {
            const res = await fetch("/api/board/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: boardId })
            });
            if (res.ok) {
                fetchBoards();
            } else {
                alert("Failed to delete board.");
            }
        }
    };

    if (session?.user?.role !== "ADMIN") {
        return <div className="p-8 text-white">Access Denied</div>;
    }

    return (
        <div className="min-h-screen p-8 bg-wos-bg">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-sky-400 font-heading">Global Boards Management</h1>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-2 rounded shadow-lg transition-transform hover:scale-105"
                    >
                        + Create Board
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boards.map(board => (
                        <div key={board.id} className="bg-wos-surface border border-white/5 p-6 rounded-lg relative group hover:border-ice-500/30 transition-colors">
                            <div className="absolute top-4 right-4 z-10">
                                <MenuDropdown
                                    isOpen={activeMenuId === board.id}
                                    onToggle={() => setActiveMenuId(activeMenuId === board.id ? null : board.id)}
                                    onDelete={() => handleDelete(board.id, board.title)}
                                    onEdit={() => openEdit(board)}
                                    viewLink={`/boards/${board.slug}`}
                                />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1 pr-8">{board.title}</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs text-slate-500">/{board.slug}</span>
                            </div>
                            <p className="text-slate-400 text-sm mb-4 min-h-[40px] line-clamp-2">{board.description || "No description provided."}</p>

                            <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <Link href={`/boards/${board.slug}`} className="text-sm text-ice-400 hover:underline">Go to Board →</Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-slate-800 p-8 rounded-lg w-full max-w-md border border-slate-700 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6">{editingId ? "Board Settings" : "Create New Board"}</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
                                    <input className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" value={title} onChange={e => { setTitle(e.target.value); if (!editingId) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Slug (URL)</label>
                                    <input className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-slate-400" value={slug} onChange={e => setSlug(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Post Categories (comma separated)</label>
                                    <input
                                        className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                                        placeholder="e.g. Notice, Guide, General"
                                        value={availCats}
                                        onChange={e => setAvailCats(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Users can select these tags when writing posts.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">Description</label>
                                    <textarea className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                                    <button type="submit" className="bg-violet-600 px-6 py-2 rounded text-white font-bold hover:bg-violet-500">{editingId ? "Save Changes" : "Create"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple Dropdown Component
function MenuDropdown({ isOpen, onToggle, onDelete, onEdit, viewLink }: { isOpen: boolean, onToggle: () => void, onDelete: () => void, onEdit: () => void, viewLink: string }) {
    return (
        <div className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
                ⋮
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); onToggle(); }} />
                    <div className="absolute right-0 top-full mt-1 w-32 bg-slate-800 border border-slate-700 rounded shadow-xl z-20 py-1 flex flex-col">
                        <Link href={viewLink} className="text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => onToggle()}>View Board</Link>
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggle(); onEdit(); }}
                            className="text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                            Settings
                        </button>
                        <hr className="border-slate-700 my-1" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggle(); onDelete(); }}
                            className="text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 font-bold"
                        >
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
