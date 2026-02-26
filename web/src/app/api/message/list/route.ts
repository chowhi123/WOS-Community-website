import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'inbox'; // inbox, outbox

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        let messages;
        if (type === 'outbox') {
            messages = await prisma.message.findMany({
                where: { senderId: session.user.id },
                orderBy: { createdAt: 'desc' },
                include: { receiver: { select: { displayName: true, serverCode: true } } }
            });
        } else {
            messages = await prisma.message.findMany({
                where: { receiverId: session.user.id },
                orderBy: { createdAt: 'desc' },
                include: { sender: { select: { displayName: true, serverCode: true } } }
            });
        }

        return NextResponse.json({ messages });
    } catch (error) {
        return NextResponse.json({ error: "Error fetching messages" }, { status: 500 });
    }
}
