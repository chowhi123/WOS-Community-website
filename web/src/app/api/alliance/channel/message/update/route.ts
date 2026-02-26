import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, content } = await req.json();
    if (!messageId || !content) return NextResponse.json({ error: "Data required" }, { status: 400 });

    try {
        const message = await prisma.channelMessage.findUnique({ where: { id: messageId } });

        if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Only Author can edit
        if (message.senderId !== session.user.id) {
            return NextResponse.json({ error: "Only author can edit" }, { status: 403 });
        }

        const updated = await prisma.channelMessage.update({
            where: { id: messageId },
            data: { content }
        });

        return NextResponse.json({ success: true, message: updated });
    } catch (error) {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}
