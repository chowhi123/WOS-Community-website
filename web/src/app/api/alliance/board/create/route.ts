import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, slug, allianceId } = await req.json();

    if (!title || !slug || !allianceId) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Permission Check: User must be R5 OR R4
    const membership = await prisma.allianceMember.findUnique({
        where: {
            userId_allianceId: {
                userId: session.user.id,
                allianceId: allianceId
            }
        }
    });

    if (!membership || !["R5", "R4"].includes(membership.role)) {
        return NextResponse.json({ error: "Only Alliance Leader (R5) or Officers (R4) can create boards" }, { status: 403 });
    }

    try {
        const board = await prisma.board.create({
            data: {
                title,
                slug: `${allianceId}-${slug}`, // Scope slug to alliance to prevent collision? Or just simple slug? 
                // Plan is Global Boards vs Alliance Boards.
                // Alliance boards usually live INSIDE alliance page, but schema has `allianceId` on Board.
                isGlobal: false,
                allianceId,
                category: "Alliance Custom"
            }
        });
        return NextResponse.json({ success: true, board });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
    }
}
