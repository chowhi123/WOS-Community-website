import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const RoleRank = {
    "R5": 5, "R4": 4, "R3": 3, "R2": 2, "R1": 1
};

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { memberId, newRole } = await req.json(); // memberId is AllianceMember table ID, not UserID

        // Get Target Member
        const targetMember = await prisma.allianceMember.findUnique({
            where: { id: memberId },
            include: { alliance: true }
        });

        if (!targetMember) return NextResponse.json({ error: "Member not found" }, { status: 404 });

        // Get Actor (Current User) Membership
        const actor = await prisma.allianceMember.findUnique({
            where: {
                userId_allianceId: { userId: session.user.id, allianceId: targetMember.allianceId }
            }
        });

        if (!actor) return NextResponse.json({ error: "Not in alliance" }, { status: 403 });

        // Permissions Check
        const actorRank = RoleRank[actor.role as keyof typeof RoleRank];
        const targetRank = RoleRank[targetMember.role as keyof typeof RoleRank];
        const newRank = RoleRank[newRole as keyof typeof RoleRank];

        // 1. Must be at least R4 to manage roles
        if (actorRank < 4) return NextResponse.json({ error: "Insufficient permission" }, { status: 403 });

        // 2. Can only manage LOWER ranks (Strictly lower)
        // R5 (5) can manage 4,3,2,1.
        // R4 (4) can manage 3,2,1.
        if (actorRank <= targetRank) return NextResponse.json({ error: "Cannot manage equal or higher ranks" }, { status: 403 });

        // 3. Can only promote up to one rank below self
        // R5 can promote to R4. (5 > 4) -> OK
        // R4 can promote to R3. (4 > 3) -> OK. 
        if (actorRank <= newRank) return NextResponse.json({ error: "Cannot promote to equal or higher rank" }, { status: 403 });

        // Disallow promoting to R5 via this route (Use Transfer)
        if (newRole === "R5") return NextResponse.json({ error: "Cannot promote to R5 directly. Use Transfer." }, { status: 400 });

        // Execute Update
        await prisma.allianceMember.update({
            where: { id: memberId },
            data: { role: newRole }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
