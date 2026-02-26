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

    const { id, type } = await req.json();

    try {
        // We need to check if user owns the reservation OR is R4/R5
        // Efficient way: try delete with where clause for user, IF fail, check role and delete

        let valid = false;

        // 1. Check ownership
        if (type === "CONSTRUCTION") {
            const res = await prisma.constructionReservation.findUnique({ where: { id }, select: { userId: true, allianceId: true } });
            if (res) {
                if (res.userId === session.user.id) valid = true;
                else {
                    // Check R4/R5
                    const mem = await prisma.allianceMember.findUnique({ where: { userId_allianceId: { userId: session.user.id, allianceId: res.allianceId } } });
                    if (mem && (mem.role === "R4" || mem.role === "R5")) valid = true;
                }
            }
        } else if (type === "TRAINING") {
            const res = await prisma.trainingReservation.findUnique({ where: { id }, select: { userId: true, allianceId: true } });
            if (res) {
                if (res.userId === session.user.id) valid = true;
                else {
                    const mem = await prisma.allianceMember.findUnique({ where: { userId_allianceId: { userId: session.user.id, allianceId: res.allianceId } } });
                    if (mem && (mem.role === "R4" || mem.role === "R5")) valid = true;
                }
            }
        }

        if (!valid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        if (type === "CONSTRUCTION") {
            await prisma.constructionReservation.delete({ where: { id } });
        } else {
            await prisma.trainingReservation.delete({ where: { id } });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reservation Delete Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
