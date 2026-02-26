"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Save, LogOut, Shield, Lock } from "lucide-react";

interface UserProfile {
    name: string;
    email: string;
    image: string;
    displayName: string | null;
    serverCode: string | null;
    playerId: string | null;
    lastProfileSyncAt: string | null;
    memberships: Array<{
        role: string;
        alliance: {
            id: string;
            name: string;
            description: string | null;
        }
    }>;
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [displayName, setDisplayName] = useState("");
    const [serverCode, setServerCode] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }

        if (status === "authenticated") {
            fetch("/api/user/profile")
                .then(res => {
                    if (res.status === 404) {
                        // User not found in DB (e.g. after a database reset)
                        signOut({ callbackUrl: "/" });
                        throw new Error("User Not Found in Database. Signing out.");
                    }
                    if (!res.ok) throw new Error("Failed");
                    return res.json();
                })
                .then(data => {
                    setProfile(data.user);
                    setDisplayName(data.user.displayName || "");
                    setServerCode(data.user.serverCode || "");
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Profile Fetch Error:", err);
                    setLoading(false);
                });
        }
    }, [status, router]);

    const handleSync = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/user/sync-profile", {
                method: "POST"
            });

            const data = await res.json();

            if (res.ok) {
                alert("Profile Successfully Synced from Game Server!");
                window.location.reload(); // Force full reload to catch new NextAuth JWT
            } else {
                alert(data.error || "Sync failed. Are you on cooldown?");
            }
        } catch (error) {
            alert("Error connecting to server.");
        }
        setSaving(false);
    };

    const getDaysRemaining = () => {
        if (!profile?.lastProfileSyncAt) return 0;
        const lastSync = new Date(profile.lastProfileSyncAt).getTime();
        const now = new Date().getTime();
        const diff = now - lastSync;
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (diff >= sevenDays) return 0;
        return Math.ceil((sevenDays - diff) / (1000 * 60 * 60 * 24));
    };

    const daysRemaining = getDaysRemaining();
    const canSync = daysRemaining === 0;

    if (loading || status === "loading") {
        return (
            <div className="min-h-screen bg-wos-bg flex items-center justify-center">
                <Loader2 className="animate-spin text-ice-500" size={48} />
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-wos-bg p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Card */}
                <div className="bg-gradient-to-r from-wos-surface to-slate-900 border border-slate-700 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-ice-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-slate-800 shadow-xl overflow-hidden relative z-10">
                            {profile.image ? (
                                <Image src={profile.image} alt="Avatar" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-4xl text-slate-400 font-bold">
                                    {profile.name[0]}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-ice-500 border-4 border-wos-surface w-8 h-8 rounded-full z-20"></div>
                    </div>

                    <div className="flex-1 text-center md:text-left z-10">
                        <h1 className="text-3xl font-bold font-heading text-white mb-2">{profile.displayName || profile.name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 text-sm">
                            <span className="bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                                {profile.email}
                            </span>
                            {profile.serverCode && (
                                <span className="bg-fire-500/10 text-fire-400 px-3 py-1 rounded-full border border-fire-500/20">
                                    Server: {profile.serverCode}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-fire-500/10 hover:text-fire-400 hover:border-fire-500/50 text-slate-400 px-4 py-2 rounded-lg border border-slate-700 transition-all z-10"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Identity Settings */}
                    <div className="lg:col-span-2">
                        <div className="bg-wos-surface border border-slate-700 rounded-xl p-6 shadow-lg">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-ice-500 rounded-full"></span>
                                Identity Settings
                            </h2>

                            <form onSubmit={handleSync} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Email Address (Locked)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={profile.email}
                                            disabled
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed pl-10"
                                        />
                                        <Lock className="absolute left-3 top-3.5 text-slate-600" size={18} />
                                    </div>
                                    <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                                        <Shield size={12} />
                                        Managed by Google OAuth
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Display Name (Locked)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={profile.displayName || ""}
                                            disabled
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed pl-10"
                                        />
                                        <Lock className="absolute left-3 top-3.5 text-slate-600" size={18} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Server Code (Locked)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={profile.serverCode || ""}
                                            disabled
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed pl-10"
                                        />
                                        <Lock className="absolute left-3 top-3.5 text-slate-600" size={18} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">WOS Player ID (Locked)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={profile.playerId || "Not Linked"}
                                            disabled
                                            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed pl-10"
                                        />
                                        <Lock className="absolute left-3 top-3.5 text-slate-600" size={18} />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                        <Shield size={12} className="text-sky-500" />
                                        Verified by Century Games API
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-700/50">
                                    <button
                                        type="submit"
                                        disabled={saving || !canSync}
                                        className="bg-ice-600 hover:bg-ice-500 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 transition-all"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        {canSync ? "Sync with Game Server" : `Sync Available in ${daysRemaining} day(s)`}
                                    </button>
                                    <p className="text-xs text-slate-500 mt-3 max-w-lg">
                                        To prevent flooding and impersonation, modifying your name or profile picture is locked. You can exclusively update them by refetching from the game server once every 7 days.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Alliances Side Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-wos-surface border border-slate-700 rounded-xl p-6 shadow-lg h-full">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Shield className="text-fire-500" />
                                My Alliances
                            </h2>

                            <div className="space-y-4">
                                {profile.memberships.length > 0 ? (
                                    profile.memberships.map((m) => (
                                        <div key={m.alliance.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-ice-500/30 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-ice-400">{m.alliance.name}</h3>
                                                <span className="text-xs font-bold uppercase bg-slate-900 px-2 py-1 rounded text-slate-400">
                                                    {m.role}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                {m.alliance.description || "No description"}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        <p className="mb-4">You haven't joined any alliances yet.</p>
                                        <a href="/alliances" className="text-ice-500 text-sm hover:underline">Browse Alliances</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
