"use client";

import { useState } from "react";
import { X, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    position: string;
    day: string;
    date: Date; // The specific date/time of the slot
    slotTime: string; // e.g. "22:30 - 23:00 UTC"
    onSuccess: () => void;
}

export default function ApplicationModal({ isOpen, onClose, position, day, slotTime, date, onSuccess }: Props) {
    const { data: session } = useSession();
    const [submitting, setSubmitting] = useState(false);

    // Resource States
    const [fireCrystals, setFireCrystals] = useState("");
    const [refinedFC, setRefinedFC] = useState("");
    const [fcShards, setFCShards] = useState("");
    const [speedups, setSpeedups] = useState("");
    const [trainingSpeedups, setTrainingSpeedups] = useState("");

    const isTrainingPos = position === "Minister of Education" || position === "Vice President";
    // VP is hybrid, but commonly used for all. 
    // Logic: If Position is specific, show specific fields.

    const showConstruction = ["Vice President", "Minister of Interior", "Minister of Science"].includes(position);
    const showTraining = ["Vice President", "Minister of Education", "Minister of Strategy"].includes(position);

    // If it's pure Defense/Attack, maybe just General Speedups?
    // Following user image 2 & 3:
    // Image 2 (Construction/Research?): FC, Refined, Shards, Speedups.
    // Image 3 (Training): Training Speedups (+ Troop count implied?).

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const resourceData = {
            fireCrystals: parseInt(fireCrystals) || 0,
            refinedFC: parseInt(refinedFC) || 0,
            shards: parseInt(fcShards) || 0,
            speedups: parseInt(speedups) || 0,
            trainingSpeedups: parseInt(trainingSpeedups) || 0
        };

        try {
            const res = await fetch("/api/ministry/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    position,
                    startTime: date, // Needs correct encoding
                    endTime: new Date(date.getTime() + 30 * 60000), // +30 mins
                    resourceData
                })
            });

            if (!res.ok) throw new Error("Failed");

            alert("Application Submitted! Pending Approval.");
            onSuccess();
            onClose();
        } catch (error) {
            alert("Submission failed. Try again.");
        }
        setSubmitting(false);
    };

    if (!isOpen || !session) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 text-center border-b border-slate-100 relative">
                    <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800">관직 신청 (Application)</h2>

                    <div className="mt-4 bg-ice-50 p-3 rounded-lg border border-ice-100 inline-block w-full">
                        <span className="text-xs font-bold text-ice-600 uppercase tracking-wide block mb-1">{day}</span>
                        <div className="text-lg font-mono font-bold text-ice-700">{slotTime}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                    {/* Identity (Read Only) */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-ice-500 mb-1">User ID</label>
                            <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-600 text-sm font-mono">
                                {session.user.id.substring(0, 8)}...
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-ice-500 mb-1">In-Game Nickname</label>
                            <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 font-bold text-sm">
                                {session.user.displayName || session.user.name}
                            </div>
                        </div>
                        {/* 
                        <div>
                            <label className="block text-xs font-bold text-ice-500 mb-1">Alliance</label>
                            <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 text-sm">
                                {session.user.memberships?.[0]?.alliance?.name || "No Alliance"}
                            </div>
                        </div>
                        */}
                    </div>

                    {/* Dynamic Resource Inputs */}
                    <div className="border border-ice-200 rounded-lg p-4 bg-ice-50/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-ice-700 flex items-center gap-2">
                                <ShieldCheck size={16} />
                                Resource Evidence
                            </h3>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded-full">Optional but Recommended</span>
                        </div>

                        <div className="space-y-4">
                            {showConstruction && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">🔥 Fire Crystals</label>
                                        <input
                                            type="number"
                                            placeholder="Ex) 3000"
                                            value={fireCrystals}
                                            onChange={e => setFireCrystals(e.target.value)}
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:border-ice-500 focus:ring-1 focus:ring-ice-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">💎 Refined Fire Crystals</label>
                                        <input
                                            type="number"
                                            placeholder="Ex) 600"
                                            value={refinedFC}
                                            onChange={e => setRefinedFC(e.target.value)}
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:border-ice-500 focus:ring-1 focus:ring-ice-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                </>
                            )}

                            {showTraining && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">⚔️ Training Speedups (Days)</label>
                                    <input
                                        type="number"
                                        placeholder="Ex) 200"
                                        value={trainingSpeedups}
                                        onChange={e => setTrainingSpeedups(e.target.value)}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:border-ice-500 focus:ring-1 focus:ring-ice-500 outline-none transition-all text-sm"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">⚡ General Speedups (Days)</label>
                                <input
                                    type="number"
                                    placeholder="Ex) 100"
                                    value={speedups}
                                    onChange={e => setSpeedups(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 focus:border-ice-500 focus:ring-1 focus:ring-ice-500 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>



                    <div className="bg-slate-50 p-3 rounded text-[11px] text-slate-500 flex gap-2 items-start border border-slate-100">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                        <p>
                            Final approval is at the sole discretion of the Presidency/Ministers.
                            Duplicate requests will be judged based on resource input priority.
                        </p>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3 font-bold text-white bg-ice-500 hover:bg-ice-600 rounded-lg shadow-lg shadow-ice-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 className="animate-spin mx-auto" /> : "Apply Now"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
