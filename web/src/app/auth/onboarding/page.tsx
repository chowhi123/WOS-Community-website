"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function OnboardingPage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    // Form
    const [serverCode, setServerCode] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [playerId, setPlayerId] = useState("");
    const [gameAvatar, setGameAvatar] = useState("");

    const [loading, setLoading] = useState(false);
    const [fetchingWos, setFetchingWos] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (session) {
            // @ts-ignore
            if (session.user?.serverCode) setServerCode(session.user.serverCode);
            // @ts-ignore
            if (session.user?.displayName) setDisplayName(session.user.displayName);
        }
    }, [session]);

    const handleFetchWosProfile = async () => {
        if (!playerId.trim()) {
            toast.error("Please enter a valid Player ID first.");
            return;
        }

        setFetchingWos(true);
        const tId = toast.loading("Checking Whiteout Survival servers...");

        try {
            const res = await fetch(`/api/player/${playerId}`);
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Failed to find player data.", { id: tId });
                return;
            }

            if (data.player) {
                // Century Games API returns nickname and avatar_image
                if (data.player.nickname) setDisplayName(data.player.nickname);
                if (data.player.avatar_image) setGameAvatar(data.player.avatar_image);
                // `kid` often correlates to the Kingdom/Server ID
                if (data.player.kid) setServerCode(`#${data.player.kid}`);

                toast.success(`Found Profile: ${data.player.nickname}`, { id: tId });
                setHasFetched(true);
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred fetching game data.", { id: tId });
        } finally {
            setFetchingWos(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasFetched) {
            toast.error("Please fetch your WOS Profile first.");
            return;
        }

        setLoading(true);

        const payload: any = { serverCode, displayName, playerId: playerId.trim() };
        if (gameAvatar) payload.image = gameAvatar;

        const res = await fetch("/api/user/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            await update({ serverCode, displayName, image: gameAvatar }); // Force session update with payload
            router.push("/");
        } else {
            toast.error("Failed to update profile");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
            <Toaster position="top-center" />
            <div className="bg-slate-800 p-8 rounded-lg shadow-2xl max-w-md w-full border border-slate-700">
                <div className="flex flex-col items-center mb-6">
                    {gameAvatar ? (
                        <img src={gameAvatar} alt="Game Avatar" className="w-20 h-20 rounded-xl shadow-lg border-2 border-sky-500 mb-4" />
                    ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-700 border-2 border-slate-600 mb-4 flex items-center justify-center text-3xl">
                            ❄️
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-center text-sky-400">Welcome to WOS Community</h1>
                    <p className="text-slate-400 text-center text-sm mt-1">Please complete your profile or fetch it automatically.</p>
                </div>

                {/* Auto-Fetch Section */}
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 mb-6">
                    <label className="block text-xs font-bold text-sky-400 uppercase mb-2 flex items-center gap-2">
                        <span>⚡</span> Auto-Fill with WOS Profile
                    </label>
                    <div className="flex gap-2">
                        <input
                            className="flex-1 bg-slate-900 border border-slate-600 p-2.5 rounded text-white focus:border-sky-500 outline-none transition-colors text-sm placeholder:text-slate-500"
                            placeholder="Player ID (e.g. 130198083)"
                            value={playerId}
                            onChange={(e) => {
                                setPlayerId(e.target.value);
                                setHasFetched(false);
                            }}
                            required
                        />
                        <button
                            type="button"
                            onClick={handleFetchWosProfile}
                            disabled={fetchingWos || !playerId.trim()}
                            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded text-sm transition-colors whitespace-nowrap"
                        >
                            {fetchingWos ? "Loading..." : "Fetch"}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                        Find your Player ID (FID) in your in-game Chief Profile (top-left avatar). We will securely fetch your Name, Server, and Avatar.
                    </p>
                </div>

                <div className="relative flex items-center py-2 mb-6">
                    <div className="flex-grow border-t border-slate-700"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase">Profile Details</span>
                    <div className="flex-grow border-t border-slate-700"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Server Code</label>
                        <input
                            className="w-full bg-slate-900 border border-slate-600 p-3 rounded text-white focus:border-sky-500 outline-none transition-colors disabled:opacity-50"
                            placeholder="#1234"
                            value={serverCode}
                            onChange={(e) => setServerCode(e.target.value)}
                            required
                            readOnly={!hasFetched}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Display Name</label>
                        <input
                            className="w-full bg-slate-900 border border-slate-600 p-3 rounded text-white focus:border-sky-500 outline-none transition-colors disabled:opacity-50"
                            placeholder="Your In-Game Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            readOnly={!hasFetched}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !hasFetched}
                        className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold py-3 rounded mt-4 transition-all shadow-lg shadow-sky-900/20"
                    >
                        {loading ? "Saving Profile..." : "Complete Profile"}
                    </button>
                </form>
            </div>
        </div>
    );
}
