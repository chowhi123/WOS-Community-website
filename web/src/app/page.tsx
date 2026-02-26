import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import PostList from "@/components/PostList";
import SearchWidget from "@/components/SearchWidget";
import QuickMenu from "@/components/QuickMenu";
import NotificationTestUI from "@/components/NotificationTestUI";

const prisma = new PrismaClient();

async function getLatestPosts() {
  return prisma.post.findMany({
    take: 20, // Increase count for dense view
    orderBy: { createdAt: "desc" },
    where: { board: { isGlobal: true } },
    include: {
      author: { select: { displayName: true, serverCode: true, globalRole: true } },
      board: { select: { title: true, slug: true } },
      alliance: { select: { name: true } },
      _count: { select: { comments: true } }
    }
  });
}

async function getBestPosts() {
  // Logic: Most likes in last 7 days? For now: Top 5 by likeCount all time
  return prisma.post.findMany({
    take: 5,
    orderBy: { likeCount: "desc" },
    where: { board: { isGlobal: true } },
    include: {
      author: { select: { displayName: true, serverCode: true, globalRole: true } },
      board: { select: { title: true, slug: true } },
      alliance: { select: { name: true } },
      _count: { select: { comments: true } }
    }
  });
}

async function getRecentComments() {
  return prisma.comment.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    where: {
      post: {
        board: { isGlobal: true }
      }
    },
    include: {
      author: { select: { displayName: true, serverCode: true } },
      post: {
        select: {
          id: true,
          title: true,
          board: { select: { slug: true } }
        }
      }
    }
  });
}

interface FeedPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  likeCount: number;
  author: { displayName: string | null; serverCode: string | null; globalRole: string };
  board: { title: string; slug: string } | null;
  alliance: { name: string } | null;
  category: string | null;
  _count: { comments: number; reactions?: number; };
}

interface FeedComment {
  id: string;
  content: string;
  post: {
    id: string;
    title: string;
    board: { slug: string } | null;
  };
  author: { displayName: string | null; serverCode: string | null };
  createdAt: Date;
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  let posts: FeedPost[] = [];
  let bestPosts: FeedPost[] = [];
  let recentComments: FeedComment[] = [];

  try {
    const [latest, best, comments] = await Promise.all([getLatestPosts(), getBestPosts(), getRecentComments()]);
    // Map dates to strings for client components
    posts = latest.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })) as unknown as FeedPost[];
    bestPosts = best.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })) as unknown as FeedPost[];
    recentComments = comments;
  } catch (e) { console.error(e); }

  return (
    <div className="min-h-screen bg-wos-bg text-slate-300 font-sans text-sm">
      {/* Header */}


      <div className="max-w-[1400px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">

        {/* Left Sidebar (Login / Nav) - Span 3 */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Login Widget */}
          <div className="bg-wos-surface rounded-xl border border-white/5 p-4 shadow-lg backdrop-blur-sm">
            {session ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
                    {session.user?.displayName?.[0] || "U"}
                  </div>
                  <div>
                    <div className="font-bold text-white">{session.user?.displayName}</div>
                    <div className="text-xs text-slate-500">{session.user?.serverCode}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs text-slate-400 border-t border-slate-700 pt-3">
                  <Link href="/messages" className="hover:text-white hover:bg-slate-700 p-2 rounded">
                    📩 Messages
                  </Link>
                  <Link href="/auth/onboarding" className="hover:text-white hover:bg-slate-700 p-2 rounded">
                    ⚙️ Settings
                  </Link>
                </div>
                {session.user?.role === "ADMIN" && (
                  <Link href="/admin" className="block text-center mt-2 bg-rose-500/10 text-rose-400 py-2 rounded border border-rose-500/20 hover:bg-rose-500/20 transition-colors">
                    Admin Dashboard
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-slate-400 mb-4">Join the community to discuss strategy and coordinate with alliances.</p>
                <Link href="/auth/signin" className="block w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded transition-colors">
                  Sign In / Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Quick Menu */}
          <QuickMenu />
        </aside>

        {/* Main Content (Feed) - Span 6 */}
        <main className="lg:col-span-6 space-y-6">

          {/* Best Posts Section */}
          <section>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-xl">🔥</span>
              <h2 className="text-lg font-bold font-heading bg-gradient-to-r from-fire-400 to-amber-500 bg-clip-text text-transparent">Weekly Best</h2>
            </div>
            <div className="bg-wos-surface rounded-xl border border-white/5 p-1 shadow-lg overflow-hidden">
              <div className="bg-black/20 p-3 space-y-2">
                {bestPosts.map((post, idx) => (
                  <Link key={post.id} href={`/boards/${post.board?.slug}/${post.id}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                    <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${idx < 3 ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-700 text-slate-400'}`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-200 truncate group-hover:text-ice-400 transition-colors text-sm">{post.title}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{post.board?.title || "Global"}</span>
                        <span>•</span>
                        <span className="text-amber-500/80">👍 {post.likeCount}</span>
                      </div>
                    </div>
                  </Link>
                ))}
                {bestPosts.length === 0 && <div className="text-slate-500 text-center py-4 text-xs">No trending posts yet.</div>}
              </div>
            </div>
          </section>

          {/* Latest Posts Feed */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-lg font-bold text-ice-400 font-heading">Recent Posts</h2>
              <Link href="/boards" className="text-xs text-slate-500 hover:text-ice-400 transition-colors uppercase font-bold tracking-wider">More +</Link>
            </div>
            <PostList posts={posts} linkPrefix="/boards" />
            <NotificationTestUI />
          </section>
        </main>

        {/* Right Sidebar (Widgets) - Span 3 */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Search Widget */}
          <SearchWidget />

          {/* Banner / Ad Placeholder */}
          <div className="bg-wos-surface rounded-xl border border-white/5 p-4 min-h-[200px] flex items-center justify-center text-slate-600 text-xs text-center shadow-lg">
            WOS Community<br />Space for Banners
          </div>

          {/* Recent Comments */}
          <div className="bg-wos-surface rounded-xl border border-white/5 p-4 shadow-lg">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-ice-500 rounded-full" /> New Comments
            </h3>
            <div className="text-xs text-slate-500 space-y-3">
              {recentComments.map(comment => (
                <div key={comment.id} className="group border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 font-bold">{comment.author?.displayName}</span>
                    <span className="text-[10px] text-slate-600">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <Link href={`/boards/${comment.post.board?.slug}/${comment.post.id}`} className="block text-slate-400 hover:text-white truncate mb-1">
                    {comment.content}
                  </Link>
                  <Link href={`/boards/${comment.post.board?.slug}/${comment.post.id}`} className="text-sky-600 hover:underline text-[10px] block truncate">
                    on "{comment.post.title}"
                  </Link>
                </div>
              ))}
              {recentComments.length === 0 && <div className="text-center italic text-slate-600">No comments yet.</div>}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
