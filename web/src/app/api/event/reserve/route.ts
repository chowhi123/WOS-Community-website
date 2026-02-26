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

    const { eventId, slotTime } = await req.json();

    try {
        // 1. Check Event Existence & Permission
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { alliance: true }
        });
        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

        const membership = await prisma.allianceMember.findUnique({
            where: { userId_allianceId: { userId: session.user.id, allianceId: event.allianceId } }
        });
        if (!membership) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        // 2. Check Availability (FCFS)
        const existing = await prisma.reservation.findFirst({
            where: {
                eventId,
                slotTime: new Date(slotTime), // Exact match for slot
                status: "CONFIRMED"
            }
        });

        if (existing) {
            return NextResponse.json({ error: "Slot already taken" }, { status: 409 });
        }

        // 3. Create Reservation
        const reservation = await prisma.reservation.create({
            data: {
                eventId,
                userId: session.user.id,
                slotTime: new Date(slotTime),
                status: "CONFIRMED"
            }
        });

        return NextResponse.json({ success: true, reservation });
    } catch (error) {
        return NextResponse.json({ error: "Reservation Failed" }, { status: 500 });
    }
}
