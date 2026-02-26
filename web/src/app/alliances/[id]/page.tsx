"use client";

import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import BoardView from "@/components/BoardView";
import MinistryScheduler from "@/components/Ministry/MinistryScheduler";
import toast from 'react-hot-toast';

export interface AllianceMember {
    id: string;
    role: string;
    user: { id: string; name: string; displayName?: string; image?: string; serverCode?: string | null };
}

export interface AllianceChannel {
    id: string;
    name: string;
    minRole: string;
    minReadRole: string;
}

export interface AllianceBoard {
    id: string;
    title: string;
    slug: string;
    minRole: string;
    availableCategories: string[];
}

export interface AlliancePost {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    createdAt: string;
    category: string | null;
    author: { id: string; name: string; displayName: string | null; serverCode: string | null; image?: string };
    _count?: { comments: number; reactions?: number };
}

interface AllianceDetail {
    id: string;
    name: string;
    description: string;
    isMember: boolean;
    role: string | null;
    logo?: string;
    banner?: string;
    members?: AllianceMember[];
    channels?: AllianceChannel[];
    boards?: AllianceBoard[];
    enableConstructionRes?: boolean;
    enableTrainingRes?: boolean;
    autoSubscribeEvents?: boolean; // Current user's setting
    logoPos?: string;
    bannerPos?: string;
}

export interface AllianceEvent {
    id: string;
    title: string;
    startTime: string;
    recurrenceRule: string | null;
    isSubscribed?: boolean;
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        displayName: string;
        image: string;
    };
}

