import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, title, startTime, recurrenceRule } = await req.json();

    if (!eventId) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { alliance: true }
        });

        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

        // Check Permissions
        const membership = await prisma.allianceMember.findUnique({
            where: { userId_allianceId: { userId: session.user.id, allianceId: event.allianceId } }
        });

        if (!membership || !['R4', 'R5'].includes(membership.role)) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                title: title || undefined,
                startTime: startTime ? new Date(startTime) : undefined,
                recurrenceRule: recurrenceRule // can be null to clear
            }
        });

        return NextResponse.json({ success: true, event: updatedEvent });
    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
