"use client";

import { useState, useEffect } from "react";
import { Bell, Send } from "lucide-react";

export default function NotificationTestUI() {
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isPwa, setIsPwa] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setPermission(Notification.permission);
        }
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone) {
            setIsPwa(true);
        }
    }, []);

    const requestPermission = async () => {
        const res = await Notification.requestPermission();
        setPermission(res);
    };

    const sendTestNotification = async () => {
        if (permission !== "granted") return alert("Permission not granted");

        // 1. Local SW Notification (Instant)
        if ("serviceWorker" in navigator) {
            const reg = await navigator.serviceWorker.ready;
            reg.showNotification("WOS Community Test", {
                body: "This is a local test notification to verify your device settings.",
                icon: "/icons/icon-192x192.png",
                badge: "/icons/badge-72x72.png"
            });
        } else {
            new Notification("WOS Community Test", {
                body: "Standard Notification API Test"
            });
        }
    };

    // Only show if PWA or at least mobile-like context where user cares about this
    // User requested: "PWA를 이용하는 사람은" (People using PWA)
    if (!isPwa) return null;

    return (
        <div className="mt-12 py-8 border-t border-slate-800 text-center">
            <h3 className="text-slate-500 font-bold text-sm mb-4 uppercase tracking-widest">PWA Diagnostics</h3>

            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Notification Permission:</span>
                    <span className={`font-bold ${permission === "granted" ? "text-emerald-400" : "text-amber-400"}`}>
                        {permission.toUpperCase()}
                    </span>
                </div>

                <div className="flex gap-3">
                    {permission !== "granted" && (
                        <button
                            onClick={requestPermission}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                        >
                            <Bell size={16} /> Request Permission
                        </button>
                    )}

                    <button
                        onClick={sendTestNotification}
                        disabled={permission !== "granted"}
                        className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-lg shadow-sky-900/20"
                    >
                        <Send size={16} /> Send Test Notification
                    </button>
                </div>
                <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
                    Note: If you don't receive it, check your device's "Do Not Disturb" settings or App Notification permissions in Android/iOS settings.
                </p>
            </div>
        </div>
    );
}
