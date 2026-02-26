"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import CalendarView from "@/components/Calendar/CalendarView";

interface Event {
    id: string;
    title: string;
    startTime: string;
    description: string | null;
}

export default function CalendarPage() {
    const { data: session } = useSession();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/calendar/my-schedule")
            .then(res => res.json())
            .then(data => {
                if (data.events) setEvents(data.events);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);


    return (
        <div className="min-h-screen bg-wos-bg text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-heading text-ice-500">Alliance Operations</h1>
                        <p className="text-slate-400 text-sm mt-1">Coordinate Bear Trap, Fortress, and events with your alliance.</p>
                    </div>
                    <a href="/api/event/ics" target="_blank" className="bg-slate-800 border border-slate-700 hover:border-ice-500 text-ice-400 px-4 py-2 rounded text-sm transition-all flex items-center gap-2">
                        <span>달력 다운받기</span>
                    </a>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ice-500"></div>
                    </div>
                ) : (
                    <CalendarView events={events} />
                )}
            </div>
        </div>
    );
}
