import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = await req.json();

    if (!channelId) {
        return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
    }

    // Get Channel & Verify Membership
    const channel = await prisma.allianceChannel.findUnique({
        where: { id: channelId },
        include: { alliance: true }
    });

    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    const membership = await prisma.allianceMember.findUnique({
        where: { userId_allianceId: { userId: session.user.id, allianceId: channel.allianceId } }
    });

    // Permission Check: Only R5 or R4 can manage channels
    if (!membership || !["R5", "R4"].includes(membership.role)) {
        return NextResponse.json({ error: "Only Officers can manage channels" }, { status: 403 });
    }

    // Delete
    try {
        await prisma.allianceChannel.delete({ where: { id: channelId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 });
    }
}
