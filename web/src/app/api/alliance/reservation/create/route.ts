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

    const { allianceId, type, startTime, endTime, note } = await req.json();

    if (!allianceId || !type || !startTime || !endTime) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
        const start = new Date(startTime);
        const end = new Date(endTime);

        // Enforce 30-minute interval alignment
        if (start.getMinutes() % 30 !== 0 || start.getSeconds() !== 0 || start.getMilliseconds() !== 0) {
            return NextResponse.json({ error: "Reservations must start on 30-minute intervals (XX:00 or XX:30)" }, { status: 400 });
        }

        if (type === "CONSTRUCTION") {
            const res = await prisma.constructionReservation.create({
                data: {
                    allianceId,
                    userId: session.user.id,
                    startTime: start,
                    endTime: end,
                    note
                }
            });
            return NextResponse.json({ success: true, reservation: res });
        } else if (type === "TRAINING") {
            const res = await prisma.trainingReservation.create({
                data: {
                    allianceId,
                    userId: session.user.id,
                    startTime: start,
                    endTime: end,
                    note
                }
            });
            return NextResponse.json({ success: true, reservation: res });
        } else {
            return NextResponse.json({ error: "Invalid reservation type" }, { status: 400 });
        }
    } catch (error) {
        console.error("Reservation Create Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
