"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface MessageData {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    sender?: { displayName: string | null };
    receiver?: { displayName: string | null };
}

interface BlockedUserData {
    id: string;
    displayName: string | null;
    serverCode: string | null;
}

interface SelectableUser {
    id: string;
    displayName: string | null;
}

export default function MessagesPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<BlockedUserData[]>([]);
    const [activeTab, setActiveTab] = useState("inbox");
    const [loading, setLoading] = useState(false);

    // Compose State
    const [servers, setServers] = useState<string[]>([]);
    const [users, setUsers] = useState<SelectableUser[]>([]);
    const [selectedServer, setSelectedServer] = useState("");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [content, setContent] = useState("");

    useEffect(() => {
        // Fetch Servers
        fetch("/api/server/list").then(res => res.json()).then(data => { if (data.servers) setServers(data.servers); });
    }, []);

    useEffect(() => {
        if (selectedServer) {
            fetch(`/api/user/list-by-server?serverCode=${encodeURIComponent(selectedServer)}`)
                .then(res => res.json()).then(data => { if (data.users) setUsers(data.users); });
        } else {
            setUsers([]);
        }
    }, [selectedServer]);

    const fetchMessages = (type: string) => {
        setLoading(true);
        fetch(`/api/message/list?type=${type}`)
            .then(res => res.json())
            .then(data => {
                if (data.messages) setMessages(data.messages);
                setLoading(false);
            });
    };

    const fetchBlocked = () => {
        setLoading(true);
        fetch("/api/message/blocked")
            .then(res => res.json())
            .then(data => {
                if (data.blockedUsers) setBlockedUsers(data.blockedUsers);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (activeTab === "blocked") {
            fetchBlocked();
        } else if (activeTab !== "compose") {
            fetchMessages(activeTab);
        }
    }, [activeTab]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) return alert("Select a receiver");

        const res = await fetch("/api/message/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ receiverId: selectedUserId, content })
        });
        const data = await res.json();
        if (res.ok) {
            alert("Sent!");
            setSelectedServer("");
            setSelectedUserId("");
            setContent("");
            setActiveTab("outbox");
        } else {
            alert(data.error);
        }
    };

    const handleBlock = async (userId: string) => {
        if (!confirm("Block this user? You will not receive messages from them.")) return;
        const res = await fetch("/api/message/block", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });
        if (res.ok) {
            alert("Blocked");
            if (activeTab === "blocked") fetchBlocked();
            else fetchMessages(activeTab); // refresh to potentially hide or just update
        } else {
            alert("Failed to block");
        }
    };

    const handleUnblock = async (userId: string) => {
        const res = await fetch("/api/message/unblock", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });
        if (res.ok) fetchBlocked();
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto bg-slate-800 rounded-lg border border-slate-700 min-h-[600px] flex flex-col">
                <div className="flex border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab("inbox")}
                        className={`flex-1 py-4 font-bold ${activeTab === "inbox" ? "text-sky-400 border-b-2 border-sky-400 bg-slate-700/50" : "text-slate-400 hover:text-white"}`}
                    >
                        Inbox
                    </button>
                    <button
                        onClick={() => setActiveTab("outbox")}
                        className={`flex-1 py-4 font-bold ${activeTab === "outbox" ? "text-violet-400 border-b-2 border-violet-400 bg-slate-700/50" : "text-slate-400 hover:text-white"}`}
                    >
                        Outbox
                    </button>
                    <button
                        onClick={() => setActiveTab("compose")}
                        className={`flex-1 py-4 font-bold ${activeTab === "compose" ? "text-emerald-400 border-b-2 border-emerald-400 bg-slate-700/50" : "text-slate-400 hover:text-white"}`}
                    >
                        Compose
                    </button>
                    <button
                        onClick={() => setActiveTab("blocked")}
                        className={`flex-1 py-4 font-bold ${activeTab === "blocked" ? "text-rose-400 border-b-2 border-rose-400 bg-slate-700/50" : "text-slate-400 hover:text-white"}`}
                    >
                        Blocked
                    </button>
                </div>

                <div className="p-6 flex-1">
                    {activeTab === "compose" ? (
                        <form onSubmit={handleSend} className="space-y-4 max-w-lg mx-auto mt-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Server</label>
                                    <select
                                        className="w-full bg-slate-700 p-2 rounded text-white border border-slate-600"
                                        value={selectedServer}
                                        onChange={e => { setSelectedServer(e.target.value); setSelectedUserId(""); }}
                                        required
                                    >
                                        <option value="">Select Server</option>
                                        {servers.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Receiver</label>
                                    <select
                                        className="w-full bg-slate-700 p-2 rounded text-white border border-slate-600 disabled:opacity-50"
                                        value={selectedUserId}
                                        onChange={e => setSelectedUserId(e.target.value)}
                                        required
                                        disabled={!selectedServer}
                                    >
                                        <option value="">Select User</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.displayName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Message</label>
                                <textarea
                                    className="w-full bg-slate-700 p-2 rounded text-white h-32 border border-slate-600"
                                    placeholder="Type your message..."
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded font-bold text-white transition-colors">Send Message</button>
                        </form>
                    ) : activeTab === "blocked" ? (
                        <div className="space-y-2">
                            {loading ? <p>Loading...</p> : blockedUsers.map(u => (
                                <div key={u.id} className="p-4 bg-slate-700/30 rounded border border-slate-700 flex justify-between items-center">
                                    <span className="font-bold text-white">{u.displayName} ({u.serverCode})</span>
                                    <button
                                        onClick={() => handleUnblock(u.id)}
                                        className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm text-white"
                                    >
                                        Unblock
                                    </button>
                                </div>
                            ))}
                            {!loading && blockedUsers.length === 0 && <p className="text-center text-slate-500 py-12">No blocked users.</p>}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {loading ? <p>Loading...</p> : messages.map(msg => (
                                <div key={msg.id} className="p-4 bg-slate-700/30 rounded border border-slate-700 hover:bg-slate-700/50 group relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white">
                                            {activeTab === 'inbox' ? `From: ${msg.sender?.displayName || "Unknown"}` : `To: ${msg.receiver?.displayName || "Unknown"}`}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleString()}</span>
                                            {activeTab === 'inbox' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleBlock(msg.senderId); }}
                                                    className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-rose-900/50 text-rose-400 text-xs rounded hover:bg-rose-900 hover:text-white transition-all"
                                                >
                                                    Block
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-slate-300 line-clamp-2">{msg.content}</p>
                                </div>
                            ))}
                            {!loading && messages.length === 0 && <p className="text-center text-slate-500 py-12">No messages.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
