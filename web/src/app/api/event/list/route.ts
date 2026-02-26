import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Helper to parse RRULE and get next date
function getNextDate(currentDate: Date, rrule: string): Date {
    const nextDate = new Date(currentDate);
    if (rrule.includes("FREQ=DAILY")) {
        const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
        const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;
        nextDate.setDate(nextDate.getDate() + interval);
    } else if (rrule.includes("FREQ=WEEKLY")) {
        // Check for interval
        const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
        const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;
        nextDate.setDate(nextDate.getDate() + (7 * interval));
    }
    // Handle COUNT if needed, but for infinite repeat we just bump date
    // TODO: If COUNT logic is strict, we should decrement count in DB or track occurrences. 
    // For now, simple rolling update for infinite/time-based repetition.
    return nextDate;
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const allianceId = searchParams.get('allianceId');

    if (!allianceId) return NextResponse.json({ error: "Alliance ID required" }, { status: 400 });

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Privacy Check
    const membership = await prisma.allianceMember.findUnique({
        where: { userId_allianceId: { userId: session.user.id, allianceId } }
    });

    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const events = await prisma.event.findMany({
            where: { allianceId },
            orderBy: { startTime: 'asc' },
            include: { subscriptions: { where: { userId: session.user.id } } }
        });

        const now = new Date();
        const updates = [];

        // Check for recurrence updates
        for (const event of events) {
            if (event.recurrenceRule && new Date(event.startTime) < now) {
                let nextStart = new Date(event.startTime);
                let updated = false;

                // Roll forward until future
                // Safety break to prevent infinite loops if rule is broken (e.g. daily but somehow way in past) -> limit to 50 iterations e.g.
                let safety = 0;
                while (nextStart < now && safety < 100) {
                    nextStart = getNextDate(nextStart, event.recurrenceRule);
                    safety++;
                    updated = true;
                }

                if (updated && nextStart > now) {
                    // Calculate duration to update endTime too
                    const duration = event.endTime ? (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) : 0;
                    const nextEnd = duration > 0 ? new Date(nextStart.getTime() + duration) : null;

                    // Update DB asynchronously
                    updates.push(prisma.event.update({
                        where: { id: event.id },
                        data: {
                            startTime: nextStart,
                            endTime: nextEnd
                        }
                    }));

                    // Update local object for response
                    event.startTime = nextStart;
                    event.endTime = nextEnd;
                }
            }
        }

        // Execute updates in background or wait? Better wait to ensure consistency if user immediately refreshes?
        // Let's await.
        if (updates.length > 0) {
            await Promise.all(updates);
        }

        // Re-sort if dates changed?
        // Ideally yes, but client sorting might handle it. Let's simple re-sort to be nice.
        events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        // Map to include isSubscribed boolean
        const eventsWithSub = events.map(e => ({
            ...e,
            isSubscribed: e.subscriptions.length > 0
        }));

        return NextResponse.json({ events: eventsWithSub });
    } catch (error) {
        console.error("API Error (list events):", error);
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}
