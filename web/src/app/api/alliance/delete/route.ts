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

    const { allianceId } = await req.json();

    if (!allianceId) {
        return NextResponse.json({ error: "Alliance ID required" }, { status: 400 });
    }

    try {
        // Check Admin Status
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        const isAdmin = user?.globalRole === "ADMIN";

        // Verify R5 status if not admin
        let isR5 = false;
        if (!isAdmin) {
            const membership = await prisma.allianceMember.findUnique({
                where: {
                    userId_allianceId: {
                        userId: session.user.id,
                        allianceId
                    }
                }
            });
            if (membership && membership.role === "R5") isR5 = true;
        }

        if (!isAdmin && !isR5) {
            return NextResponse.json({ error: "Only the Alliance Leader (R5) or Site Admin can disband the alliance." }, { status: 403 });
        }

        // Delete Alliance (Cascade should handle members, channels, boards etc)
        await prisma.alliance.delete({
            where: { id: allianceId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Alliance Delete Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
