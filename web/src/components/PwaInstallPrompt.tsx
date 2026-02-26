"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { X, Download } from "lucide-react";

export default function PwaInstallPrompt() {
    const { data: session } = useSession();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show for logged in users
        if (!session?.user) return;

        // Check if already installed (standalone)
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        // iOS Safari check (standalone is not in matchMedia on older versions, but navigator.standalone exists)
        if ((window.navigator as any).standalone === true) return;

        // Check if dismissed
        const dismissedUntil = localStorage.getItem("pwa_dismiss_until");
        if (dismissedUntil && parseInt(dismissedUntil) > Date.now()) return;

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }, [session]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        // Dismiss for 1 month
        const oneMonthLater = Date.now() + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem("pwa_dismiss_until", oneMonthLater.toString());
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-slate-800 border border-ice-500/30 rounded-lg shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ice-600 rounded-lg flex items-center justify-center shrink-0">
                        <Download className="text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Install App</h3>
                        <p className="text-xs text-slate-400">Add to home screen for better experience</p>
                    </div>
                </div>
                <button onClick={handleDismiss} className="text-slate-500 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>
            <div className="flex gap-2 mt-3">
                <button
                    onClick={handleInstall}
                    className="flex-1 bg-ice-600 hover:bg-ice-500 text-white text-sm font-bold py-2 rounded transition-colors shadow-lg shadow-ice-500/20"
                >
                    Install Now
                </button>
                <button
                    onClick={handleDismiss}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-bold py-2 rounded transition-colors"
                >
                    Later
                </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2">
                Don't show again for 30 days
            </p>
        </div>
    );
}
