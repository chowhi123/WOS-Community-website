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

    const { receiverId, content } = await req.json();

    if (!receiverId || !content) {
        return NextResponse.json({ error: "Receiver and Content required" }, { status: 400 });
    }

    try {
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId }
        });

        if (!receiver) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (receiver.id === session.user.id) {
            return NextResponse.json({ error: "Cannot message self" }, { status: 400 });
        }

        // Check Blocking
        const blocked = await prisma.userBlock.findUnique({
            where: { blockerId_blockedId: { blockerId: receiver.id, blockedId: session.user.id } }
        });
        if (blocked) {
            return NextResponse.json({ error: "Message failed (Blocked)" }, { status: 403 });
        }

        const message = await prisma.message.create({
            data: {
                senderId: session.user.id,
                receiverId: receiver.id,
                content
            },
        });

        return NextResponse.json({ success: true, message });
    } catch (error) {
        return NextResponse.json({ error: "Send Failed" }, { status: 500 });
    }
}
