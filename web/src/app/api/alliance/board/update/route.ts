import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Helper to check rank
const getRankValue = (role: string) => {
    const ranks: Record<string, number> = { "R5": 5, "R4": 4, "R3": 3, "R2": 2, "R1": 1 };
    return ranks[role] || 0;
};

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reqBody = await req.json();
    const { boardId, newTitle, newMinRole } = reqBody; // minRole: "R1", "R2"...

    try {
        const board = await prisma.board.findUnique({
            where: { id: boardId },
            include: { alliance: true }
        });

        if (!board || !board.allianceId) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        // Check Permissions (Must be at least R4 in that alliance)
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

        const data: any = {};
        if (newTitle) data.title = newTitle;
        if (newMinRole) data.minRole = newMinRole;
        if (reqBody.newCategories) data.availableCategories = reqBody.newCategories; // Array of strings

        await prisma.board.update({
            where: { id: boardId },
            data
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Board update error", error);
        return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
    }
}
