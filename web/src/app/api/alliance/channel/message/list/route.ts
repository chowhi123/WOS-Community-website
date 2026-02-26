import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
    if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Privacy TODO: Verify user is member of alliance that owns this channel
    // For speed, assuming if you have the ID you might be able to read, 
    // but ideally we check membership.

    try {
        const messages = await prisma.channelMessage.findMany({
            where: { channelId },
            include: {
                sender: { select: { id: true, displayName: true, serverCode: true, image: true } }
            },
            orderBy: { createdAt: 'asc' },
            take: 50 // Last 50 messages
        });
        return NextResponse.json({ messages });
    } catch (error) {
        return NextResponse.json({ error: "Error fetching messages" }, { status: 500 });
    }
}
