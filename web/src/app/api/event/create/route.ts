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

    const { title, allianceId, startTime, recurrenceRule } = await req.json();

    try {
        // Check permission (R4 or R5)
        const membership = await prisma.allianceMember.findUnique({
            where: { userId_allianceId: { userId: session.user.id, allianceId } }
        });

        if (!membership || !['R4', 'R5'].includes(membership.role)) {
            return NextResponse.json({ error: "Only R4/R5 can manage events" }, { status: 403 });
        }

        const event = await prisma.event.create({
            data: {
                title,
                allianceId,
                startTime: new Date(startTime),
                recurrenceRule
            }
        });

        // Auto-subscribe members who haven't opted out
        const membersToSubscribe = await prisma.allianceMember.findMany({
            where: {
                allianceId,
                autoSubscribeEvents: true
            },
            select: { userId: true }
        });

        if (membersToSubscribe.length > 0) {
            await prisma.eventSubscription.createMany({
                data: membersToSubscribe.map(m => ({
                    userId: m.userId,
                    eventId: event.id
                })),
                skipDuplicates: true
            });
        }

        // TODO: Trigger Push Notification Logic here (or via cron/worker)

        return NextResponse.json({ success: true, event });
    } catch (error) {
        return NextResponse.json({ error: "Event Create Error" }, { status: 500 });
    }
}
