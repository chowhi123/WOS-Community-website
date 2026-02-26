import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await req.json();
    if (!messageId) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        const message = await prisma.channelMessage.findUnique({
            where: { id: messageId },
            include: { channel: true }
        });

        if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Permission Check
        let canDelete = false;

        // 1. Author
        if (message.senderId === session.user.id) {
            canDelete = true;
        } else {
            // 2. Admin (Global)
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            if (user?.globalRole === 'ADMIN') canDelete = true;

            // 3. R4/R5 of the Alliance
            if (!canDelete) {
                const membership = await prisma.allianceMember.findUnique({
                    where: { userId_allianceId: { userId: session.user.id, allianceId: message.channel.allianceId } }
                });
                if (membership && ['R4', 'R5'].includes(membership.role)) {
                    canDelete = true;
                }
            }
        }

        if (!canDelete) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        await prisma.channelMessage.delete({ where: { id: messageId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}
