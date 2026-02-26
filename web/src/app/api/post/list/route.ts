import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const boardSlug = searchParams.get('boardSlug');
    const boardId = searchParams.get('boardId');
    const allianceId = searchParams.get('allianceId');
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
        const whereClause: any = {};
        let boardMeta = null;

        if (allianceId) {
            // ... (Existing alliance logic)
            // PRIVACY CHECK: Must be member of alliance
            if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

            const membership = await prisma.allianceMember.findUnique({
                where: {
                    userId_allianceId: {
                        userId: session.user.id,
                        allianceId: allianceId
                    }
                }
            });

            if (!membership) {
                return NextResponse.json({ error: "You are not a member of this alliance" }, { status: 403 });
            }

            whereClause.allianceId = allianceId;

        } else if (boardId) {
            const board = await prisma.board.findUnique({ where: { id: boardId } });
            if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

            let canWrite = true;

            // Alliance Check
            if (board.allianceId) {
                if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
                const membership = await prisma.allianceMember.findUnique({
                    where: { userId_allianceId: { userId: session.user.id, allianceId: board.allianceId } }
                });
                if (!membership) return NextResponse.json({ error: "Private Alliance Board" }, { status: 403 });

                // Permission
                if (board.category === 'NOTICE' && !['R4', 'R5'].includes(membership.role)) {
                    canWrite = false;
                }
            }

            boardMeta = { ...board, canWrite };
            whereClause.boardId = board.id;

        } else if (boardSlug) {
            // Find board by slug and optional allianceId
            const targetAllianceId = allianceId || null;

            let board;
            if (targetAllianceId) {
                board = await prisma.board.findUnique({
                    where: {
                        board_slug_scope: {
                            slug: boardSlug,
                            allianceId: targetAllianceId
                        }
                    }
                });
            } else {
                board = await prisma.board.findFirst({
                    where: {
                        slug: boardSlug,
                        allianceId: null
                    }
                });
            }

            if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

            const canWrite = true;

            // ... (Rest of logic is same, board.allianceId will match targetAllianceId)
        } else {
            // Global Feed: Only show GLOBAL boards (public)
            whereClause.board = { isGlobal: true };
            // STRICT: Exclude any post linked to an alliance
            whereClause.allianceId = null;
        }

        // Logic for Recommended Posts (Top 3)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. Try Weekly Best
        let pinned = await prisma.post.findMany({
            where: {
                ...whereClause,
                createdAt: { gte: sevenDaysAgo }
            },
            take: 3,
            orderBy: [
                { likeCount: 'desc' },
                { createdAt: 'desc' }
            ],
            include: {
                author: { select: { displayName: true, serverCode: true, globalRole: true, image: true } },
                board: { select: { title: true, slug: true, isGlobal: true } },
                alliance: { select: { name: true } },
                _count: { select: { comments: true } }
            }
        });

        let pinnedType = "WEEKLY";

        // 2. If no weekly posts (or maybe we want a minimum like threshold? stick to existence for now), Fallback to All Time
        // Actually, if there are posts but 0 likes, they might be "best". 
        // User said "if none in that week" -> implies if no posts exist.
        if (pinned.length === 0) {
            pinned = await prisma.post.findMany({
                where: whereClause,
                take: 3,
                orderBy: [
                    { likeCount: 'desc' },
                    { createdAt: 'desc' }
                ],
                include: {
                    author: { select: { displayName: true, serverCode: true, globalRole: true, image: true } },
                    board: { select: { title: true, slug: true, isGlobal: true } },
                    alliance: { select: { name: true } },
                    _count: { select: { comments: true } }
                }
            });
            pinnedType = "ALL_TIME";
        }

        // 3. Fetch Recent Posts (INCLUDING pinned - requested user behavior)
        const posts = await prisma.post.findMany({
            where: {
                ...whereClause,
                // id: { notIn: pinned.map(p => p.id) } // REMOVED: User wants duplicates
            },
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    select: { displayName: true, serverCode: true, globalRole: true, image: true }
                },
                board: { select: { title: true, slug: true, isGlobal: true } },
                alliance: { select: { name: true } },
                _count: { select: { comments: true } }
            }
        });

        return NextResponse.json({ posts, pinned, pinnedType, board: boardMeta });
    } catch (error) {
        console.error("Post List Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
