import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ posts: [], boards: [], alliances: [] });
    }

    try {
        // Resolve user's alliance memberships
        let userAllianceIds: string[] = [];
        if (session?.user?.id) {
            const memberships = await prisma.allianceMember.findMany({
                where: { userId: session.user.id },
                select: { allianceId: true }
            });
            userAllianceIds = memberships.map(m => m.allianceId);
        }

        // 1. Search Posts (Global + User's Alliances)
        const posts = await prisma.post.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { content: { contains: query, mode: 'insensitive' } }
                ],
                board: {
                    OR: [
                        { isGlobal: true },
                        { allianceId: { in: userAllianceIds } }
                    ]
                }
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: { displayName: true, name: true } },
                board: { select: { title: true, slug: true, allianceId: true } },
                alliance: { select: { id: true, name: true } }
            }
        });

        // 2. Search Boards (Global + User's Alliances)
        const boards = await prisma.board.findMany({
            where: {
                title: { contains: query, mode: 'insensitive' },
                OR: [
                    { isGlobal: true },
                    { allianceId: { in: userAllianceIds } }
                ]
            },
            take: 5,
            include: {
                alliance: { select: { id: true, name: true } }
            }
        });

        // 3. Search Alliances
        const alliances = await prisma.alliance.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' }
            },
            take: 5,
            select: { id: true, name: true, description: true, logo: true, _count: { select: { members: true } } }
        });

        return NextResponse.json({ posts, boards, alliances });
    } catch (error) {
        console.error("Search Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
