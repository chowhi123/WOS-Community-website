"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import Image from "next/image";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    reservation: any;
    onUpdate: () => void;
    canManage?: boolean;
}

export default function ReservationDetailModal({ isOpen, onClose, reservation, onUpdate, canManage = false }: Props) {
    const { data: session } = useSession();
    const [processing, setProcessing] = useState(false);

    if (!isOpen || !reservation) return null;

    // Admin or R4/R5 logic provided via canManage
    const hasPermission = canManage || session?.user?.globalRole === "ADMIN" || session?.user?.isApprovedLeader;

    const handleStatus = async (status: "APPROVED" | "REJECTED") => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/ministry/reservations/${reservation.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                onUpdate();
                onClose();
            }
        } catch (e) {
            alert("Action failed");
        }
        setProcessing(false);
    };

    const handleDelete = async () => {
        if (!confirm("Cancel this reservation?")) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/ministry/reservations/${reservation.id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                onUpdate();
                onClose();
            }
        } catch (e) {
            alert("Action failed");
        }
        setProcessing(false);
    };

    const resources = reservation.resourceData || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`p-4 text-center border-b relative ${reservation.status === 'APPROVED' ? 'bg-green-50' : reservation.status === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <button onClick={onClose} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>

                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2
                        ${reservation.status === 'APPROVED' ? 'bg-green-200 text-green-700' : reservation.status === 'REJECTED' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'}
                    `}>
                        {reservation.status}
                    </span>

                    <h3 className="font-bold text-slate-800">{reservation.position.replace(/_/g, " ")}</h3>
                    <div className="text-sm font-mono text-slate-500 mt-1">
                        {new Date(reservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 relative overflow-hidden border border-slate-300">
                            {reservation.user.image ? (
                                <Image src={reservation.user.image} alt={reservation.user.name} fill className="object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full font-bold text-slate-400">{reservation.user.name?.[0]}</div>
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">{reservation.user.displayName || reservation.user.name}</div>
                            <div className="text-xs text-slate-500 font-mono">ID: {reservation.user.id.substring(0, 8)}</div>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-sm space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase">Resource Commitment</h4>
                        {Object.entries(resources).length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(resources).map(([key, val]) => (
                                    <div key={key}>
                                        <span className="text-slate-500 text-xs block">{key}</span>
                                        <span className="font-mono font-bold text-slate-700">{val as React.ReactNode}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-slate-400 italic text-xs">No resources specified</div>
                        )}
                    </div>

                    {/* Admin Actions */}
                    {hasPermission && reservation.status === "PENDING" && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={() => handleStatus("REJECTED")}
                                disabled={processing}
                                className="py-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 font-bold rounded flex items-center justify-center gap-1 transition-colors"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleStatus("APPROVED")}
                                disabled={processing}
                                className="py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded flex items-center justify-center gap-1 transition-colors"
                            >
                                Approve
                            </button>
                        </div>
                    )}

                    {/* Delete (Owner or Admin) */}
                    {(hasPermission || session?.user.id === reservation.userId) && (
                        <button
                            onClick={handleDelete}
                            disabled={processing}
                            className="w-full py-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                            <Trash2 size={14} /> Cancel Reservation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