const BoardSidebarItem = ({ board, activeView, setActiveView, canManage, onOpenSettings }: {
    board: AllianceBoard, activeView: string, setActiveView: (v: string) => void, canManage: boolean, onOpenSettings: (board: AllianceBoard) => void
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`relative group/board w-full flex items-center gap-1 rounded-md transition-colors px-3 py-1.5 ${activeView === board.id ? "bg-slate-700 text-white font-medium" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="flex-1 flex items-center gap-2 overflow-hidden cursor-pointer min-w-0"
                onClick={() => setActiveView(board.id)}
            >
                <span className="text-slate-600 shrink-0">📄</span>
                <span className="truncate text-sm">{board.title}</span>
                {board.minRole && board.minRole !== "R1" && <span className="text-[10px] bg-slate-700 px-1 rounded text-slate-500 border border-slate-600 shrink-0">{board.minRole}+</span>}
            </div>

            {/* Gear Icon Trigger */}
            {canManage && (isHovered) && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenSettings(board);
                    }}
                    className="p-1 rounded cursor-pointer transition-colors shrink-0 text-slate-500 hover:text-ice-400 hover:bg-slate-700"
                >
                    ⚙️
                </button>
            )}
        </div>
    );
};

// Empty Line to clear modal definition


const DraggableImage = ({ src, position, onChange, className, fallbackText }: { src: string, position: string, onChange: (s: string) => void, className: string, fallbackText: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const [startPx, startPy] = (position || "50% 50%").split(" ").map(s => parseFloat(s));

        // Calculate available overflow
        const container = containerRef.current;
        const img = imgRef.current;
        if (!container || !img) return;

        const maxDX = img.getBoundingClientRect().width - container.getBoundingClientRect().width;
        const maxDY = img.getBoundingClientRect().height - container.getBoundingClientRect().height;

        const handleMouseMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;

            let newX = startPx;
            let newY = startPy;

            // Calculate percentage change based on overflow
            // If dragging LEFT (dx < 0), we show RIGHT side (Increase %)
            // Formula: -dx / maxOverflow * 100

            if (maxDX > 0) {
                const deltaPctX = (-dx / maxDX) * 100;
                newX = startPx + deltaPctX;
                newX = Math.max(0, Math.min(100, newX));
            }

            if (maxDY > 0) {
                const deltaPctY = (-dy / maxDY) * 100;
                newY = startPy + deltaPctY;
                newY = Math.max(0, Math.min(100, newY));
            }

            onChange(`${newX.toFixed(1)}% ${newY.toFixed(1)}%`);
        };

        const handleMouseUp = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    if (!src) return <div className={`${className} flex items-center justify-center text-slate-600 font-bold text-xs bg-slate-900`}>{fallbackText}</div>;

    return (
        <div ref={containerRef} className={`${className} overflow-hidden cursor-move relative touch-none group`} onMouseDown={handleMouseDown}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img ref={imgRef} src={src} className="w-full h-full object-cover pointer-events-none select-none" style={{ objectPosition: position || "50% 50%" }} draggable={false} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="text-[10px] text-white font-bold drop-shadow-md bg-black/50 px-1 rounded">Drag to adjust</span>
            </div>
        </div>
    );
};


export default function AllianceDashboard() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [alliance, setAlliance] = useState<AllianceDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Navigation State
    const [activeView, setActiveView] = useState<"dashboard" | string>("dashboard"); // "dashboard" or channelId
    const [dashboardTab, setDashboardTab] = useState("events");

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [msgInput, setMsgInput] = useState("");
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);
    const msgInputRef = useRef<HTMLTextAreaElement>(null);

    // Settings State (R5)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editLogo, setEditLogo] = useState("");
    const [editLogoPos, setEditLogoPos] = useState("50% 50%");
    const [editBanner, setEditBanner] = useState("");
    const [editBannerPos, setEditBannerPos] = useState("50% 50%");
    const [editConstRes, setEditConstRes] = useState(true);
    const [editTrainRes, setEditTrainRes] = useState(true);

    // Responsive Sidebar State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on view change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [activeView, dashboardTab]);

    // Board State
    // Board states from legacy mode unused in Next.js, skipping

    // Board Settings Modal State (Lifted Up)
    const [editingBoard, setEditingBoard] = useState<AllianceBoard | null>(null);
    const [editBoardTitle, setEditBoardTitle] = useState("");
    const [editBoardMinRole, setEditBoardMinRole] = useState("R1");
    const [editBoardCats, setEditBoardCats] = useState("");
    const [isBoardDeleting, setIsBoardDeleting] = useState(false);

    // Open Board Settings
    const openBoardSettings = (board: AllianceBoard) => {
        setEditingBoard(board);
        setEditBoardTitle(board.title);
        setEditBoardMinRole(board.minRole || "R1");
        setEditBoardCats((board.availableCategories || []).join(", "));
        setIsBoardDeleting(false);
    };

    // Save Board Settings
    const handleSaveBoard = async () => {
        if (!editingBoard) return;
        const newCats = editBoardCats.split(",").map((s: string) => s.trim()).filter(Boolean);

        await fetch("/api/alliance/board/update", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                boardId: editingBoard.id,
                newTitle: editBoardTitle,
                newMinRole: editBoardMinRole,
                newCategories: newCats
            })
        });
        fetchAllianceData();
        setEditingBoard(null);
    };

    // Delete Board

    // Channel Settings State
    const [editingChannel, setEditingChannel] = useState<AllianceChannel | null>(null);
    const [editChannelName, setEditChannelName] = useState("");
    const [editChannelMinRole, setEditChannelMinRole] = useState("R1");
    const [editChannelMinReadRole, setEditChannelMinReadRole] = useState("R1");

    const openChannelSettings = (channel: AllianceChannel) => {
        setEditingChannel(channel);
        setEditChannelName(channel.name);
        setEditChannelMinRole(channel.minRole || "R1");
        setEditChannelMinReadRole(channel.minReadRole || "R1");
    };

    const handleUpdateChannel = async () => {
        if (!editingChannel) return;
        await fetch("/api/alliance/channel/update", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                channelId: editingChannel.id,
                name: editChannelName,
                minRole: editChannelMinRole,
                minReadRole: editChannelMinReadRole
            })
        });
        fetchAllianceData();
        setEditingChannel(null);
    };

    const handleDeleteChannel = async () => {
        if (!editingChannel || !confirm("Delete this channel?")) return;
        await fetch("/api/alliance/channel/delete", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channelId: editingChannel.id })
        });
        fetchAllianceData();
        setEditingChannel(null);
        setActiveView("dashboard");
    };

    const handleDeleteBoard = async () => {
        if (!editingBoard) return;
        if (!confirm(`Delete board "${editingBoard.title}" and all its posts?`)) return;
        setIsBoardDeleting(true);
        await fetch("/api/alliance/board/delete", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ boardId: editingBoard.id })
        });
        if (activeView === editingBoard.id) setActiveView("dashboard");
        fetchAllianceData();
        setEditingBoard(null);
    };

    useEffect(() => {
        if (id) fetchAllianceData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (activeView !== "dashboard") {
            const isChannel = alliance?.channels?.some((c: AllianceChannel) => c.id === activeView);
            if (isChannel) {
                fetchMessages(activeView);
                const interval = setInterval(() => fetchMessages(activeView), 3000); // Poll for chat
                return () => clearInterval(interval);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeView, dashboardTab, id, alliance?.channels?.length]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchAllianceData = () => {
        fetch(`/api/alliance/${id}`)
            .then(async (res) => {
                if (!res.ok) {
                    toast.error("Access Denied: You must be a member to view this alliance.");
                    router.push("/alliances");
                    return null;
                }
                return res.json();
            })
            .then((data) => {
                if (!data) return;

                if (data.alliance) {
                    setAlliance({
                        ...data.alliance,
                        members: data.members,
                        channels: data.alliance.channels || [],
                        isMember: !!data.membership,
                        role: data.membership?.role || null,
                        autoSubscribeEvents: data.membership?.autoSubscribeEvents ?? true,
                    } as AllianceDetail);
                    setEditLogo(data.alliance.logo || "");
                    setEditLogoPos(data.alliance.logoPos || "50% 50%");
                    setEditBanner(data.alliance.banner || "");
                    setEditBannerPos(data.alliance.bannerPos || "50% 50%");
                    setEditConstRes(data.alliance.enableConstructionRes ?? true);
                    setEditTrainRes(data.alliance.enableTrainingRes ?? true);
                }
                setLoading(false);
            });
    };

    const fetchMessages = (channelId: string) => {
        fetch(`/api/alliance/channel/message/list?channelId=${channelId}`)
            .then(res => res.json())
            .then(data => {
                if (data.messages) setMessages(data.messages);
            });
    };

    // fetchPosts removed as it's no longer used in Next.js page
    const NoticeWidget = ({ alliance, setActiveView }: { alliance: AllianceDetail, setActiveView: (v: string) => void }) => {
        const boards = alliance.boards || [];
        const noticeBoard = boards.find((b: AllianceBoard) => b.title.includes("怨듭?") || b.title.toLowerCase().includes("notice"));
        const [notices, setNotices] = useState<AlliancePost[]>([]);

        useEffect(() => {
            if (noticeBoard) {
                fetch(`/api/post/list?boardId=${noticeBoard.id}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.posts) setNotices(data.posts.slice(0, 3));
                    });
            }
        }, [noticeBoard]);

        if (!noticeBoard || notices.length === 0) return null;

        return (
            <div className="mb-8 bg-indigo-900/20 border border-indigo-500/20 rounded-lg overflow-hidden">
                <div className="bg-indigo-500/10 px-4 py-3 flex justify-between items-center border-b border-indigo-500/10">
                    <h3 className="font-bold text-indigo-200 text-sm flex items-center gap-2">
                        📢 Alliance Notices
                    </h3>
                    <button
                        onClick={() => setActiveView(noticeBoard.id)}
                        className="text-xs text-indigo-300 hover:text-white transition-colors"
                    >
                        Go to Board →
                    </button>
                </div>
                <div className="divide-y divide-indigo-500/10">
                    {notices.map((post: AlliancePost) => (
                        <button
                            key={post.id}
                            onClick={() => setActiveView(noticeBoard.id)}
                            className="w-full text-left p-3 hover:bg-indigo-500/5 cursor-pointer transition-colors flex justify-between items-center gap-4 group"
                        >
                            <span className="text-sm text-slate-300 font-medium line-clamp-1 group-hover:text-indigo-300 transition-colors">{post.title}</span>
                            <span className="text-xs text-slate-500 whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const sendMessage = async () => {
        if (!msgInput.trim()) return;

        await fetch("/api/alliance/channel/message/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channelId: activeView, content: msgInput })
        });
        setMsgInput("");
        fetchMessages(activeView);
    };

    useEffect(() => {
        const input = msgInputRef.current;
        if (!input) return;

        input.style.height = "auto";
        const maxHeight = Math.round(window.innerHeight * 0.22);
        input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
    }, [msgInput, activeView]);

    const handleUpdateSettings = async () => {
        await fetch("/api/alliance/update", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                allianceId: id,
                logo: editLogo, logoPos: editLogoPos,
                banner: editBanner, bannerPos: editBannerPos,
                enableConstructionRes: editConstRes, enableTrainingRes: editTrainRes
            })
        });
        alert("Settings Updated!");
        setIsSettingsOpen(false);
        fetchAllianceData();
    };

    // Post submit logic removed (handled by BoardView component)

    // Sub-components re-definitions (EventsTab, etc.) - simplified for this replace
    const EventsTab = ({ allianceId }: { allianceId: string }) => {
        const [events, setEvents] = useState<AllianceEvent[]>([]);
        const [isCreating, setIsCreating] = useState(false);
        const [editingEventId, setEditingEventId] = useState<string | null>(null); // New State
        const [newTitle, setNewTitle] = useState("");
        const [newTime, setNewTime] = useState("");

        // Recurrence State
        const [freq, setFreq] = useState("NONE"); // NONE, DAILY, WEEKLY, BIWEEKLY
        const [count, setCount] = useState("");

        const loadEvents = () => {
            fetch(`/api/event/list?allianceId=${allianceId}`)
                .then(res => res.json()).then(data => { if (data.events) setEvents(data.events); });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
        useEffect(() => { loadEvents(); }, [allianceId]);

        const handleSubscribe = async (eventId: string, currentStatus: boolean) => {
            const res = await fetch("/api/event/subscribe", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId, subscribe: !currentStatus })
            });
            if (res.ok) loadEvents();
        };

        const handleSaveEvent = async () => {
            if (!newTitle || !newTime) return alert("Fill all fields");

            // Build RRULE
            let rrule = "";
            if (freq !== "NONE") {
                rrule = `FREQ=${freq === 'BIWEEKLY' ? 'WEEKLY;INTERVAL=2' : freq === 'EVERY_OTHER_DAY' ? 'DAILY;INTERVAL=2' : freq}`;
                if (count && parseInt(count) > 0) {
                    rrule += `;COUNT=${count}`;
                }
            }

            const url = editingEventId ? "/api/event/update" : "/api/event/create";
            const body: Record<string, unknown> = {
                allianceId,
                title: newTitle,
                startTime: newTime,
                recurrenceRule: rrule || null
            };

            if (editingEventId) body.eventId = editingEventId;

            const res = await fetch(url, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsCreating(false);
                setEditingEventId(null);
                loadEvents();
                setNewTitle(""); setNewTime(""); setFreq("NONE"); setCount("");
            }
            else alert("Failed");
        };

        const openEdit = (event: AllianceEvent) => {
            setEditingEventId(event.id);
            setNewTitle(event.title);
            // newTime expects datetime-local format: YYYY-MM-DDTHH:mm
            const iso = new Date(event.startTime).toISOString().slice(0, 16);
            setNewTime(iso);

            // Parse RRULE
            if (event.recurrenceRule) {
                if (event.recurrenceRule.includes("INTERVAL=2") && event.recurrenceRule.includes("DAILY")) setFreq("EVERY_OTHER_DAY");
                else if (event.recurrenceRule.includes("INTERVAL=2") && event.recurrenceRule.includes("WEEKLY")) setFreq("BIWEEKLY");
                else if (event.recurrenceRule.includes("WEEKLY")) setFreq("WEEKLY");
                else if (event.recurrenceRule.includes("DAILY")) setFreq("DAILY");
                else setFreq("NONE");

                const countMatch = event.recurrenceRule.match(/COUNT=(\d+)/);
                if (countMatch) setCount(countMatch[1]);
                else setCount("");
            } else {
                setFreq("NONE");
                setCount("");
            }
            setIsCreating(true);
        };


        const handleToggleAutoSubscribe = async () => {
            const newState = !(alliance?.autoSubscribeEvents);
            await fetch("/api/alliance/member/settings", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ allianceId, autoSubscribeEvents: newState })
            });
            fetchAllianceData(); // Refresh parent state
        };

        const canManage = isR5 || alliance?.role === "R4";

        // Helper to display friendly RRULE
        const getRecurrenceLabel = (rrule: string) => {
            if (!rrule) return "";
            if (rrule.includes("FREQ=DAILY;INTERVAL=2")) return "Every Other Day";
            if (rrule.includes("FREQ=DAILY")) return "Daily";
            if (rrule.includes("FREQ=WEEKLY;INTERVAL=2")) return "Bi-Weekly";
            if (rrule.includes("FREQ=WEEKLY")) return "Weekly";
            return "Recurring";
        };

        return (
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <h3 className="font-bold text-white text-lg">Upcoming Events</h3>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={handleToggleAutoSubscribe}
                            className={`flex-1 md:flex-none px-3 py-2 rounded text-xs font-bold border transition-all ${alliance?.autoSubscribeEvents
                                ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/50 hover:bg-emerald-600/30"
                                : "bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600"}`}
                        >
                            {alliance?.autoSubscribeEvents ? "🔔 Auto-Sub: ON" : "🔕 Auto-Sub: OFF"}
                        </button>
                        {canManage && (
                            <button onClick={() => { setIsCreating(true); setEditingEventId(null); setNewTitle(""); setNewTime(""); setFreq("NONE"); setCount(""); }} className="flex-1 md:flex-none bg-sky-600 text-white px-4 py-2 rounded font-bold hover:bg-sky-500 text-sm whitespace-nowrap">
                                + New Event
                            </button>
                        )}
                    </div>
                </div>

                {events.map((event) => (
                    <div key={event.id} className="bg-slate-800 p-4 rounded border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:border-sky-500/50 transition-colors">
                        <div>
                            <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                {event.title}
                                {event.isSubscribed && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">Subscribed</span>}
                                {event.recurrenceRule && <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded border border-violet-500/30">↻ {getRecurrenceLabel(event.recurrenceRule)}</span>}
                            </h4>
                            <div className="text-sm text-sky-400 font-mono mt-1">
                                📅 {new Date(event.startTime).toLocaleString()}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <button
                                onClick={() => handleSubscribe(event.id, !!event.isSubscribed)}
                                className={`px-4 py-2 rounded font-bold text-sm transition-all ${event.isSubscribed
                                    ? "bg-slate-700 text-slate-400 hover:bg-rose-600 hover:text-white"
                                    : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                    }`}
                            >
                                {event.isSubscribed ? "🔔" : "🔕 Subscribe"}
                            </button>
                            {canManage && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Delete event?")) return;
                                            await fetch("/api/event/delete", {
                                                method: "POST", headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ eventId: event.id })
                                            });
                                            loadEvents();
                                        }}
                                        className="px-3 py-2 bg-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white rounded font-bold text-sm border border-rose-600/30"
                                    >
                                        ✕
                                    </button>
                                    <button
                                        onClick={() => openEdit(event)}
                                        className="px-3 py-2 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white rounded font-bold text-sm border border-slate-600"
                                        title="Edit Event"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))
                }
                {events.length === 0 && <p className="text-center text-slate-500 py-8">No scheduled events.</p>}

                {
                    isCreating && (
                        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-800 p-6 rounded border border-slate-700 w-full max-w-sm">
                                <h3 className="font-bold mb-4 text-white">{editingEventId ? "Edit Event Alarm" : "Create Event Alarm"}</h3>
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-400">Event Title</label>
                                    <input className="w-full bg-slate-900 p-2 rounded text-white border border-slate-600" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Bear Trap" />

                                    <label className="block text-xs font-bold text-slate-400">Start Time</label>
                                    <input type="datetime-local" className="w-full bg-slate-900 p-2 rounded text-white border border-slate-600 [color-scheme:dark]" value={newTime} onChange={e => setNewTime(e.target.value)} />

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1">Repeat</label>
                                            <select
                                                className="w-full bg-slate-900 p-2 rounded text-white border border-slate-600"
                                                value={freq}
                                                onChange={e => setFreq(e.target.value)}
                                            >
                                                <option value="NONE">None</option>
                                                <option value="DAILY">Daily</option>
                                                <option value="EVERY_OTHER_DAY">Every Other Day</option>
                                                <option value="WEEKLY">Weekly</option>
                                                <option value="BIWEEKLY">Bi-Weekly</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1">End After (Count)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-900 p-2 rounded text-white border border-slate-600 disabled:opacity-50"
                                                placeholder="Forever"
                                                value={count}
                                                onChange={e => setCount(e.target.value)}
                                                disabled={freq === "NONE"}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4">
                                        <button onClick={() => setIsCreating(false)} className="px-3 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                                        <button onClick={handleSaveEvent} className="px-4 py-2 bg-sky-600 rounded text-white font-bold text-sm hover:bg-sky-500">
                                            {editingEventId ? "Save Changes" : "Create Event"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    }

    /* Legacy ReservationsTab removed - moved to external component / redundant code */

    if (loading) return <div className="p-8 text-white">Loading...</div>;
    if (!alliance) return <div className="p-8 text-white">Alliance not found</div>;

    const isR5 = alliance.role === "R5";
    const isR4 = alliance.role === "R4";
    const canManage = isR5 || isR4;

    // Helper to find current view
    const activeChannel = alliance.channels?.find((c: AllianceChannel) => c.id === activeView);
    // Add boards to type definition if not present, but here we cast
    const activeBoard = alliance.boards?.find((b: AllianceBoard) => b.id === activeView);

    return (
        <div className="fixed top-20 bottom-4 left-4 right-4 md:left-4 md:right-8 bg-slate-900 text-white flex flex-col md:flex-row overflow-hidden rounded-xl border border-slate-700/50 shadow-2xl z-10">
            {/* Mobile Header */}
            <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-300 hover:text-white">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold">{alliance.name}</span>
                </div>
            </div>

            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* LEFT SIDEBAR (Channels) */}
            <div className={`
                fixed inset-y-0 left-0 z-[100] md:z-0 w-64 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0 
                transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 h-[100dvh] md:h-auto
                ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
            `}>
                {/* Mobile Close Button */}
                <div className="md:hidden absolute top-2 right-2 z-50">
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Identity */}
                <div
                    onClick={() => canManage && setIsSettingsOpen(true)}
                    className={`p-4 border-b border-slate-700 flex flex-col items-center gap-2 transition-colors ${canManage ? "cursor-pointer hover:bg-slate-700/50 group" : ""}`}
                >
                    <div className={`w-16 h-16 rounded-xl bg-slate-700 overflow-hidden border-2 border-slate-600 flex items-center justify-center ${canManage ? "group-hover:border-ice-500 transition-colors" : ""}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
                        {alliance.logo ? <img src={alliance.logo} className="w-full h-full object-cover" style={{ objectPosition: alliance.logoPos || "50% 50%" }} /> : <span className="text-2xl font-bold">{alliance.name[0]}</span>}
                    </div>
                    <div className="text-center">
                        <h2 className="font-bold leading-tight">{alliance.name}</h2>
                        {canManage && <span className="text-[10px] text-slate-500 group-hover:text-ice-400">Click to Manage</span>}
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <button
                        onClick={() => setActiveView("dashboard")}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-all ${activeView === "dashboard" ? "bg-ice-600 text-white shadow-lg shadow-ice-500/20" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"}`}
                    >
                        <span>🏠</span>
                        <span className="font-bold text-sm">Dashboard</span>
                    </button>

                    {/* Boards Section */}
                    <div className="mt-6">
                        <div className="px-3 mb-2 flex items-center justify-between group">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-300 transition-colors">Boards</span>
                            {canManage && (
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        const title = prompt("Board Title:");
                                        if (title) {
                                            const slug = title.toLowerCase().replace(/\s+/g, '-');
                                            await fetch("/api/alliance/board/create", {
                                                method: "POST", headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ allianceId: id, title, slug })
                                            });
                                            fetchAllianceData();
                                        }
                                    }}
                                    className="text-slate-500 hover:text-white" title="Create Board"
                                >
                                    +
                                </button>
                            )}
                        </div>
                        <div className="space-y-0.5 ml-1 pl-2 border-l border-slate-700/50">
                            {alliance.boards?.map((board: AllianceBoard) => (
                                <BoardSidebarItem
                                    key={board.id}
                                    board={board}
                                    activeView={activeView}
                                    setActiveView={setActiveView}
                                    canManage={canManage}
                                    onOpenSettings={openBoardSettings}
                                />
                            ))}
                            {(!alliance.boards || alliance.boards.length === 0) && (
                                <div className="px-3 text-xs text-slate-600 italic">No boards</div>
                            )}
                        </div>
                    </div>

                    {/* Text Channels Section */}
                    {alliance.channels && alliance.channels.length > 0 && (
                        <div className="mt-6">
                            <div className="px-3 mb-2 flex items-center justify-between group">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-300 transition-colors">Text Channels</span>
                                {isR5 && (
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const name = prompt("Channel Name:");
                                            if (name) {
                                                await fetch("/api/alliance/channel/create", {
                                                    method: "POST", headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ allianceId: id, name })
                                                });
                                                fetchAllianceData();
                                            }
                                        }}
                                        className="text-slate-500 hover:text-white" title="Add Channel"
                                    >
                                        +
                                    </button>
                                )}
                            </div>

                            <div className="space-y-0.5 ml-1 pl-2 border-l border-slate-700/50">
                                {alliance.channels?.map((channel: AllianceChannel) => (
                                    <div key={channel.id} className={`w-full rounded-md flex items-center gap-2 px-3 py-1.5 transition-colors group/item ${activeView === channel.id ? "bg-slate-700 text-white font-medium" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
                                        <button
                                            onClick={() => setActiveView(channel.id)}
                                            className="flex-1 text-left flex items-center gap-2 text-sm"
                                        >
                                            <span className="text-slate-600">#</span> {channel.name}
                                        </button>
                                        {canManage && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openChannelSettings(channel); }}
                                                className="opacity-0 group-hover/item:opacity-100 text-slate-500 hover:text-white transition-opacity"
                                                title="Settings"
                                            >
                                                ⚙️
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Footer (Settings) */}
                {canManage && (
                    <div className="p-3 border-t border-slate-700 bg-slate-800/50">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg text-sm font-bold transition-all border border-slate-600 hover:border-slate-500"
                        >
                            <span>⚙️</span> Alliance Settings
                        </button>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Banner Header */}
                <div className="h-48 relative bg-slate-800 border-b border-slate-700 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
                    {alliance.banner && <img src={alliance.banner} className="w-full h-full object-cover opacity-60" style={{ objectPosition: alliance.bannerPos || "50% 50%" }} />}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
                    <div className="absolute bottom-6 left-8">
                        <h1 className="text-3xl font-bold font-heading text-white">
                            {activeView === "dashboard"
                                ? "Alliance Dashboard"
                                : activeBoard
                                    ? activeBoard.title
                                    : activeChannel
                                        ? `# ${activeChannel.name}`
                                        : "Alliance"}
                        </h1>
                    </div>
                </div>

                {/* Content Body */}
                <div className={`flex-1 bg-slate-900 ${activeView === "dashboard" || activeBoard ? "overflow-y-auto p-6" : "overflow-hidden flex flex-col min-h-0"}`}>
                    {activeView === "dashboard" ? (
                        <>
                            {/* Notice Widget */}
                            {/* Notice Widget */}
                            <NoticeWidget alliance={alliance} setActiveView={setActiveView} />

                            {/* Dashboard Tabs */}
                            <div className="flex gap-4 border-b border-slate-700 mb-6">
                                {["events", "ministry", "members"].map((tab) => {
                                    const labels: Record<string, string> = {
                                        events: "Events",
                                        ministry: "Ministry Schedule",
                                        members: "Members"
                                    };
                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => setDashboardTab(tab)}
                                            className={`px-4 py-2 font-bold border-b-2 transition-colors ${dashboardTab === tab ? "border-sky-500 text-sky-400" : "border-transparent text-slate-400 hover:text-white"}`}
                                        >
                                            {labels[tab]}
                                        </button>
                                    );
                                })}
                            </div>

                            {dashboardTab === "members" && (
                                <div className="space-y-8">
                                    {["R5", "R4", "Members"].map((tier) => {
                                        const tierMembers = alliance.members?.filter((m: AllianceMember) => {
                                            if (tier === "R5") return m.role === "R5";
                                            if (tier === "R4") return m.role === "R4";
                                            return !["R5", "R4"].includes(m.role);
                                        }).sort((a: AllianceMember, b: AllianceMember) => {
                                            const ranks: Record<string, number> = { "R3": 3, "R2": 2, "R1": 1 };
                                            return (ranks[b.role] || 0) - (ranks[a.role] || 0);
                                        });

                                        if (!tierMembers?.length) return null;

                                        return (
                                            <div key={tier}>
                                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                    {tier === "R5" ? <span className="text-amber-500">👑 Alliance Leader (R5)</span> :
                                                        tier === "R4" ? <span className="text-purple-400">⚔️ Officers (R4)</span> :
                                                            <span className="text-slate-400">🛡️ Members</span>}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {tierMembers.map((member: AllianceMember) => {
                                                        // Permission Logic
                                                        // Current User Rank
                                                        const rankMap: Record<string, number> = { "R5": 5, "R4": 4, "R3": 3, "R2": 2, "R1": 1 };
                                                        const myRankStr = alliance.role || "R1";
                                                        const myRank = rankMap[myRankStr] || 1;

                                                        // Target Rank
                                                        const targetRank = rankMap[member.role] || 1;

                                                        const canManage = myRank > targetRank && myRank >= 4;

                                                        return (
                                                            <div key={member.id} className="bg-slate-800 p-4 rounded border border-slate-700 relative group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold text-white relative">
                                                                        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
                                                                        {member.user.image ? <img src={member.user.image} className="w-full h-full rounded-full object-cover" /> : member.user.displayName?.[0]}
                                                                        {member.role === "R5" && <div className="absolute -top-1 -right-1 text-xs">👑</div>}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-white">{member.user.displayName}</div>
                                                                        <div className={`text-xs font-bold ${member.role === "R5" ? "text-amber-500" : member.role === "R4" ? "text-purple-400" : "text-slate-500"}`}>
                                                                            {member.role} {member.user.serverCode && <span className="text-slate-600 font-normal">| {member.user.serverCode}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Controls */}
                                                                {canManage && (
                                                                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-wrap gap-2">
                                                                        {/* Promote/Demote */}
                                                                        <select
                                                                            className="bg-slate-900 text-xs p-1 rounded border border-slate-700 text-slate-300"
                                                                            value={member.role}
                                                                            onChange={async (e) => {
                                                                                const newRole = e.target.value;
                                                                                if (!confirm(`Change role to ${newRole}?`)) return;
                                                                                await fetch("/api/alliance/member/update", {
                                                                                    method: "POST", headers: { "Content-Type": "application/json" },
                                                                                    body: JSON.stringify({ memberId: member.id, newRole })
                                                                                });
                                                                                fetchAllianceData();
                                                                            }}
                                                                        >
                                                                            <option disabled>{member.role}</option>
                                                                            {["R4", "R3", "R2", "R1"].filter(r => {
                                                                                const rMap: Record<string, number> = { "R4": 4, "R3": 3, "R2": 2, "R1": 1 };
                                                                                const rRank = rMap[r] || 1;
                                                                                return myRank > rRank; // Can only promote to rank strictly lower than self
                                                                            }).map(r => (
                                                                                r !== member.role && <option key={r} value={r}>Set {r}</option>
                                                                            ))}
                                                                        </select>

                                                                        {/* Transfer Leadership (R5 -> R4 only) */}
                                                                        {isR5 && member.role === "R4" && (
                                                                            <button
                                                                                onClick={async () => {
                                                                                    const confirmText = prompt(`Type "TRANSFER" to confirm transferring leadership to ${member.user.displayName}. You will become R4.`);
                                                                                    if (confirmText === "TRANSFER") {
                                                                                        await fetch("/api/alliance/transfer", {
                                                                                            method: "POST", headers: { "Content-Type": "application/json" },
                                                                                            body: JSON.stringify({ targetUserId: member.user.id, allianceId: id })
                                                                                        });
                                                                                        fetchAllianceData();
                                                                                    }
                                                                                }}
                                                                                className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded hover:bg-amber-500/20"
                                                                            >
                                                                                Give Lead
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {dashboardTab === "ministry" && (
                                <MinistryScheduler allianceId={id as string} />
                            )}

                            {dashboardTab === "events" && <EventsTab allianceId={id as string} />}
                        </>
                    ) : activeBoard ? (
                        <div className="max-w-5xl mx-auto">
                            <BoardView
                                slug={activeBoard.slug}
                                isEmbedded={true}
                                writeUrl={`/alliances/${id}/boards/${activeBoard.id}/write`}
                            />
                        </div>
                    ) : (
                        // CHAT INTERFACE
                        <div className="flex flex-col h-full min-h-0">
                            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 mb-4 pr-2">
                                {messages.map(msg => (
                                    <div key={msg.id} className="flex gap-3 group hover:bg-white/5 p-2 rounded -mx-2 relative">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-white font-bold">
                                            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
                                            {msg.sender.image ? <img src={msg.sender.image} className="rounded-full" /> : msg.sender.displayName?.[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-bold text-sky-400">{msg.sender.displayName}</span>
                                                <span className="text-[10px] text-slate-500">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                            </div>

                                            {editingMsgId === msg.id ? (
                                                <div className="mt-1">
                                                    <input
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-white text-sm"
                                                        value={editContent}
                                                        onChange={e => setEditContent(e.target.value)}
                                                        autoFocus
                                                        onKeyDown={async (e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                await fetch("/api/alliance/channel/message/update", {
                                                                    method: "POST", headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({ messageId: msg.id, content: editContent })
                                                                });
                                                                setEditingMsgId(null);
                                                                fetchMessages(activeView);
                                                            } else if (e.key === 'Escape') {
                                                                setEditingMsgId(null);
                                                            }
                                                        }}
                                                    />
                                                    <div className="text-[10px] text-slate-500 mt-1">Press Enter to save, Esc to cancel</div>
                                                </div>
                                            ) : (
                                                <p className="text-slate-300 text-sm leading-relaxed break-words">{msg.content}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 absolute right-2 top-2 bg-slate-800/80 rounded px-1">
                                            {session?.user?.id === msg.sender.id && (
                                                <button
                                                    onClick={() => { setEditingMsgId(msg.id); setEditContent(msg.content); }}
                                                    className="p-1 text-slate-400 hover:text-white"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                            )}
                                            {(session?.user?.id === msg.sender.id || canManage) && (
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm("Delete message?")) return;
                                                        await fetch("/api/alliance/channel/message/delete", {
                                                            method: "POST", headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ messageId: msg.id })
                                                        });
                                                        fetchMessages(activeView);
                                                    }}
                                                    className="p-1 text-slate-400 hover:text-rose-500"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    await sendMessage();
                                }}
                                className="mt-auto"
                            >
                                <textarea
                                    ref={msgInputRef}
                                    rows={1}
                                    className="w-full resize-none overflow-y-auto bg-slate-800 border-none py-3 px-4 rounded text-white placeholder:text-slate-500 focus:ring-1 focus:ring-sky-500 max-h-[22vh]"
                                    placeholder={`Message #${alliance.channels?.find((c: AllianceChannel) => c.id === activeView)?.name || "channel"}`}
                                    value={msgInput}
                                    onChange={e => setMsgInput(e.target.value)}
                                    onKeyDown={async (e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            await sendMessage();
                                        }
                                    }}
                                />
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* SETTINGS MODAL */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 p-8 rounded-lg max-w-3xl w-full border border-slate-700 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Alliance Settings</h2>
                        <div className="space-y-6 mb-6">

                            {/* Banner First (Prominent) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Banner & Logo Layout</label>
                                <div className="space-y-4 bg-slate-900 p-4 rounded-xl border border-slate-700">
                                    <p className="text-xs text-slate-500 mb-2">Drag the images below to adjust their position.</p>

                                    {/* Combined Preview for Context */}
                                    <div className="relative w-full aspect-[5/1] rounded-lg overflow-hidden border border-slate-600 bg-slate-800 group">
                                        <DraggableImage
                                            src={editBanner}
                                            position={editBannerPos}
                                            onChange={setEditBannerPos}
                                            className="absolute inset-0 w-full h-full"
                                            fallbackText="NO BANNER"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />

                                        {/* Logo Overlay Preview */}
                                        <div className="absolute bottom-4 left-6 w-16 h-16 rounded-xl bg-slate-700 overflow-hidden border-2 border-slate-600 z-10 shadow-lg">
                                            <DraggableImage
                                                src={editLogo}
                                                position={editLogoPos}
                                                onChange={setEditLogoPos}
                                                className="w-full h-full"
                                                fallbackText="LOGO"
                                            />
                                        </div>
                                    </div>

                                    {/* Upload Controls Row */}
                                    <div className="grid grid-cols-2 gap-6 pt-2">
                                        {/* Banner Upload */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Update Banner</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const fd = new FormData();
                                                        fd.append("file", file);
                                                        const res = await fetch("/api/upload", { method: "POST", body: fd });
                                                        if (res.ok) {
                                                            const data = await res.json();
                                                            setEditBanner(data.url);
                                                            setEditBannerPos("50% 50%");
                                                        }
                                                    }}
                                                />
                                                {editBanner && <button onClick={() => { setEditBanner(""); setEditBannerPos("50% 50%"); }} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-rose-600 hover:text-white shrink-0">Default</button>}
                                            </div>
                                        </div>

                                        {/* Logo Upload */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Update Logo</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const fd = new FormData();
                                                        fd.append("file", file);
                                                        const res = await fetch("/api/upload", { method: "POST", body: fd });
                                                        if (res.ok) {
                                                            const data = await res.json();
                                                            setEditLogo(data.url);
                                                            setEditLogoPos("50% 50%");
                                                        }
                                                    }}
                                                />
                                                {editLogo && <button onClick={() => { setEditLogo(""); setEditLogoPos("50% 50%"); }} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-rose-600 hover:text-white shrink-0">Default</button>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700">
                                <h3 className="text-sm font-bold text-slate-300 mb-2">Features</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <input type="checkbox" checked={editConstRes} onChange={e => setEditConstRes(e.target.checked)} className="w-4 h-4 rounded bg-slate-700" id="feat_const" />
                                    <label htmlFor="feat_const" className="text-sm">Enable Construction Reservation</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={editTrainRes} onChange={e => setEditTrainRes(e.target.checked)} className="w-4 h-4 rounded bg-slate-700" id="feat_train" />
                                    <label htmlFor="feat_train" className="text-sm">Enable Training Reservation</label>
                                </div>
                            </div>
                        </div>

                        {/* R5 Danger Zone */}
                        {isR5 && (
                            <div className="mb-6 p-4 border border-rose-500/30 bg-rose-500/10 rounded">
                                <h3 className="text-rose-400 font-bold mb-2">Danger Zone</h3>
                                <button
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to disband this alliance? This cannot be undone.")) {
                                            const res = await fetch("/api/alliance/delete", {
                                                method: "POST", headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ allianceId: id })
                                            });
                                            if (res.ok) window.location.href = "/alliances";
                                            else alert("Failed to disband");
                                        }
                                    }}
                                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded"
                                >
                                    Disband Alliance
                                </button>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button onClick={handleUpdateSettings} className="px-4 py-2 bg-emerald-600 rounded font-bold hover:bg-emerald-500">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* BOARD SETTINGS MODAL */}
            {editingBoard && (
                <div
                    className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 cursor-default"
                    onClick={(e) => { e.stopPropagation(); setEditingBoard(null); }}
                >
                    <div className="bg-slate-800 p-8 rounded-lg max-w-md w-full border border-slate-700 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-6">Board Settings</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Board Name</label>
                                <input
                                    className="w-full bg-slate-900 p-2 rounded text-white border border-slate-700 focus:border-ice-500 outline-none"
                                    value={editBoardTitle}
                                    onChange={e => setEditBoardTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Categories (Comma separated)</label>
                                <input
                                    className="w-full bg-slate-900 p-2 rounded text-white border border-slate-700 focus:border-ice-500 outline-none"
                                    placeholder="e.g. Strategy, General, Questions"
                                    value={editBoardCats}
                                    onChange={e => setEditBoardCats(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Minimum Write Permission</label>
                                <select
                                    className="w-full bg-slate-900 p-2 rounded text-white border border-slate-700 focus:border-ice-500 outline-none"
                                    value={editBoardMinRole}
                                    onChange={e => setEditBoardMinRole(e.target.value)}
                                >
                                    <option value="R1">R1 (Everyone)</option>
                                    <option value="R2">R2 (Members)</option>
                                    <option value="R3">R3 (Veterans)</option>
                                    <option value="R4">R4 (Officers Only)</option>
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Higher ranks can always write. Reading is open to everyone.
                                </p>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="mb-6 p-4 border border-rose-500/30 bg-rose-500/10 rounded">
                            <h3 className="text-rose-400 font-bold mb-2 text-sm">Danger Zone</h3>
                            <button
                                onClick={handleDeleteBoard}
                                disabled={isBoardDeleting}
                                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2 rounded text-sm transition-colors"
                            >
                                {isBoardDeleting ? "Deleting..." : "Delete Board"}
                            </button>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingBoard(null)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveBoard}
                                className="px-4 py-2 bg-emerald-600 rounded font-bold hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CHANNEL SETTINGS MODAL */}
            {editingChannel && (
                <div
                    className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 cursor-default"
                    onClick={(e) => { e.stopPropagation(); setEditingChannel(null); }}
                >
                    <div className="bg-slate-800 p-8 rounded-lg max-w-md w-full border border-slate-700 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-6">Channel Settings</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Channel Name</label>
                                <input
                                    className="w-full bg-slate-900 p-2 rounded text-white border border-slate-700 focus:border-ice-500 outline-none"
                                    value={editChannelName}
                                    onChange={e => setEditChannelName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Minimum Write Permission</label>
                                <select
                                    className="w-full bg-slate-900 p-2 rounded text-white border border-slate-700 focus:border-ice-500 outline-none"
                                    value={editChannelMinRole}
                                    onChange={e => setEditChannelMinRole(e.target.value)}
                                >
                                    <option value="R1">R1 (Everyone)</option>
                                    <option value="R2">R2 (Members)</option>
                                    <option value="R3">R3 (Veterans)</option>
                                    <option value="R4">R4 (Officers Only)</option>
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Higher ranks can always write. Reading is open to everyone.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Minimum View Permission</label>
                                <select
                                    className="w-full bg-slate-900 p-2 rounded text-white border border-slate-700 focus:border-ice-500 outline-none"
                                    value={editChannelMinReadRole}
                                    onChange={e => setEditChannelMinReadRole(e.target.value)}
                                >
                                    <option value="R1">R1 (Visible to All)</option>
                                    <option value="R2">R2 (Members+)</option>
                                    <option value="R3">R3 (Veterans+)</option>
                                    <option value="R4">R4 (Officers Only)</option>
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Users below this rank will NOT see this channel in the list.
                                </p>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="mb-6 p-4 border border-rose-500/30 bg-rose-500/10 rounded">
                            <h3 className="text-rose-400 font-bold mb-2 text-sm">Danger Zone</h3>
                            <button
                                onClick={handleDeleteChannel}
                                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded text-sm transition-colors"
                            >
                                Delete Channel
                            </button>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingChannel(null)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateChannel}
                                className="px-4 py-2 bg-emerald-600 rounded font-bold hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
