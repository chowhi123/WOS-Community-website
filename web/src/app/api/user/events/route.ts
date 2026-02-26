import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Find all alliances user is part of
        const memberships = await prisma.allianceMember.findMany({
            where: { userId: session.user.id },
            select: { allianceId: true }
        });

        const allianceIds = memberships.map(m => m.allianceId);

        const events = await prisma.event.findMany({
            where: {
                allianceId: { in: allianceIds },
                subscriptions: {
                    some: { userId: session.user.id }
                }
            },
            orderBy: { startTime: "asc" },
        });

        const expandedEvents = [];
        const now = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(futureLimit.getDate() + 90); // Expand 3 months ahead

        for (const event of events) {
            // Add original event if legal
            if (event.startTime >= now || (event.recurrenceRule)) {
                // If original is in past but recurring, we might skip adding the ORIGINAL strictly if it's way past, 
                // but let's just add instances.

                // If not recurring, just add it
                if (!event.recurrenceRule) {
                    expandedEvents.push(event);
                    continue;
                }

                // Expansion Logic
                const instanceStart = new Date(event.startTime);
                let safety = 0;

                while (instanceStart <= futureLimit && safety < 100) {
                    if (instanceStart >= now) {
                        // Clone event for instance
                        expandedEvents.push({
                            ...event,
                            startTime: new Date(instanceStart), // Copy date
                            id: `${event.id}_${instanceStart.getTime()}` // Virtual ID for key
                        });
                    }

                    // Move to next
                    if (event.recurrenceRule.includes("FREQ=DAILY")) {
                        instanceStart.setDate(instanceStart.getDate() + 1);
                    } else if (event.recurrenceRule.includes("FREQ=WEEKLY")) {
                        const intervalMatch = event.recurrenceRule.match(/INTERVAL=(\d+)/);
                        const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;
                        instanceStart.setDate(instanceStart.getDate() + (7 * interval));
                    } else {
                        break; // Unknown rule
                    }
                    safety++;
                }
            }
        }

        // Sort by start time again
        expandedEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        return NextResponse.json({ events: expandedEvents });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
