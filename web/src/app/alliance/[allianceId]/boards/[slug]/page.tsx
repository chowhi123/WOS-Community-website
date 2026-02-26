"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
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

export default function AllianceBoardDetail() {
    const params = useParams();
    const slug = params.slug as string;
    const allianceId = params.allianceId as string;
    const { data: session } = useSession();

    const [posts, setPosts] = useState<Post[]>([]);
    const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [boardTitle, setBoardTitle] = useState("");
    const [canWrite, setCanWrite] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (slug && allianceId) {
            const currentSlug = safeDecodeURIComponent(slug);
            setBoardTitle(currentSlug);

            const fetchBoard = async () => {
                try {
                    // Pass allianceId to ensure we get the right board
                    const res = await fetch(`/api/post/list?boardSlug=${encodeURIComponent(currentSlug)}&allianceId=${allianceId}`);

                    if (res.status === 404) {
                        setLoading(false);
                        return setNotFound(true);
                    }
                    const data = await res.json();

                    if (data.posts) setPosts(data.posts);
                    if (data.pinned) setPinnedPosts(data.pinned);

                    if (data.board) {
                        setBoardTitle(data.board.title);
                        setCanWrite(data.board.canWrite ?? true);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            }
            fetchBoard();
        }
    }, [slug, allianceId]);

    if (notFound) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-slate-400">
                <h1 className="text-2xl font-bold text-white">404 - Board Not Found</h1>
                <Link href={`/alliance/${allianceId}/boards`} className="text-ice-400 hover:underline">Return to Alliance Boards</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Link href={`/alliance/${allianceId}/boards`} className="text-ice-400 text-sm hover:text-white transition-colors mb-2 inline-block">← Alliance Boards</Link>
                        <h1 className="text-4xl font-bold font-heading text-white tracking-tight flex items-center gap-3">
                            <span className="text-ice-500">#</span> {boardTitle}
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Alliance Private Board</p>
                    </div>
                    {session && canWrite && (
                        <Link
                            href={`/alliance/${allianceId}/boards/${slug}/write`} // TODO: Implement Write Page
                            className="bg-ice-600 hover:bg-ice-500 text-white px-6 py-2.5 rounded font-bold shadow-[0_0_15px_rgba(14,165,233,0.4)] hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <span>✏️</span> Write Post
                        </Link>
                    )}
                </div>

                <PostList
                    posts={posts}
                    pinnedPosts={pinnedPosts}
                    loading={loading}
                    emptyMessage="This board is empty."
                    linkPrefix={`/alliance/${allianceId}/boards/${slug}`} // Important: Scope links to alliance
                />
            </div>
        </div>
    );
}
