import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RRule } from "rrule";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ events: [] });
        }

        const userId = session.user.id;

        // 1. Get User's Alliances
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                memberships: {
                    select: { allianceId: true, alliance: { select: { name: true } } }
                }
            }
        });

        const allianceIds = user?.memberships.map(m => m.allianceId) || [];

        // 2. Fetch Alliance Events
        const events = await prisma.event.findMany({
            where: {
                allianceId: { in: allianceIds }
            },
            include: {
                alliance: {
                    select: { name: true }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        // 3. Fetch Construction Reservations
        const construction = await prisma.constructionReservation.findMany({
            where: { userId },
            include: { alliance: { select: { name: true } } },
            orderBy: { startTime: 'asc' }
        });

        // 4. Fetch Training Reservations
        const training = await prisma.trainingReservation.findMany({
            where: { userId },
            include: { alliance: { select: { name: true } } },
            orderBy: { startTime: 'asc' }
        });

        // 5. Fetch Ministry Reservations
        const ministry = await prisma.ministryReservation.findMany({
            where: { userId },
            orderBy: { startTime: 'asc' }
        });

        const now = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(now.getFullYear() + 1);

        // 6. Process Recurring Events
        const expandedEvents: any[] = [];

        events.forEach(e => {
            if (e.recurrenceRule) {
                try {
                    // Create RRule instance
                    // Note: RRule.parseString handles standard parsing. 
                    // We manually set dtstart to the event's start time relative to UTC/Local mixing issue?
                    // RRule works with local dates by default if no timezone specified.
                    // Assuming e.startTime is a Date object from Prisma

                    const options = RRule.parseString(e.recurrenceRule);
                    options.dtstart = e.startTime;

                    const rule = new RRule(options);
                    const dates = rule.between(now, nextYear, true); // include dates from now to next year

                    dates.forEach(date => {
                        // Calculate end time
                        let endTime = null;
                        if (e.endTime) {
                            const duration = e.endTime.getTime() - e.startTime.getTime();
                            endTime = new Date(date.getTime() + duration);
                        }

                        expandedEvents.push({
                            id: `${e.id}-${date.getTime()}`, // Unique compound ID
                            title: e.title,
                            startTime: date,
                            endTime: endTime,
                            description: e.description,
                            allianceId: e.allianceId,
                            allianceName: e.alliance?.name,
                            type: 'EVENT'
                        });
                    });

                } catch (err) {
                    console.error(`Recurrence Error for ${e.id}:`, err);
                    // Fallback to original
                    expandedEvents.push({
                        id: e.id,
                        title: e.title,
                        startTime: e.startTime,
                        endTime: e.endTime,
                        description: e.description,
                        allianceId: e.allianceId,
                        allianceName: e.alliance?.name,
                        type: 'EVENT'
                    });
                }
            } else {
                // Single event
                expandedEvents.push({
                    id: e.id,
                    title: e.title,
                    startTime: e.startTime,
                    endTime: e.endTime,
                    description: e.description,
                    allianceId: e.allianceId,
                    allianceName: e.alliance?.name,
                    type: 'EVENT'
                });
            }
        });

        // 7. Merge & Normalize
        const calendarEvents = [
            ...expandedEvents,
            ...construction.map(c => ({
                id: c.id,
                title: `Construction (${c.alliance.name})`,
                startTime: c.startTime,
                endTime: c.endTime,
                description: c.note || "Construction Reservation",
                allianceId: c.allianceId,
                allianceName: c.alliance.name,
                type: 'CONSTRUCTION'
            })),
            ...training.map(t => ({
                id: t.id,
                title: `Training (${t.alliance.name})`,
                startTime: t.startTime,
                endTime: t.endTime,
                description: t.note || "Training Reservation",
                allianceId: t.allianceId,
                allianceName: t.alliance.name,
                type: 'TRAINING'
            })),
            ...ministry.map(m => ({
                id: m.id,
                title: `Ministry: ${m.position}`,
                startTime: m.startTime,
                endTime: m.endTime,
                description: m.adminNote || "Ministry Reservation",
                allianceId: null,
                type: 'MINISTRY'
            }))
        ];

        return NextResponse.json({ events: calendarEvents });

    } catch (error) {
        console.error("Calendar API Error:", error);
        return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
    }
}
