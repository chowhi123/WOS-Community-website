import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const allianceId = searchParams.get('allianceId');
    const type = searchParams.get('type');

    if (!allianceId || !type) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    try {
        if (type === "CONSTRUCTION") {
            const reservations = await prisma.constructionReservation.findMany({
                where: { allianceId, endTime: { gte: new Date() } }, // Only future/current
                include: { user: { select: { displayName: true, image: true, serverCode: true } } },
                orderBy: { startTime: 'asc' }
            });
            return NextResponse.json({ reservations });
        } else if (type === "TRAINING") {
            const reservations = await prisma.trainingReservation.findMany({
                where: { allianceId, endTime: { gte: new Date() } },
                include: { user: { select: { displayName: true, image: true, serverCode: true } } },
                orderBy: { startTime: 'asc' }
            });
            return NextResponse.json({ reservations });
        } else {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }
    } catch (error) {
        console.error("Reservation List Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
