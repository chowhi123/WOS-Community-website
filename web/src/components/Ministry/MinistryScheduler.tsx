"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { Crown, GraduationCap } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import ApplicationModal from "./ApplicationModal";
import ReservationDetailModal from "./ReservationDetailModal";

// Mock Data Structure
const MINISTERS = [
    { id: "VICE_PRESIDENT", name: "Vice President", icon: Crown, color: "text-amber-400" },
    { id: "MINISTER_OF_EDUCATION", name: "Education", icon: GraduationCap, color: "text-cyan-400" },
];

const DAYS = [
    { label: "Day 1", code: "Mon" },
    { label: "Day 2", code: "Tue" },
    { label: "Day 3", code: "Wed" },
    { label: "Day 4", code: "Thu" }, // Education Rec
    { label: "Day 5", code: "Fri" },
    { label: "Day 6", code: "Sat" },
];

interface Props {
    allianceId?: string;
    userRole?: string | null;
}

interface MinistryReservation {
    id: string;
    position: string;
    startTime: string;
    endTime: string;
    status: string;
    user: {
        id: string;
        name: string | null;
        displayName: string | null;
        image: string | null;
    }
}

export default function MinistryScheduler({ allianceId, userRole }: Props) {
    const { data: session } = useSession();
    const [reservations, setReservations] = useState<MinistryReservation[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Check Permission
    const canManage = userRole === "R5" || userRole === "R4";

    // ... (rest of state omitted, just overriding the component signature and modal call)

    // Modal State
    const [selectedPosition, setSelectedPosition] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlotStr, setSelectedSlotStr] = useState("");
    const [selectedDayLabel, setSelectedDayLabel] = useState("");

    // Date Logic (SvS Week)
    // For MVP, lets anchor to "Current Week" or a specific "SvS Start Date"
    // Assuming current Monday is Day 1 for simplicity of demo
    const today = new Date();
    const startOfSvS = startOfWeek(today, { weekStartsOn: 1 }); // Monday

    const handleSlotClick = (positionId: string, dayIndex: number, hour: number, minute: number) => {
        const date = addDays(startOfSvS, dayIndex);
        date.setHours(hour, minute, 0, 0);

        const endTime = new Date(date.getTime() + 30 * 60000);

        setSelectedPosition(MINISTERS.find(m => m.id === positionId)?.name || "");
        setSelectedDate(date);
        setSelectedDayLabel(`Day ${dayIndex + 1}`);
        setSelectedSlotStr(`${format(date, "HH:mm")} ~ ${format(endTime, "HH:mm")} UTC`);

        setIsModalOpen(true);
    };

    const [activeDay, setActiveDay] = useState(0); // 0 = Day 1

    // ... modal states ...
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<MinistryReservation | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        // Calculate date for the Active Day tab
        const date = addDays(startOfSvS, activeDay);
        const dateStr = format(date, "yyyy-MM-dd");

        try {
            const query = new URLSearchParams({ date: dateStr });
            if (allianceId) query.append("allianceId", allianceId);

            const res = await fetch(`/api/ministry/reservations?${query.toString()}`);
            const data = await res.json();
            if (data.reservations) {
                setReservations(data.reservations);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [activeDay]); // Re-fetch when day changes

    const handleReservationClick = (res: MinistryReservation) => {
        setSelectedReservation(res);
        setIsDetailOpen(true);
    };

    const handleBulkApprove = async () => {
        if (!confirm("Are you sure you want to approve all valid non-conflicting applications for this day?")) return;
        setLoading(true);
        try {
            const date = addDays(startOfSvS, activeDay);
            const dateStr = format(date, "yyyy-MM-dd");
            const res = await fetch('/api/ministry/reservations/bulk-approve', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ allianceId, date: dateStr })
            });

            if (res.ok) {
                alert("Bulk approval successful!");
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to bulk approve");
            }
        } catch (e) {
            console.error(e);
            alert("Error during bulk approval");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Day Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {DAYS.map((d, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveDay(idx)}
                            className={`
                                px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap
                                ${activeDay === idx
                                    ? "bg-ice-500 text-white shadow-lg shadow-ice-500/20"
                                    : "bg-wos-surface border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"}
                            `}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>

                {/* Admin Bulk Approve Button */}
                {canManage && (
                    <button
                        onClick={handleBulkApprove}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
                    >
                        {loading ? <span className="animate-spin text-xl">↻</span> : <span>✓</span>}
                        Approve All Valid
                    </button>
                )}
            </div>

            {/* Recommendation Banner */}
            {activeDay === 3 ? ( // Day 4
                <div className="bg-gradient-to-r from-cyan-900/50 to-slate-900 border border-cyan-500/30 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-full text-cyan-400">
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-cyan-100">Recommendation: Minister of Education</h3>
                        <p className="text-sm text-cyan-300/70">Day 4 focuses on Troop Training. Prioritize Education buffs.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-amber-900/50 to-slate-900 border border-amber-500/30 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-full text-amber-400">
                        <Crown size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-100">Recommendation: Vice President</h3>
                        <p className="text-sm text-amber-300/70">General speedups for Construction and Research are most effective today.</p>
                    </div>
                </div>
            )}

            {/* The Grid for Active Day */}
            <div className="bg-wos-surface border border-slate-700 rounded-xl overflow-hidden shadow-xl overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 border-b border-slate-700">
                            <th className="p-4 w-24 sticky left-0 bg-slate-900 z-10 border-r border-slate-700 text-slate-500 font-mono text-xs">UTC</th>
                            {MINISTERS.map(m => (
                                <th key={m.id} className="p-4 min-w-[180px] border-r border-slate-800 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <m.icon size={18} className={m.color} />
                                        <span className="text-sm font-bold text-slate-300">{m.name}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {/* 24 Hours x 2 (30 min slots) = 48 rows */}
                        {Array.from({ length: 48 }).map((_, slotIdx) => {
                            const hour = Math.floor(slotIdx / 2);
                            const minute = (slotIdx % 2) * 30;
                            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                            return (
                                <tr key={slotIdx} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-3 border-r border-slate-700/50 text-slate-500 font-mono text-xs sticky left-0 bg-wos-surface group-hover:bg-slate-800/30 z-10">
                                        {timeStr}
                                    </td>
                                    {MINISTERS.map(m => {
                                        // Find reservation for this slot & position
                                        // Simple match by StartTime (Hour:Minute match)
                                        // Since we store exact DateTimes, we compare Time parts for the CURRENT DAY view
                                        const slotRes = reservations.find(r => {
                                            if (r.position !== m.id) return false;
                                            const rDate = new Date(r.startTime);
                                            return rDate.getHours() === hour && rDate.getMinutes() === minute;
                                        });

                                        return (
                                            <td key={m.id} className="p-1 border-r border-slate-800 last:border-0 relative h-10">
                                                {slotRes ? (
                                                    <button
                                                        onClick={() => handleReservationClick(slotRes)}
                                                        className={`w-full h-full rounded flex items-center gap-2 px-2 transition-all text-left relative overflow-hidden
                                                            ${slotRes.status === 'APPROVED' ? 'bg-green-500/20 border border-green-500/30 hover:bg-green-500/30' :
                                                                slotRes.status === 'REJECTED' ? 'bg-red-500/10 border border-red-500/20 opacity-60' :
                                                                    'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'}
                                                        `}
                                                    >
                                                        {/* Avatar */}
                                                        <div className="w-6 h-6 rounded-full bg-slate-800 shrink-0 relative overflow-hidden">
                                                            {slotRes.user.image ? (
                                                                <Image src={slotRes.user.image} alt="U" fill className="object-cover" />
                                                            ) : (
                                                                <span className="flex items-center justify-center w-full h-full text-[10px] text-white font-bold">{slotRes.user.name?.[0]}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold text-white truncate">{slotRes.user.displayName || slotRes.user.name}</span>

                                                        {/* Status Dot */}
                                                        {slotRes.status === 'PENDING' && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSlotClick(m.id, activeDay, hour, minute)}
                                                        className="w-full h-full rounded hover:bg-ice-500/10 hover:border hover:border-ice-500/30 transition-all flex items-center justify-center text-xs text-slate-600 hover:text-ice-400 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    >
                                                        <span>+</span>
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <ApplicationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                position={selectedPosition}
                day={selectedDayLabel}
                date={selectedDate}
                slotTime={selectedSlotStr}
                onSuccess={() => {
                    fetchData(); // Refresh grid
                }}
            />

            <ReservationDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                reservation={selectedReservation}
                onUpdate={fetchData}
                canManage={canManage}
            />
        </div>
    );
}
