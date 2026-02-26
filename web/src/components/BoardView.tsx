"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { safeDecodeURIComponent } from "@/lib/utils";
import PostList from "@/components/PostList";

interface Post {
    id: string;
    title: string;
    content: string;
    category: string | null;
    author: { displayName: string | null; serverCode: string | null };
    createdAt: string;
    _count: { comments: number };
}

interface BoardViewProps {
    slug: string;
    basePath?: string; // e.g. "/boards"
    isEmbedded?: boolean;
    writeUrl?: string; // Explicit override for write button href
}

export default function BoardView({ slug, basePath = "/boards", isEmbedded = false, writeUrl }: BoardViewProps) {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
    const [pinnedType, setPinnedType] = useState<"WEEKLY" | "ALL_TIME">("WEEKLY");
    const [loading, setLoading] = useState(true);
    const [boardTitle, setBoardTitle] = useState("");
    const [canWrite, setCanWrite] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (slug) {
            const currentSlug = safeDecodeURIComponent(slug);
            // Decode the slug to show readable text initially (fallback)
            setBoardTitle(currentSlug);
            setLoading(true);
            setNotFound(false);

            const fetchBoard = async () => {
                try {
                    const res = await fetch(`/api/post/list?boardSlug=${encodeURIComponent(currentSlug)}`);
                    if (res.status === 404) {
                        setLoading(false);
                        setBoardTitle("");
                        setPosts([]);
                        return setNotFound(true);
                    }
                    if (res.status === 401 || res.status === 403) {
                        setLoading(false);
                        return; // Unauthorized handled by UI roughly
                    }

                    const data = await res.json();

                    if (data.posts) setPosts(data.posts);
                    if (data.pinned) setPinnedPosts(data.pinned);
                    if (data.pinnedType) setPinnedType(data.pinnedType);

                    if (data.board) {
                        setBoardTitle(data.board.title);
                        setCanWrite(data.board.canWrite ?? true);
                    }
                } catch (e) {
                    console.error("Failed to fetch posts or board info");
                } finally {
                    setLoading(false);
                }
            }
            fetchBoard();
        }
    }, [slug]);

    if (notFound) {
        return (
            <div className="flex items-center justify-center flex-col gap-4 text-slate-400 py-20">
                <h1 className="text-2xl font-bold text-white">Board Not Found</h1>
                <p>The requested board does not exist or you do not have permission.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header - Only hide if very specific embedding requirement, but generally we want title */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-700/50 pb-6">
                <div>
                    {!isEmbedded && <Link href={basePath} className="text-ice-400 text-sm hover:text-white transition-colors mb-2 inline-block">← Back to Boards</Link>}
                    <h1 className="text-3xl font-bold font-heading text-white tracking-tight flex items-center gap-3">
                        <span className="text-ice-500">#</span> {boardTitle}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Discuss everything about {boardTitle}</p>
                </div>
                {session && canWrite && (
                    <Link
                        href={writeUrl || `${basePath}/${slug}/write`}
                        className="bg-ice-600 hover:bg-ice-500 text-white px-6 py-2.5 rounded font-bold shadow-[0_0_15px_rgba(14,165,233,0.4)] hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <span>✏️</span> Write Post
                    </Link>
                )}
            </div>

            {/* Posts List */}
            <PostList
                posts={posts}
                pinnedPosts={pinnedPosts}
                pinnedType={pinnedType}
                loading={loading}
                emptyMessage="Be the first to share your survival story."
            />
        </div>
    );
}
