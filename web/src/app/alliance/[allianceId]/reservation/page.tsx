"use client";

import { useSession } from "next-auth/react";
import { Loader2, Shield } from "lucide-react";
import MinistryScheduler from "@/components/Ministry/MinistryScheduler";
import { useParams } from "next/navigation";

export default function AllianceReservationPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const allianceId = params.allianceId as string;

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-wos-bg flex items-center justify-center">
                <Loader2 className="animate-spin text-ice-500" size={48} />
            </div>
        );
    }

    // Auth Check
    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen bg-wos-bg flex flex-col items-center justify-center p-4">
                <Shield size={64} className="text-slate-600 mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
                <p className="text-slate-400 mb-6">You must be signed in to access the Ministry Schedule.</p>
                <a href="/api/auth/signin" className="bg-ice-600 hover:bg-ice-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                    Sign In
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-wos-bg p-4 md:p-8">
            <div className="max-w-[1600px] mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold font-heading text-white mb-2">
                        <span className="text-ice-500">Ministry</span> Schedule
                    </h1>
                    <p className="text-slate-400">
                        Maximize your state's power by reserving the right Minister for the right day.
                        Requests must be approved by the Presidency.
                    </p>
                </header>

                <MinistryScheduler allianceId={allianceId} />
            </div>
        </div>
    );
}
