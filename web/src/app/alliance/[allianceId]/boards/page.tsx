"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Users, Megaphone, Shield } from "lucide-react";

// Mock or Fetch Boards for this Alliance
// For MVP, simplistic list.
const ALLIANCE_BOARDS = [
    { title: "Announcements", slug: "announcements", icon: Megaphone, color: "text-rose-400" },
    { title: "General", slug: "general", icon: Users, color: "text-ice-400" },
    { title: "Strategy", slug: "strategy", icon: Shield, color: "text-amber-400" },
];

export default function AllianceBoardsPage() {
    const params = useParams();
    const allianceId = params.allianceId as string;

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold font-heading text-white mb-2">
                        Alliance <span className="text-ice-500">Boards</span>
                    </h1>
                    <p className="text-slate-400">
                        Private communications for alliance members.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ALLIANCE_BOARDS.map((board) => (
                        <Link
                            key={board.slug}
                            href={`/alliance/${allianceId}/boards/${board.slug}`}
                            className="bg-wos-surface border border-white/5 rounded-xl p-6 hover:bg-white/5 transition-all group"
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <div className={`w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center ${board.color} group-hover:scale-110 transition-transform`}>
                                    <board.icon size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white group-hover:text-ice-400 transition-colors">{board.title}</h2>
                                    <p className="text-slate-500 text-sm">Alliance Access Only</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
