"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import GlobalClock from "./Clock";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [boards, setBoards] = useState<any[]>([]);

    useEffect(() => {
        // Fetch Global Boards with simple cache busting
        fetch("/api/board/list", { cache: "no-store" })
            .then(res => res.json())
            .then(data => {
                if (data.boards) setBoards(data.boards);
            })
            .catch(err => console.error("Nav fetch error:", err));
    }, []);

    const isActive = (path: string) => pathname === path || (path !== "/" && pathname.startsWith(path));

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-wos-bg/90 border-b border-ice-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 shrink-0">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img
                            src="/logo.svg"
                            alt="WOS Logo"
                            className="w-10 h-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                        />
                        <span className="text-xl font-bold font-heading text-white tracking-tight group-hover:text-ice-400 transition-colors hidden sm:inline">
                            WOS <span className="text-ice-500">Community</span>
                        </span>
                    </Link>

                    {/* Mobile Clock (Next to Logo) */}
                    <div className="md:hidden scale-[0.75] origin-left ml-2">
                        <GlobalClock />
                    </div>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1 flex-1 justify-start ml-8">
                    <Link
                        href="/"
                        className={`relative px-4 py-2 text-sm font-bold transition-colors hover:text-ice-400 ${isActive("/") ? "text-ice-400" : "text-slate-300"}`}
                    >
                        Home
                        {isActive("/") && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-ice-500 shadow-[0_-2px_6px_rgba(56,189,248,0.5)]" />}
                    </Link>

                    {/* Boards Dropdown */}
                    <div className="relative group">
                        <Link
                            href="/boards"
                            className={`flex items-center gap-1 px-4 py-2 text-sm font-bold transition-colors hover:text-ice-400 ${pathname.startsWith("/boards") ? "text-ice-400" : "text-slate-300"}`}
                        >
                            Boards <ChevronDown size={14} />
                            {pathname.startsWith("/boards") && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-ice-500 shadow-[0_-2px_6px_rgba(56,189,248,0.5)]" />}
                        </Link>

                        {/* Dropdown Menu */}
                        <div className="absolute top-full left-0 w-56 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
                                {boards && boards.length > 0 ? boards.map((board) => (
                                    <Link
                                        key={board.id}
                                        href={`/boards/${board.slug}`}
                                        className={`block px-4 py-2 text-sm font-medium hover:bg-slate-700/50 hover:text-ice-400 transition-colors ${isActive(`/boards/${board.slug}`) ? "text-ice-400 bg-slate-700/30" : "text-slate-400"}`}
                                    >
                                        {board.title}
                                    </Link>
                                )) : <div className="px-4 py-2 text-xs text-slate-500">No boards available</div>}
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/alliances"
                        className={`relative px-4 py-2 text-sm font-bold transition-colors hover:text-ice-400 ${isActive("/alliances") ? "text-ice-400" : "text-slate-300"}`}
                    >
                        Alliances
                        {isActive("/alliances") && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-ice-500 shadow-[0_-2px_6px_rgba(56,189,248,0.5)]" />}
                    </Link>
                    <Link
                        href="/calendar"
                        className={`relative px-4 py-2 text-sm font-bold transition-colors hover:text-ice-400 ${isActive("/calendar") ? "text-ice-400" : "text-slate-300"}`}
                    >
                        Calendar
                        {isActive("/calendar") && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-ice-500 shadow-[0_-2px_6px_rgba(56,189,248,0.5)]" />}
                    </Link>
                    {/* Admin Link */}
                    {session?.user?.role === "ADMIN" && (
                        <Link
                            href="/admin"
                            className="text-xs bg-rose-600/20 text-rose-400 border border-rose-500/50 px-3 py-1 rounded ml-2 hover:bg-rose-600/40 transition-colors whitespace-nowrap font-bold"
                        >
                            Admin Panel
                        </Link>
                    )}
                </nav>

                {/* Right Side */}
                <div className="flex items-center gap-4 shrink-0">
                    <NotificationBell />
                    <div className="hidden lg:block scale-90 origin-right">
                        <GlobalClock />
                    </div>

                    {session ? (
                        <Link href="/profile" className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded transition-colors group">
                            {session.user?.image ? (
                                <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border border-white/10 ring-2 ring-transparent group-hover:ring-ice-500/50 transition-all object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-white/10 ring-2 ring-transparent group-hover:ring-ice-500/50 transition-all">
                                    {session.user?.displayName?.[0] || "U"}
                                </div>
                            )}
                        </Link>
                    ) : (
                        <Link
                            href="/auth/signin"
                            className="bg-ice-600 hover:bg-ice-500 text-white px-4 py-2 rounded font-bold text-sm shadow-[0_4px_14px_0_rgba(2,132,199,0.39)] transition-all hover:scale-105 whitespace-nowrap"
                        >
                            Login
                        </Link>
                    )}

                    {/* Mobile Menu Toggle */}
                    <MobileMenu boards={boards} isActive={isActive} session={session} />
                </div>
            </div>
        </header >
    );
}

function MobileMenu({ boards, isActive, session }: { boards: any[], isActive: (p: string) => boolean, session: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close menu when path changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <div className="md:hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                aria-label="Toggle menu"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                )}
            </button>

            {/* Backdrop */}
            {isOpen && <div className="fixed inset-0 top-16 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />}

            {/* Menu Content */}
            {isOpen && (
                <div className="absolute top-16 left-0 w-full bg-slate-900 border-b border-slate-800 shadow-2xl z-50 p-4 animate-in slide-in-from-top-2 duration-200">
                    <nav className="flex flex-col gap-2">
                        <Link
                            href="/"
                            className={`px-4 py-3 rounded-lg font-bold transition-colors ${isActive("/") ? "bg-slate-800 text-ice-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                        >
                            Home
                        </Link>

                        <div className="flex flex-col gap-1">
                            <div className="px-4 py-2 text-xs uppercase font-bold text-slate-500">Boards</div>
                            {boards && boards.length > 0 ? boards.map((board) => (
                                <Link
                                    key={board.id}
                                    href={`/boards/${board.slug}`}
                                    className={`px-4 py-2 ml-2 rounded-lg text-sm font-medium transition-colors ${isActive(`/boards/${board.slug}`) ? "bg-slate-800/50 text-ice-400" : "text-slate-400 hover:text-white hover:bg-slate-800/30"}`}
                                >
                                    # {board.title}
                                </Link>
                            )) : <div className="px-4 py-2 text-sm text-slate-500 italic">No boards available</div>}
                        </div>

                        <Link
                            href="/alliances"
                            className={`px-4 py-3 rounded-lg font-bold transition-colors ${isActive("/alliances") ? "bg-slate-800 text-ice-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                        >
                            Alliances
                        </Link>
                        <Link
                            href="/calendar"
                            className={`px-4 py-3 rounded-lg font-bold transition-colors ${isActive("/calendar") ? "bg-slate-800 text-ice-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                        >
                            Calendar
                        </Link>

                        {session?.user?.role === "ADMIN" && (
                            <Link
                                href="/admin"
                                className="px-4 py-3 rounded-lg font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors mt-2"
                            >
                                Admin Panel
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </div>
    );
}
