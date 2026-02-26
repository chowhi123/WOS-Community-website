"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminStats {
    stats: {
        totalUsers: number;
        totalAlliances: number;
        activeUsers24h: number;
    };
    recentAlliances: any[];
}

export default function AdminDashboard() {
    const [data, setData] = useState<AdminStats | null>(null);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error("Unauthorized");
            })
            .then(setData)
            .catch(() => window.location.href = "/"); // Redirect if not admin
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to DISBAND this alliance? This cannot be undone.")) return;

        try {
            const res = await fetch("/api/alliance/delete", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ allianceId: id })
            });

            if (res.ok) {
                alert("Alliance disbanded.");
                // Refresh data
                const stats = await fetch("/api/admin/stats").then(r => r.json());
                setData(stats);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to delete");
            }
        } catch (e) {
            alert("Error deleting alliance");
        }
    };

    if (!data) return <div className="p-8 text-white">Loading Admin Panel...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold font-heading text-sky-400 mb-8">Admin Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-slate-400 mb-1">Total Users</h3>
                        <p className="text-3xl font-bold">{data.stats.totalUsers}</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-slate-400 mb-1">Active (24h)</h3>
                        <p className="text-3xl font-bold text-emerald-400">{data.stats.activeUsers24h}</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-slate-400 mb-1">Alliances</h3>
                        <p className="text-3xl font-bold text-violet-400">{data.stats.totalAlliances}</p>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Link href="/admin/boards" className="block bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-sky-500 group transition-colors">
                        <h3 className="text-xl font-bold mb-2 text-sky-400 group-hover:text-sky-300">Manage Boards</h3>
                        <p className="text-slate-400">Create & manage global boards.</p>
                    </Link>
                    <Link href="/admin/users" className="block bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-emerald-500 group transition-colors">
                        <h3 className="text-xl font-bold mb-2 text-emerald-400 group-hover:text-emerald-300">Manage Users</h3>
                        <p className="text-slate-400">View users, roles, and ban status.</p>
                    </Link>
                    <Link href="/admin/alliances" className="block bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-violet-500 group transition-colors">
                        <h3 className="text-xl font-bold mb-2 text-violet-400 group-hover:text-violet-300">Manage Alliances</h3>
                        <p className="text-slate-400">Edit, disband, or transfer leadership.</p>
                    </Link>
                </div>

                {/* Removed inline Recent Alliances list in favor of dedicated page */}
            </div>
        </div>
    );
}
