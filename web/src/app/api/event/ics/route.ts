import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    // Checking session strictly? 
    // Often ICS links are public/token based for subscription, but for now let's enforce session (browser download)
    if (!session || !session.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const memberships = await prisma.allianceMember.findMany({
            where: { userId: session.user.id },
            select: { allianceId: true }
        });
        const allianceIds = memberships.map(m => m.allianceId);

        const events = await prisma.event.findMany({
            where: { allianceId: { in: allianceIds } },
            orderBy: { startTime: "asc" }
        });

        // Generate ICS content
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WOS Community//EN\n";

        events.forEach(event => {
            const start = event.startTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
            const end = new Date(event.startTime.getTime() + 30 * 60000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"; // Default 30 min duration

            icsContent += "BEGIN:VEVENT\n";
            icsContent += `UID:${event.id}\n`;
            icsContent += `DTSTAMP:${start}\n`;
            icsContent += `DTSTART:${start}\n`;
            icsContent += `DTEND:${end}\n`;
            icsContent += `SUMMARY:${event.title}\n`;
            icsContent += "END:VEVENT\n";
        });

        icsContent += "END:VCALENDAR";

        return new NextResponse(icsContent, {
            headers: {
                "Content-Type": "text/calendar",
                "Content-Disposition": `attachment; filename="wos_calendar.ics"`
            }
        });

    } catch (error) {
        return new NextResponse("Error generating ICS", { status: 500 });
    }
}
