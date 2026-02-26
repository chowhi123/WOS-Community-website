import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// PATCH: Toggle Status (Activate/Deactivate)
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Prevent self-deactivation (optional, but good practice)
    if (id === session.user.id) {
        return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { isActive, isApprovedLeader, globalRole, serverCode, displayName, forceAllianceId } = body;

        // Forced Alliance Assignment Handling
        if (forceAllianceId) {
            const alliance = await prisma.alliance.findUnique({
                where: { id: forceAllianceId }
            });

            if (!alliance) {
                return NextResponse.json({ error: "Target Alliance not found" }, { status: 404 });
            }

            // Upsert the user into the Alliance
            await prisma.allianceMember.upsert({
                where: {
                    userId_allianceId: { userId: id, allianceId: forceAllianceId }
                },
                update: {
                    role: "R1"
                },
                create: {
                    userId: id,
                    allianceId: forceAllianceId,
                    role: "R1"
                }
            });

            // Also remove them from any other alliances they might be waiting on or currently in?
            // Optional: for now just adding/updating them to this one is enough.

            return NextResponse.json({ success: true, message: "User forced into alliance" });
        }


        const data: any = {};
        if (isActive !== undefined) data.isActive = Boolean(isActive);
        if (isApprovedLeader !== undefined) data.isApprovedLeader = Boolean(isApprovedLeader);
        if (globalRole !== undefined) data.globalRole = globalRole;
        if (serverCode !== undefined) data.serverCode = serverCode;
        if (displayName !== undefined) data.displayName = displayName;

        const updatedUser = await prisma.user.update({
            where: { id },
            data
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

// DELETE: Remove User
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (id === session.user.id) {
        return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    try {
        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
