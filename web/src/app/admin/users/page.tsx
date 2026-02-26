"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Search, Trash2, Shield, ShieldOff, Ban, CheckCircle, Crown, ShieldAlert, Edit2 } from "lucide-react";
import Image from "next/image";

interface User {
    id: string;
    name: string;
    email: string;
    image: string;
    displayName: string | null;
    serverCode: string | null;
    isActive: boolean;
    isApprovedLeader: boolean;
    role: string;
    lastLogin: string;
    joinedAt: string;
    lastPost: { title: string; createdAt: string } | null;
    lastComment: { content: string; createdAt: string } | null;
    stats: { posts: number; comments: number };
}

interface Alliance {
    id: string;
    tag: string;
    name: string;
}

export default function AdminUsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [alliances, setAlliances] = useState<Alliance[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Inline Editing State
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editServer, setEditServer] = useState("");

    // Alliance Assignment State
    const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

    const handleSaveProfile = async (id: string) => {
        const res = await fetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ displayName: editName, serverCode: editServer })
        });
        if (res.ok) {
            setUsers(users.map(u => u.id === id ? { ...u, displayName: editName, serverCode: editServer } : u));
            setEditingUserId(null);
        } else {
            alert("Failed to update profile");
        }
    };

    const fetchUsersAndAlliances = async () => {
        setLoading(true);
        try {
            const [usersRes, alliancesRes] = await Promise.all([
                fetch("/api/admin/users"),
                fetch("/api/alliance/list")
            ]);

            const usersData = await usersRes.json();
            const alliancesData = await alliancesRes.json();

            if (usersData.users) setUsers(usersData.users);
            if (alliancesData.alliances) setAlliances(alliancesData.alliances);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersAndAlliances();
    }, []);

    const toggleStatus = async (user: User) => {
        const newStatus = !user.isActive;
        const confirmMsg = newStatus ? "Activate this user?" : "Deactivate (Ban) this user?";
        if (!confirm(confirmMsg)) return;

        const res = await fetch(`/api/admin/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: newStatus })
        });

        if (res.ok) {
            setUsers(users.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
        } else {
            alert("Failed to update status");
        }
    };

    const togglePermission = async (user: User) => {
        const newStatus = !user.isApprovedLeader;
        const confirmMsg = newStatus ? "Grant R5 (Create Alliance) permission?" : "Revoke R5 permission?";
        if (!confirm(confirmMsg)) return;

        const res = await fetch(`/api/admin/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isApprovedLeader: newStatus })
        });

        if (res.ok) {
            setUsers(users.map(u => u.id === user.id ? { ...u, isApprovedLeader: newStatus } : u));
        } else {
            alert("Failed to update permission");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you SURE? This will delete the user and potentially all their content. This cannot be undone.")) return;

        const res = await fetch(`/api/admin/users/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            setUsers(users.filter(u => u.id !== id));
        } else {
            alert("Failed to delete");
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-ice-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-wos-bg p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold font-heading text-white">User Management</h1>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-ice-500 outline-none w-64"
                        />
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                    </div>
                </div>

                <div className="bg-wos-surface border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-4">User</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Activity</th>
                                    <th className="p-4">Last Interaction</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden relative border border-slate-600">
                                                    {user.image ? (
                                                        <Image src={user.image} alt={user.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full w-full text-white font-bold">{user.name?.[0]}</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm flex items-center gap-2 group cursor-pointer" onClick={() => {
                                                        setEditingUserId(user.id);
                                                        setEditName(user.displayName || user.name || "");
                                                        setEditServer(user.serverCode || "");
                                                    }}>

                                                        {editingUserId === user.id ? (
                                                            <div className="flex items-center gap-2 bg-slate-900 border border-ice-500 rounded px-2 py-1 relative z-10 w-full" onClick={e => e.stopPropagation()}>
                                                                <input
                                                                    autoFocus
                                                                    className="bg-transparent outline-none text-white text-sm w-32"
                                                                    value={editName}
                                                                    onChange={e => setEditName(e.target.value)}
                                                                    onKeyDown={e => e.key === "Enter" && handleSaveProfile(user.id)}
                                                                    placeholder="Name"
                                                                />
                                                                <input
                                                                    className="bg-transparent outline-none text-fire-400 text-xs w-16 px-1 border-l border-slate-700 ml-1"
                                                                    value={editServer}
                                                                    onChange={e => setEditServer(e.target.value)}
                                                                    onKeyDown={e => e.key === "Enter" && handleSaveProfile(user.id)}
                                                                    placeholder="#Server"
                                                                />
                                                                <button onClick={() => handleSaveProfile(user.id)} className="text-green-400 hover:text-green-300 ml-1"><CheckCircle size={14} /></button>
                                                                <button onClick={() => setEditingUserId(null)} className="text-red-400 hover:text-red-300"><Ban size={14} /></button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span>{user.displayName || user.name}</span>
                                                                <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-ice-400 transition-all" />
                                                            </>
                                                        )}

                                                        {user.role === "ADMIN" && editingUserId !== user.id && <span className="bg-violet-500/20 text-violet-400 text-[10px] px-1.5 rounded border border-violet-500/30">ADMIN</span>}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                    {user.serverCode && editingUserId !== user.id && <div className="text-[10px] text-fire-400 bg-fire-500/10 inline-block px-1 rounded mt-0.5">{user.serverCode}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {user.isActive ? (
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full w-fit">
                                                    <CheckCircle size={12} /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full w-fit">
                                                    <Ban size={12} /> Banned
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs text-slate-400">
                                                <div>Posts: <span className="text-white font-bold">{user.stats.posts}</span></div>
                                                <div>Comments: <span className="text-white font-bold">{user.stats.comments}</span></div>
                                                <div className="mt-1 text-slate-500">
                                                    Active: {format(new Date(user.lastLogin), "MMM d, h:mm a")}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 max-w-xs">
                                            <div className="space-y-2">
                                                {user.lastPost ? (
                                                    <div className="text-xs">
                                                        <span className="text-ice-400 font-bold block mb-0.5">Post</span>
                                                        <p className="text-slate-300 truncate" title={user.lastPost.title}>{user.lastPost.title}</p>
                                                        <span className="text-[10px] text-slate-500">{format(new Date(user.lastPost.createdAt), "MMM d")}</span>
                                                    </div>
                                                ) : <div className="text-xs text-slate-600 italic">No posts</div>}

                                                {user.lastComment ? (
                                                    <div className="text-xs border-t border-slate-800 pt-1">
                                                        <span className="text-emerald-400 font-bold block mb-0.5">Comment</span>
                                                        <p className="text-slate-300 truncate" title={user.lastComment.content}>{user.lastComment.content}</p>
                                                        <span className="text-[10px] text-slate-500">{format(new Date(user.lastComment.createdAt), "MMM d")}</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex justify-end gap-2">
                                                    {user.role !== "ADMIN" && (
                                                        <>
                                                            <button
                                                                onClick={() => setAssigningUserId(assigningUserId === user.id ? null : user.id)}
                                                                className={`p-2 rounded hover:bg-slate-700 transition-colors ${assigningUserId === user.id ? "text-sky-400" : "text-slate-600 hover:text-sky-400"}`}
                                                                title="Assign to Alliance"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm(`Grant GLOBAL ADMIN to ${user.displayName || user.name}?`)) {
                                                                        await fetch(`/api/admin/users/${user.id}`, {
                                                                            method: "PATCH",
                                                                            headers: { "Content-Type": "application/json" },
                                                                            body: JSON.stringify({ globalRole: "ADMIN" })
                                                                        });
                                                                        fetchUsersAndAlliances();
                                                                    }
                                                                }}
                                                                className="p-2 rounded hover:bg-slate-700 text-slate-600 hover:text-violet-400 transition-colors"
                                                                title="Grant Global Admin"
                                                            >
                                                                <ShieldAlert size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => togglePermission(user)}
                                                                className={`p-2 rounded hover:bg-slate-700 transition-colors ${user.isApprovedLeader ? "text-amber-400 hover:text-amber-300" : "text-slate-600 hover:text-amber-400"}`}
                                                                title={user.isApprovedLeader ? "Revoke Creator Permission" : "Grant Creator Permission"}
                                                            >
                                                                <Crown size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleStatus(user)}
                                                                className={`p-2 rounded hover:bg-slate-700 transition-colors ${user.isActive ? "text-slate-400 hover:text-red-400" : "text-green-500 hover:text-green-400"}`}
                                                                title={user.isActive ? "Deactivate User" : "Activate User"}
                                                            >
                                                                {user.isActive ? <ShieldOff size={18} /> : <Shield size={18} />}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(user.id)}
                                                                className="p-2 rounded hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>

                                                {assigningUserId === user.id && (
                                                    <div className="bg-slate-900 border border-slate-700 p-2 rounded flex items-center gap-2 mt-2 absolute right-8 z-20 shadow-xl" onClick={e => e.stopPropagation()}>
                                                        <select
                                                            className="bg-slate-800 text-xs text-white border border-slate-600 rounded p-1 outline-none focus:border-sky-500"
                                                            onChange={async (e) => {
                                                                if (!e.target.value) return;
                                                                if (confirm(`Force assign ${user.displayName || user.name} to this Alliance?`)) {
                                                                    const res = await fetch(`/api/admin/users/${user.id}`, {
                                                                        method: "PATCH",
                                                                        headers: { "Content-Type": "application/json" },
                                                                        body: JSON.stringify({ forceAllianceId: e.target.value })
                                                                    });
                                                                    if (res.ok) {
                                                                        setAssigningUserId(null);
                                                                        fetchUsersAndAlliances();
                                                                    } else {
                                                                        alert("Assignment failed!");
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <option value="">Select Alliance...</option>
                                                            {alliances.map(a => (
                                                                <option key={a.id} value={a.id}>[{a.tag}] {a.name}</option>
                                                            ))}
                                                        </select>
                                                        <button onClick={() => setAssigningUserId(null)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
