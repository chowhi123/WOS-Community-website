import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const blocks = await prisma.userBlock.findMany({
            where: { blockerId: session.user.id },
            include: { blocked: { select: { id: true, displayName: true, serverCode: true, image: true } } }
        });

        // Flatten to return list of users
        const blockedUsers = blocks.map(b => b.blocked);

        return NextResponse.json({ blockedUsers });
    } catch (error) {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}
