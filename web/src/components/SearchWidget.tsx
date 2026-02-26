"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchWidget() {
    const router = useRouter();
    const [query, setQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Posts, Boards..."
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 pl-9 text-sm focus:border-sky-500 focus:outline-none text-white placeholder-slate-500"
                />
                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            </form>
        </div>
    );
}
