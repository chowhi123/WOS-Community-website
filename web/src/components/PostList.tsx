"use client";

import Link from "next/link";

interface Post {
    id: string;
    title: string;
    content: string;
    category: string | null;
    author: { displayName: string | null; serverCode: string | null; image?: string };
    createdAt: string;
    likeCount?: number;
    viewCount?: number;
    _count?: { comments: number; reactions?: number };
}

interface PostListProps {
    posts: Post[];
    pinnedPosts?: Post[];
    pinnedType?: "WEEKLY" | "ALL_TIME";
    loading?: boolean;
    emptyMessage?: string;
    linkPrefix?: string; // e.g. "/posts"
}

export default function PostList({ posts, pinnedPosts = [], pinnedType, loading, emptyMessage = "No posts yet.", linkPrefix = "/posts" }: PostListProps) {
    if (loading) {
        return <div className="text-center py-20 text-slate-500 animate-pulse">Loading data...</div>;
    }

    if (posts.length === 0 && pinnedPosts.length === 0) {
        return (
            <div className="text-center py-20 bg-wos-surface rounded-xl border border-white/5 border-dashed text-slate-500">
                <h3 className="text-lg font-bold text-slate-400">Nothing here</h3>
                <p className="mb-4">{emptyMessage}</p>
            </div>
        );
    }

    const renderDenseRow = (post: Post, isPinned: boolean, keySuffix: string = "") => {
        return (
            <Link
                key={`${post.id}${keySuffix}`}
                // Dynamic Link Construction: /boards/[slug]/[postId] or fallback
                // We need the board slug in the Post object to link correctly contextually.
                // For now, assuming Global view links might need logic, but usually we are ON a board.
                // If linkPrefix is passed (e.g. /boards/general), we append ID.
                href={`${linkPrefix}/${post.id}`}
                className={`flex items-center gap-2 py-2.5 px-3 border-b border-white/5 hover:bg-white/5 transition-colors group text-sm ${isPinned ? "bg-amber-500/5 hover:bg-amber-500/10" : ""
                    }`}
            >
                {/* 1. Icon / Status */}
                <div className="w-8 shrink-0 flex justify-center">
                    {isPinned ? (
                        <span className="text-amber-500 text-xs font-bold" title="Recommended">🔥</span>
                    ) : (
                        <span className="text-slate-600 text-[10px]">•</span>
                    )}
                </div>

                {/* 2. Category (Optional) */}
                {post.category && (
                    <span className="shrink-0 text-[11px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 min-w-[50px] text-center">
                        {post.category}
                    </span>
                )}

                {/* 3. Title & Comments */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className={`truncate font-medium ${isPinned ? "text-slate-200" : "text-slate-300"} group-hover:text-white group-hover:underline`}>
                        {post.title}
                    </span>
                    {(post._count?.comments ?? 0) > 0 && (
                        <span className="text-[10px] text-sky-500 font-bold font-mono">
                            [{post._count?.comments}]
                        </span>
                    )}
                    {/* New Badge for recent posts (< 24h) if not pinned? */}
                    {!isPinned && new Date(post.createdAt).getTime() > Date.now() - 86400000 && (
                        <span className="text-[9px] text-rose-500 font-bold uppercase ml-1">N</span>
                    )}
                </div>

                {/* 4. Meta Info (Right Aligned) */}
                <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                    <span className="hidden md:block w-24 text-right truncate" title={post.author.displayName || "User"}>
                        {post.author.displayName}
                    </span>
                    <span className="w-16 text-right font-mono text-[11px]">
                        {/* Simple date formatting */}
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                    </span>
                    <div className="w-8 text-right flex justify-end gap-1 text-slate-600 group-hover:text-slate-400">
                        {/* Likes or standard icon */}
                        {post.likeCount && post.likeCount > 0 ? (
                            <span className="text-amber-500/80">👍 {post.likeCount}</span>
                        ) : null}
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="w-full bg-wos-surface rounded-xl border border-white/5 overflow-hidden shadow-lg">
            {/* Header Row (Optional, mimic the second image's red header tabs if desired, but for now just list) */}
            {/* The second image shows a tab bar "Entire / Hot / Software...". 
                For now we just render the list. */}

            <div className="divide-y divide-white/5">
                {/* Pinned Posts */}
                {pinnedPosts.map(post => {
                    // Render wrapper with distinct key
                    // But wait, renderDenseRow returns a Link with key on it.
                    // I need to change how renderDenseRow works or cloneElement or just pass a separate key prop if possible?
                    // actually renderDenseRow takes key as prop? No, it sets key locally.
                    // Let's modify renderDenseRow to use a suffix/prefix logic or accept a custom key?
                    // Or easier: Just inline modify the render helper or pass a "keyOverride" arg.
                    // Actually, renderDenseRow uses `key={post.id}`.
                    // I'll update renderDenseRow to accept an optional keySuffix.
                    return renderDenseRow(post, true, "pinned");
                })}

                {/* Regular Posts */}
                {posts.map(post => renderDenseRow(post, false))}
            </div>

            {posts.length === 0 && pinnedPosts.length > 0 && (
                <div className="p-4 text-center text-slate-600 text-sm italic">
                    End of recommended posts.
                </div>
            )}
        </div>
    );
}
