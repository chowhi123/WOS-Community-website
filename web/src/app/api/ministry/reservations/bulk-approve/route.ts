import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { allianceId, date } = body;

        if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

        // Admin check: User must be R4/R5 in this alliance or global Admin
        let isAdmin = session.user.globalRole === 'ADMIN';
        if (!isAdmin && allianceId) {
            const member = await prisma.allianceMember.findUnique({
                where: { userId_allianceId: { userId: session.user.id, allianceId } }
            });
            if (member && (member.role === 'R4' || member.role === 'R5')) {
                isAdmin = true;
            }
        }

        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden: Only R4/R5 can bulk approve." }, { status: 403 });
        }

        const targetDate = new Date(date);
        const dayStart = startOfDay(targetDate);
        const dayEnd = endOfDay(targetDate);

        // Get all pending applications for this day
        // Technically MinistryReservation doesn't have an AllianceId directly on it, it relies on the user.
        // Assuming we are just bulk approving all pending in the system for that day since the frontend didn't restrict DB query by allianceId in the old system.

        // Let's get ALL reservations for this day
        const allReservationsForDay = await prisma.ministryReservation.findMany({
            where: {
                startTime: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        });

        const pending = allReservationsForDay.filter(r => r.status === 'PENDING');
        const approved = allReservationsForDay.filter(r => r.status === 'APPROVED');

        const toApproveIds: string[] = [];

        // Check for conflicts
        // A pending reservation is valid if:
        // 1. There is no APPROVED reservation for that exact startTime and position.
        // 2. There is no OTHER pending reservation for that exact startTime and position.
        for (const p of pending) {
            // Check if already approved slot exists
            const hasApprovedConflict = approved.some(a =>
                a.position === p.position &&
                a.startTime.getTime() === p.startTime.getTime()
            );

            if (hasApprovedConflict) continue;

            // Check if there are duplicate pending requests for the EXACT same slot
            const duplicatePendings = pending.filter(otherP =>
                otherP.position === p.position &&
                otherP.startTime.getTime() === p.startTime.getTime()
            );

            // Only approve if it's the ONLY pending request for this slot
            if (duplicatePendings.length === 1) {
                toApproveIds.push(p.id);
            }
        }

        if (toApproveIds.length > 0) {
            await prisma.ministryReservation.updateMany({
                where: {
                    id: { in: toApproveIds }
                },
                data: {
                    status: 'APPROVED',
                    adminNote: 'Bulk Approved'
                }
            });
        }

        return NextResponse.json({
            success: true,
            approvedCount: toApproveIds.length
        });

    } catch (error) {
        console.error("Bulk Approve Error:", error);
        return NextResponse.json({ error: "Bulk Approve failed" }, { status: 500 });
    }
}
