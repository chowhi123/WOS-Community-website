"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminAlliance {
    id: string;
    name: string;
    description: string | null;
    logo: string | null;
    banner: string | null;
    createdBy?: { displayName: string | null; } | null;
    _count?: { members: number; };
    lastPostAt: string;
}

interface AdminAllianceMember {
    role: string;
    user: {
        id: string;
        displayName: string | null;
        serverCode: string | null;
    }
}

export default function AdminAlliancesPage() {
    const router = useRouter();
    const [alliances, setAlliances] = useState<AdminAlliance[]>([]);
    const [sortBy, setSortBy] = useState("active");
    const [loading, setLoading] = useState(true);

    // Modals
    const [editAlliance, setEditAlliance] = useState<AdminAlliance | null>(null);
    const [transferR5, setTransferR5] = useState<AdminAlliance | null>(null);

    // Dropdown State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const [members, setMembers] = useState<AdminAllianceMember[]>([]);
    const [memberLoading, setMemberLoading] = useState(false);
    const [selectedNewR5, setSelectedNewR5] = useState("");

    // Form State
    const [editForm, setEditForm] = useState({ name: "", description: "", logo: "", banner: "" });

    const fetchAlliances = () => {
        setLoading(true);
        fetch(`/api/admin/alliances/list?sortBy=${sortBy}`)
            .then(res => res.json())
            .then(data => {
                if (data.alliances) setAlliances(data.alliances);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchAlliances();
    }, [sortBy]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to DISBAND ${name}? This cannot be undone.`)) return;

        const res = await fetch("/api/alliance/delete", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ allianceId: id })
        });

        if (res.ok) {
            alert("Alliance disbanded.");
            fetchAlliances();
        } else {
            alert("Failed to delete");
        }
    };

    const openEdit = (alliance: AdminAlliance) => {
        setEditAlliance(alliance);
        setEditForm({
            name: alliance.name,
            description: alliance.description || "",
            logo: alliance.logo || "",
            banner: alliance.banner || ""
        });
    };

    const saveEdit = async () => {
        if (!editAlliance) return;
        const res = await fetch("/api/alliance/update", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                allianceId: editAlliance.id,
                ...editForm
            })
        });
        if (res.ok) {
            alert("Updated!");
            setEditAlliance(null);
            fetchAlliances();
        } else {
            alert("Update failed");
        }
    };

    const openTransfer = async (alliance: AdminAlliance) => {
        setTransferR5(alliance);
        setMemberLoading(true);
        setMembers([]);

        // Fetch members using detail API (which now allows admin)
        const res = await fetch(`/api/alliance/${alliance.id}`);
        const data = await res.json();

        if (data.members) {
            setMembers(data.members);
        }
        setMemberLoading(false);
    };

    const saveTransfer = async () => {
        if (!transferR5 || !selectedNewR5) return;

        if (!confirm("Are you sure you want to FORCE TRANSFER leadership? The current R5 will be demoted to R4.")) return;

        const res = await fetch("/api/alliance/transfer", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                allianceId: transferR5.id,
                targetUserId: selectedNewR5
            })
        });

        if (res.ok) {
            alert("Leadership Transferred!");
            setTransferR5(null);
            fetchAlliances();
        } else {
            const err = await res.json();
            alert(err.error || "Transfer failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">← Back to Admin</Link>
                    <h1 className="text-3xl font-bold font-heading text-violet-400">Manage Alliances</h1>
                </div>

                {/* Controls */}
                <div className="flex justify-end mb-6">
                    <div className="flex items-center gap-2 bg-slate-800 p-2 rounded">
                        <span className="text-sm text-slate-400">Sort by:</span>
                        <select
                            className="bg-slate-900 border border-slate-600 rounded p-1 text-sm text-white focus:border-violet-500 outline-none"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="active">Last Active</option>
                            <option value="alpha">Alphabetical (A-Z)</option>
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {loading ? <div className="text-center py-20 text-slate-500">Loading...</div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {alliances.map(alliance => (
                            <div key={alliance.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden group relative flex flex-col">
                                {/* Banner / Header */}
                                <div className="h-24 bg-slate-700 relative">
                                    {alliance.banner && <img src={alliance.banner} className="w-full h-full object-cover opacity-50" />}
                                    <div className="absolute -bottom-6 left-4">
                                        <div className="w-16 h-16 rounded-lg bg-slate-600 border-4 border-slate-800 flex items-center justify-center overflow-hidden">
                                            {alliance.logo ? <img src={alliance.logo} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-slate-400">{alliance.name[0]}</span>}
                                        </div>
                                    </div>

                                    {/* Menu Trigger */}
                                    <div className={`absolute top-2 right-2 transition-opacity ${activeMenuId === alliance.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(activeMenuId === alliance.id ? null : alliance.id);
                                                }}
                                                className={`p-1.5 rounded text-white transition-colors ${activeMenuId === alliance.id ? "bg-slate-900 shadow-xl ring-1 ring-white/10" : "bg-slate-900/80 hover:bg-slate-900"}`}
                                            >
                                                •••
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeMenuId === alliance.id && (
                                                <>
                                                    {/* Backdrop for click-outside */}
                                                    <div className="fixed inset-0 z-10 cursor-default" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />

                                                    <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-600 rounded shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openEdit(alliance); setActiveMenuId(null); }}
                                                            className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm transition-colors"
                                                        >
                                                            Edit Info
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openTransfer(alliance); setActiveMenuId(null); }}
                                                            className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-sky-400 transition-colors"
                                                        >
                                                            Transfer R5
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(alliance.id, alliance.name); setActiveMenuId(null); }}
                                                            className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm text-rose-400 transition-colors"
                                                        >
                                                            Disband
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 pt-8 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{alliance.name}</h3>
                                        <p className="text-xs text-slate-400 mb-2">Leader: {alliance.createdBy?.displayName}</p>
                                        <p className="text-sm text-slate-300 line-clamp-2">{alliance.description || "No description."}</p>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center text-xs text-slate-500 border-t border-slate-700 pt-3">
                                        <span>{alliance._count?.members || 1} Members</span>
                                        <span>Active: {new Date(alliance.lastPostAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editAlliance && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full border border-slate-700">
                        <h2 className="text-xl font-bold mb-4">Edit Alliance: {editAlliance.name}</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Name</label>
                                <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Description</label>
                                <textarea className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white h-20" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Logo URL</label>
                                <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={editForm.logo} onChange={e => setEditForm({ ...editForm, logo: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Banner URL</label>
                                <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={editForm.banner} onChange={e => setEditForm({ ...editForm, banner: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setEditAlliance(null)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button onClick={saveEdit} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded font-bold">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {transferR5 && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full border border-slate-700">
                        <h2 className="text-xl font-bold mb-4 text-sky-400">Force Transfer Leadership</h2>
                        <p className="text-sm text-slate-400 mb-4">Select a new R5 Leader for <strong>{transferR5.name}</strong>. The current leader will be demoted to R4.</p>

                        {memberLoading ? <div className="text-center py-4">Loading members...</div> : (
                            <div className="mb-4">
                                <label className="block text-xs text-slate-400 mb-1">New Leader</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                    value={selectedNewR5}
                                    onChange={e => setSelectedNewR5(e.target.value)}
                                >
                                    <option value="">Select Member</option>
                                    {members.map(m => (
                                        <option key={m.user.id} value={m.user.id}>
                                            {m.user.displayName} ({m.user.serverCode}) - {m.role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setTransferR5(null)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button
                                onClick={saveTransfer}
                                disabled={!selectedNewR5}
                                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold disabled:opacity-50"
                            >
                                Transfer Leadership
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
