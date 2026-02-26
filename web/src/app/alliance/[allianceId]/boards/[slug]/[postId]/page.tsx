"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DOMPurify from "dompurify";

interface PostComment {
    id: string;
    content: string;
    createdAt: string;
    authorId: string;
    author: {
        displayName: string | null;
        serverCode: string | null;
    }
}

interface PostDetail {
    id: string;
    title: string;
    content: string;
    category: string | null;
    author: { id: string; displayName: string; serverCode: string; globalRole: string };
    createdAt: string;
    likeCount: number;
    isLiked: boolean;
    poll: { id: string; question: string; options: string[]; votes: { userId: string; optionIndex: number }[] } | null;
    board: { title: string; slug: string; allianceId: string | null } | null;
    comments: PostComment[];
}

export default function AlliancePostPage() {
    const params = useParams(); // { allianceId, slug, postId }
    const { allianceId, slug, postId } = params;
    const router = useRouter();
    const { data: session } = useSession();
    const [post, setPost] = useState<PostDetail | null>(null);
    const [commentText, setCommentText] = useState("");
    const [loading, setLoading] = useState(true);
    const [isVoting, setIsVoting] = useState(false);

    // Comment Edit State
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");

    const handleSaveEdit = async () => {
        if (!editingCommentId || !editContent.trim()) return;

        const res = await fetch("/api/post/comment/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commentId: editingCommentId, content: editContent })
        });

        if (res.ok) {
            setEditingCommentId(null);
            setEditContent("");
            window.location.reload();
        } else {
            alert("Failed to update comment");
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

        const res = await fetch("/api/post/comment/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commentId })
        });

        if (res.ok) {
            window.location.reload();
        } else {
            alert("Failed to delete comment");
        }
    };

    useEffect(() => {
        if (postId) {
            fetch(`/api/post/${postId}`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch");
                    return res.json();
                })
                .then(data => {
                    if (data.post) setPost(data.post);
                    setLoading(false);
                })
                .catch(e => {
                    console.error(e);
                    setLoading(false);
                });
        }
    }, [postId]);

    const handleVote = async (index: number) => {
        if (!post?.poll || isVoting) return;
        setIsVoting(true);
        const res = await fetch("/api/poll/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pollId: post.poll.id, optionIndex: index })
        });
        if (res.ok) {
            alert("Voted!");
            window.location.reload();
        }
        setIsVoting(false);
    };

    const handleLike = async () => {
        if (!post) return;
        const res = await fetch("/api/post/like", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: post.id })
        });
        if (res.ok) {
            const data = await res.json();
            setPost({ ...post, likeCount: data.likes, isLiked: data.liked });
        }
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        const res = await fetch("/api/post/comment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: post?.id, content: commentText })
        });
        if (res.ok) {
            window.location.reload();
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-ice-400">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-ice-500 border-t-transparent rounded-full animate-spin" />
                <span className="font-bold tracking-widest">LOADING INTEL...</span>
            </div>
        </div>
    );

    if (!post) return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-slate-400">
            <h1 className="text-2xl font-bold text-white">404 - Post Not Found</h1>
            <button onClick={() => router.back()} className="text-ice-400 hover:underline">Return Support</button>
        </div>
    );

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Back Link - Alliance Context */}
                <Link href={`/alliance/${allianceId}/boards/${slug}`} className="text-slate-500 hover:text-ice-400 text-sm transition-colors mb-2 inline-block">
                    ← Back to {post.board?.title || slug}
                </Link>

                {/* Main Post Card */}
                <article className="bg-wos-surface border border-white/10 rounded-lg p-8 shadow-2xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-ice-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Header */}
                    <header className="mb-8 border-b border-white/5 pb-6 text-right">
                        {/* Admin/Owner Controls */}
                        {session?.user && (
                            <div className="mb-4 flex gap-2 justify-end">
                                {((session.user as { id?: string }).id === post.author.id) && (
                                    <Link
                                        href={`/alliance/${allianceId}/boards/${slug}/${postId}/edit`}
                                        className="text-xs bg-slate-700 hover:bg-slate-600 text-ice-400 px-3 py-1.5 rounded border border-slate-600 transition-colors flex items-center gap-1"
                                    >
                                        ✏️ Edit
                                    </Link>
                                )}
                                {((session.user as { id?: string }).id === post.author.id || (session.user as { role?: string }).role === "ADMIN") && (
                                    <button
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
                                                const res = await fetch(`/api/post/${post.id}`, { method: "DELETE" });
                                                if (res.ok) {
                                                    alert("Post deleted.");
                                                    router.push(`/alliance/${allianceId}/boards/${slug}`);
                                                } else {
                                                    alert("Failed to delete post.");
                                                }
                                            }
                                        }}
                                        className="text-xs bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 px-3 py-1.5 rounded border border-rose-900/50 transition-colors flex items-center gap-1"
                                    >
                                        🗑️ Delete
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="flex items-start justify-between gap-4 text-left">
                            <h1 className="text-3xl md:text-4xl font-bold text-white font-heading leading-tight">
                                {post.title}
                            </h1>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="bg-ice-900/50 text-ice-400 px-3 py-1 rounded-full text-xs font-bold border border-ice-500/20 uppercase tracking-wider">
                                    {post.category || "POST"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                    {post.author.displayName?.[0] || "?"}
                                </div>
                                <span className="font-bold text-slate-200">{post.author.displayName}</span>
                                {post.author.globalRole === "ADMIN" && (
                                    <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-500/30">ADMIN</span>
                                )}
                                <span className="text-slate-600 border-l border-slate-700 pl-2 ml-1">#{post.author.serverCode}</span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <span>{new Date(post.createdAt).toLocaleString()}</span>
                            <span className="text-slate-600">•</span>
                            <span className="flex items-center gap-1 text-rose-400">
                                ❤️ {post.likeCount}
                            </span>
                        </div>
                    </header>

                    {/* Content */}
                    <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white mb-12 min-h-[100px]">
                        {typeof window !== 'undefined' && (
                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
                        )}
                    </div>

                    {/* Poll Section */}
                    {post.poll && (
                        <div className="bg-slate-900/50 p-6 rounded-lg border border-white/5 mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl">📊</span>
                                <h3 className="font-bold text-white text-lg">{post.poll.question}</h3>
                            </div>
                            <div className="space-y-3">
                                {post.poll.options.map((opt: string, idx: number) => {
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleVote(idx)}
                                            disabled={isVoting}
                                            className="w-full text-left bg-slate-800 hover:bg-ice-900/30 p-4 rounded border border-slate-700 hover:border-ice-500/50 transition-all group relative overflow-hidden"
                                        >
                                            <div className="relative z-10 flex justify-between">
                                                <span className="font-medium text-slate-300 group-hover:text-ice-400 transition-colors">
                                                    {typeof opt === 'string' ? opt : JSON.stringify(opt)}
                                                </span>
                                                <span className="text-slate-600 text-xs">Vote</span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-center border-t border-white/5 pt-8">
                        <button
                            onClick={handleLike}
                            className={`px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] hover:scale-105 transition-all flex items-center gap-2 ${post.isLiked
                                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                : "bg-rose-600 text-white hover:bg-rose-500"
                                }`}
                        >
                            <span>{post.isLiked ? "🔥" : "🤍"}</span> {post.isLiked ? "Recommended" : "Recommend This"}
                        </button>
                    </div>
                </article>

                {/* Comments Section */}
                <section className="bg-wos-surface border border-white/10 rounded-lg p-6 md:p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        Comments <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full">{post.comments?.length || 0}</span>
                    </h3>

                    <form onSubmit={submitComment} className="mb-8 flex gap-4">
                        <div className="flex-1">
                            <textarea
                                className="w-full bg-slate-900/50 border border-slate-700 p-4 rounded-lg text-white focus:border-ice-500 focus:ring-1 focus:ring-ice-500 outline-none resize-none transition-all placeholder:text-slate-600"
                                rows={3}
                                placeholder="Share your thoughts..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                            />
                        </div>
                        <button className="h-fit bg-ice-600 hover:bg-ice-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all hover:translate-y-[-2px]">
                            Post
                        </button>
                    </form>

                    <div className="space-y-6">
                        {post.comments?.map((comment: PostComment) => (
                            <div key={comment.id} className="flex gap-4 group">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white border border-slate-700 shrink-0 font-bold">
                                    {comment.author.displayName?.[0] || "?"}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-baseline justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-ice-400 text-sm">{comment.author.displayName}</span>
                                            <span className="text-xs text-slate-600 bg-slate-800 px-1.5 rounded">{comment.author.serverCode}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-600">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                            {(session?.user as { id?: string })?.id === comment.authorId && (
                                                <div className="flex gap-2 text-xs">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCommentId(comment.id);
                                                            setEditContent(comment.content);
                                                        }}
                                                        className="text-slate-500 hover:text-ice-400"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-slate-500 hover:text-rose-400"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {editingCommentId === comment.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-300 text-sm focus:border-ice-500 outline-none"
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => setEditingCommentId(null)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
                                                <button onClick={handleSaveEdit} className="text-xs bg-ice-600 text-white px-3 py-1 rounded hover:bg-ice-500">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-800/50 p-4 rounded-b-lg rounded-tr-lg border border-white/5 text-slate-300 text-sm leading-relaxed group-hover:border-white/10 transition-colors whitespace-pre-wrap">
                                            {comment.content}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(!post.comments || post.comments.length === 0) && (
                            <p className="text-slate-500 text-center py-4 italic">No comments yet. Be the first!</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
