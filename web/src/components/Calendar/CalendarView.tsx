"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isToday, differenceInSeconds } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface Event {
    id: string;
    title: string;
    startTime: string;
    endTime?: string;
    description: string | null;
    allianceId?: string;
    allianceName?: string;
    type?: 'EVENT' | 'CONSTRUCTION' | 'TRAINING' | 'MINISTRY';
}

export default function CalendarView({ events }: { events: Event[] }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [nextEvent, setNextEvent] = useState<Event | null>(null);

    // Filter events for selected day
    const selectedDateEvents = events.filter(e => isSameDay(new Date(e.startTime), selectedDate));

    // Find next upcoming event
    useEffect(() => {
        const now = new Date();
        const upcoming = events
            .filter(e => new Date(e.startTime) > now)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        if (upcoming.length > 0) {
            setNextEvent(upcoming[0]);
        } else {
            setNextEvent(null);
        }
    }, [events]);

    // Timer Logic
    useEffect(() => {
        if (!nextEvent) return;

        const timer = setInterval(() => {
            const now = new Date();
            const start = new Date(nextEvent.startTime);
            const diff = differenceInSeconds(start, now);

            if (diff <= 0) {
                setTimeLeft("Started");
                // Optional: trigger refresh
            } else {
                const hours = Math.floor(diff / 3600);
                const minutes = Math.floor((diff % 3600) / 60);
                const seconds = diff % 60;
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [nextEvent]);

    // Calendar Grid Logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Calendar */}
            <div className="flex-1 bg-wos-surface border border-slate-700 rounded-xl p-6 shadow-xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-ice-500/10 rounded-lg text-ice-400">
                            <CalendarIcon size={24} />
                        </div>
                        <h2 className="text-3xl font-bold font-heading text-white">
                            {format(currentMonth, "MMMM yyyy")}
                        </h2>
                    </div>

                    <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-2 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"
                            aria-label="Previous Month"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setCurrentMonth(new Date())}
                            className="px-4 py-1.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors mx-1"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-2 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"
                            aria-label="Next Month"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-4 text-center">
                    {weekDays.map(d => (
                        <div key={d} className="text-slate-500 text-xs font-bold uppercase tracking-widest py-2">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {calendarDays.map((day, idx) => {
                        const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), day));
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedDate(day)}
                                className={`
                                    min-h-[80px] p-2 border border-slate-800 rounded relative cursor-pointer transition-colors
                                    ${isCurrentMonth ? 'bg-slate-900/50' : 'bg-slate-900/20 text-slate-600'}
                                    ${isSelected ? 'ring-2 ring-ice-500 bg-slate-800' : 'hover:bg-slate-800'}
                                `}
                            >
                                <div className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isTodayDate ? 'bg-fire-500 text-white' : ''}`}>
                                    {format(day, "d")}
                                </div>
                                {/* Event Dots */}
                                <div className="flex flex-wrap gap-1">
                                    {dayEvents.slice(0, 3).map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-ice-400"></div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <span className="text-[10px] text-slate-500">+</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Info Panel */}
            <div className="w-full lg:w-80 flex flex-col gap-6">

                {/* Next Event Timer Widget */}
                <div className="bg-gradient-to-br from-wos-surface to-slate-900 border border-ice-500/30 rounded-xl p-6 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-ice-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                    <h3 className="text-sm font-bold text-ice-400 uppercase tracking-widest mb-1">Next Operation</h3>

                    {nextEvent ? (
                        <div>
                            <div className="text-xl font-bold text-white mb-2 truncate" title={nextEvent.title}>
                                {nextEvent.title}
                            </div>
                            <div className="text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-ice-400 to-white">
                                {timeLeft}
                            </div>
                            <div className="text-xs text-slate-500 mt-2">
                                {format(new Date(nextEvent.startTime), "MMM d, h:mm a")}
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-500 py-4">No pending operations.</div>
                    )}
                </div>

                {/* Selected Day Events */}
                <div className="bg-wos-surface border border-slate-700 rounded-xl p-6 flex-1">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">
                        {format(selectedDate, "MMM d, yyyy")}
                    </h3>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {selectedDateEvents.length > 0 ? (
                            selectedDateEvents.map(event => (
                                <div key={event.id} className="bg-slate-800/50 p-3 rounded border border-slate-700 hover:border-ice-500/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-ice-500 text-sm">{event.title}</h4>
                                            {event.allianceName && (
                                                <span className="text-[10px] text-slate-500">{event.allianceName}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                                {format(new Date(event.startTime), "h:mm a")}
                                            </span>
                                            {event.type && event.type !== 'EVENT' && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${event.type === 'CONSTRUCTION' ? 'bg-amber-500/20 text-amber-500' :
                                                        event.type === 'TRAINING' ? 'bg-emerald-500/20 text-emerald-500' :
                                                            event.type === 'MINISTRY' ? 'bg-purple-500/20 text-purple-500' :
                                                                'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {event.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 line-clamp-2">
                                        {event.description || "No description"}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No events scheduled for this day.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
