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

    try {
        const { targetUserId, allianceId } = await req.json();

        // Transaction to ensure atomic swap
        await prisma.$transaction(async (tx) => {
            // 1. Verify Actor is current R5 OR Admin
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            const isAdmin = user?.globalRole === "ADMIN";

            if (!isAdmin) {
                const currentLeader = await tx.allianceMember.findUnique({
                    where: { userId_allianceId: { userId: session.user.id, allianceId } }
                });

                if (!currentLeader || currentLeader.role !== "R5") {
                    throw new Error("Only the current R5 Leader or Site Admin can transfer leadership.");
                }
            } else {
                // If Admin, we need to find who the CURRENT R5 is to demote them
                // Find current R5
                const currentR5 = await tx.allianceMember.findFirst({
                    where: { allianceId, role: "R5" }
                });
                if (currentR5) {
                    await tx.allianceMember.update({
                        where: { id: currentR5.id },
                        data: { role: "R4" } // Demote old leader
                    });
                }
            }

            // 2. Verify Target is in alliance
            const targetMember = await tx.allianceMember.findUnique({
                where: {
                    userId_allianceId: { userId: targetUserId, allianceId }
                }
            });

            if (!targetMember) {
                throw new Error("Target member not found in alliance.");
            }

            // 3. Swap Roles
            // Demote current R5 -> R4 (Only if we didn't already handle it for Admin logic, or if standard user flow)
            if (!isAdmin) {
                const currentLeader = await tx.allianceMember.findUnique({ where: { userId_allianceId: { userId: session.user.id, allianceId } } });
                if (currentLeader) {
                    await tx.allianceMember.update({
                        where: { id: currentLeader.id },
                        data: { role: "R4" }
                    });
                }
            }

            // Promote target -> R5
            await tx.allianceMember.update({
                where: { id: targetMember.id },
                data: { role: "R5" }
            });

            // 4. Update Alliance createdBy (Optional, usually R5 is creatorOwner concept but createdBy is static history. 
            // WOS usually tracks R5 as current owner. 
            // In WOS, the "Leader" is whoever has R5. 
            // We might want to update `createdById` if we treat it as "OwnerId".
            // Let's leave createdById as "Founder" and rely on R5 role for permissions.
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Transfer failed" }, { status: 500 });
    }
}
