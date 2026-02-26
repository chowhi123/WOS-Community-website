import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper: Check if user can manage the reservation
async function canManageReservation(sessionUser: any, reservationOwnerId: string) {
    // 1. Owner
    if (sessionUser.id === reservationOwnerId) return true;

    // 2. Global Admin
    if (sessionUser.globalRole === 'ADMIN') return true;

    // 3. Alliance R4/R5 Logic
    // Find alliances the owner belongs to
    const ownerMemberships = await prisma.allianceMember.findMany({
        where: { userId: reservationOwnerId },
        select: { allianceId: true }
    });

    // Find my memberships where I am R4/R5
    const myHighRankMemberships = await prisma.allianceMember.findMany({
        where: {
            userId: sessionUser.id,
            role: { in: ['R4', 'R5'] }
        },
        select: { allianceId: true }
    });

    // Check intersection
    const ownerAllianceIds = new Set(ownerMemberships.map(m => m.allianceId));
    const isOfficerInSameAlliance = myHighRankMemberships.some(m => ownerAllianceIds.has(m.allianceId));

    return isOfficerInSameAlliance;
}

// PATCH: Update Status (Approve/Reject)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { status, adminNote } = body;

        const reservation = await prisma.ministryReservation.findUnique({
            where: { id }
        });

        if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Check Permissions
        const hasAccess = await canManageReservation(session.user, reservation.userId);
        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden: Only R4/R5 or Owner can manage this." }, { status: 403 });
        }

        if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const updated = await prisma.ministryReservation.update({
            where: { id },
            data: {
                status,
                adminNote
            }
        });

        return NextResponse.json({ reservation: updated });
    } catch (error) {
        console.error("Ministry Update Error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

// DELETE: Cancel Reservation
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;

        const reservation = await prisma.ministryReservation.findUnique({
            where: { id }
        });

        if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Check Permissions
        const hasAccess = await canManageReservation(session.user, reservation.userId);
        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.ministryReservation.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
