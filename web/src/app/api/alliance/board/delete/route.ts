import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const getRankValue = (role: string) => {
    const ranks: Record<string, number> = { "R5": 5, "R4": 4, "R3": 3, "R2": 2, "R1": 1 };
    return ranks[role] || 0;
};

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await req.json();

    try {
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: { alliance: true }
        });

        if (!board || !board.allianceId) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        // Check Permissions (Must be at least R4)
        const membership = await prisma.allianceMember.findUnique({
            where: {
                userId_allianceId: {
                    userId: session.user.id,
                    allianceId: board.allianceId
                }
            }
        });

        if (!membership || getRankValue(membership.role) < 4) {
            return NextResponse.json({ error: "Forbidden: R4+ only" }, { status: 403 });
        }

        // Delete Board (Cascade handles posts?)
        // Board has `posts Post[]`
        // Post has `board Board? @relation(fields: [boardId], references: [id])`
        // We typically need distinct deleteMany if no cascade. 
        // Checking schema: Post-Board relation doesn't specify onDelete: Cascade explicitly in standard Prisma unless defined.
        // Let's safe delete contents first.

        await prisma.$transaction([
            prisma.post.deleteMany({ where: { boardId } }),
            prisma.board.delete({ where: { id: boardId } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Board delete error", error);
        return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
    }
}
