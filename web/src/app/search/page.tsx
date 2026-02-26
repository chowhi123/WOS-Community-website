"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Loader2, Search as SearchIcon, Users, FileText, Layout } from "lucide-react";

interface SearchAlliance {
    id: string;
    logo: string | null;
    name: string;
    _count: { members: number };
}

interface SearchBoard {
    slug: string;
    allianceId: string | null;
    title: string;
    alliance: { name: string } | null;
}

interface SearchPost {
    id: string;
    title: string;
    board: { title: string; slug: string; allianceId: string | null } | null;
    alliance: { name: string } | null;
    author: { displayName: string | null; name: string } | null;
}

interface SearchResultsData {
    posts: SearchPost[];
    boards: SearchBoard[];
    alliances: SearchAlliance[];
}

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q");
    const [results, setResults] = useState<SearchResultsData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query) {
            setLoading(true);
            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    setResults(data);
                    setLoading(false);
                });
        }
    }, [query]);

    if (!query) return <div className="p-20 text-center text-slate-500">Please enter a search term.</div>;

    return (
        <div className="space-y-12">
            <header className="mb-8 border-b border-slate-700 pb-4">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <SearchIcon className="text-sky-500" />
                    Search Results for <span className="text-sky-400">"{query}"</span>
                </h1>
            </header>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={48} /></div>
            ) : (
                <>
                    {/* Alliances */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-300">
                            <Users size={20} className="text-amber-500" /> Alliances
                        </h2>
                        {results?.alliances?.length ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {results.alliances.map((a: SearchAlliance) => (
                                    <Link href={`/alliances/${a.id}`} key={a.id} className="bg-slate-800 p-4 rounded border border-slate-700 hover:border-amber-500/50 transition-colors group">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center font-bold text-white group-hover:bg-amber-500/20 transition-colors">
                                                {a.logo ? <img src={a.logo} className="w-full h-full object-cover rounded" /> : a.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold group-hover:text-amber-400 transition-colors">{a.name}</div>
                                                <div className="text-xs text-slate-500">{a._count.members} Members</div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : <p className="text-slate-500 italic">No alliances found.</p>}
                    </section>

                    {/* Boards */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-300">
                            <Layout size={20} className="text-violet-500" /> Boards
                        </h2>
                        {results?.boards?.length ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {results.boards.map((b: SearchBoard) => (
                                    <Link href={b.allianceId ? `/alliances/${b.allianceId}/boards/${b.slug}` : `/boards/${b.slug}`} key={b.slug} className="bg-slate-800 p-4 rounded border border-slate-700 hover:border-violet-500/50 transition-colors">
                                        <div className="font-bold text-violet-400">{b.title}</div>
                                        {b.alliance && <div className="text-xs text-slate-500 mt-1">{b.alliance.name}</div>}
                                    </Link>
                                ))}
                            </div>
                        ) : <p className="text-slate-500 italic">No boards found.</p>}
                    </section>

                    {/* Posts */}
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-300">
                            <FileText size={20} className="text-emerald-500" /> Posts
                        </h2>
                        {results?.posts?.length ? (
                            <div className="space-y-2">
                                {results.posts.map((post: SearchPost) => (
                                    <Link href={post.board?.allianceId ? `/alliances/${post.board.allianceId}/boards/${post.board.slug}/${post.id}` : `/posts/${post.id}`} key={post.id} className="block bg-slate-800 p-4 rounded border border-slate-700 hover:bg-slate-750 hover:border-emerald-500/30 transition-all">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg text-emerald-100 hover:text-emerald-400">{post.title}</h3>
                                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                                                {post.board?.title} {post.alliance && <span className="text-amber-500">({post.alliance.name})</span>}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">by <span className="text-emerald-500">{post.author?.displayName || post.author?.name}</span></div>
                                    </Link>
                                ))}
                            </div>
                        ) : <p className="text-slate-500 italic">No posts found.</p>}
                    </section>
                </>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-5xl mx-auto">
                <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-500" size={48} /></div>}>
                    <SearchResults />
                </Suspense>
            </div>
        </div>
    );
}
