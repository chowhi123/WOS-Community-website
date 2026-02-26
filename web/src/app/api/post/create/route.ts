import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    interface CreatePostRequest {
        title: string;
        content: string;
        boardId?: string | null;
        allianceId?: string | null;
        category?: string | null;
        tags?: string[];
        poll?: {
            question: string;
            options: string[];
            endAt?: string | null;
        } | null;
    }

    let { title, content, boardId, allianceId, poll, category, tags } = (await req.json()) as CreatePostRequest;

    if (!title || !content) {
        return NextResponse.json({ error: "Title and Content required" }, { status: 400 });
    }

    // Validate: Must have boardId OR allianceId
    if (!boardId && !allianceId) {
        return NextResponse.json({ error: "Target (Board or Alliance) required" }, { status: 400 });
    }

    // Security Check: If posting to an Alliance, must be a member
    let userRole = "";
    if (allianceId) {
        const membership = await prisma.allianceMember.findUnique({
            where: {
                userId_allianceId: {
                    userId: session.user.id,
                    allianceId
                }
            }
        });

        if (!membership) {
            return NextResponse.json({ error: "You must be a member of this alliance to post here." }, { status: 403 });
        }
        userRole = membership.role;
    }

    try {
        // Enforce Notice Board Permissions
        if (boardId) {
            const board = await prisma.board.findUnique({ where: { id: boardId } });
            if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

            // ENFORCE CONSISTENCY: If board belongs to alliance, post MUST belong to same alliance.
            if (board.allianceId) {
                // If the user tried to sneak in a different allianceId, or omitted it, override it.
                allianceId = board.allianceId;

                // Now check permissions for this alliance
                const m = await prisma.allianceMember.findUnique({
                    where: { userId_allianceId: { userId: session.user.id, allianceId: board.allianceId } }
                });
                if (!m) return NextResponse.json({ error: "Access Denied" }, { status: 403 });
                userRole = m.role;

                if (board.category === "NOTICE" && !['R4', 'R5'].includes(userRole)) {
                    return NextResponse.json({ error: "Only R4/R5 can post in Notices" }, { status: 403 });
                }
            } else {
                // Board is Global (no allianceId)
                if (board.category === "NOTICE") {
                    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
                    if (user?.globalRole !== 'ADMIN') return NextResponse.json({ error: "Admin only" }, { status: 403 });
                }
                // If board is global, allianceId should be null
                allianceId = null;
            }
        }

        const post = await prisma.post.create({
            data: {
                title,
                content,
                category: category || undefined,
                tags: tags || [],
                authorId: session.user.id,
                boardId: boardId || undefined,
                allianceId: allianceId || undefined,
                // Create poll if provided
                poll: poll ? {
                    create: {
                        question: poll.question,
                        options: poll.options, // Expecting array of strings
                        endAt: poll.endAt ? new Date(poll.endAt) : null
                    }
                } : undefined
            },
            include: { poll: true }
        });

        // Update Alliance LastPostAt if applicable
        if (allianceId) {
            await prisma.alliance.update({
                where: { id: allianceId },
                data: { lastPostAt: new Date() }
            });
        }

        return NextResponse.json({ success: true, post });
    } catch (error) {
        console.error("Post Create Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
