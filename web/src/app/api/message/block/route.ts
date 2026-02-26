import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = await req.json(); // User ID to block
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
    if (userId === session.user.id) return NextResponse.json({ error: "Cannot block self" }, { status: 400 });

    try {
        await prisma.userBlock.create({
            data: {
                blockerId: session.user.id,
                blockedId: userId
            }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2002') return NextResponse.json({ error: "Already blocked" });
        return NextResponse.json({ error: "Error blocking user" }, { status: 500 });
    }
}
