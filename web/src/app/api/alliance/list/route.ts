import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);

    try {
        const alliances = await prisma.alliance.findMany({
            include: {
                _count: {
                    select: { members: true },
                },
                createdBy: {
                    select: { displayName: true, serverCode: true }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        let myAllianceId = null;
        if (session?.user?.id) {
            const member = await prisma.allianceMember.findFirst({
                where: { userId: session.user.id }
            });
            if (member) myAllianceId = member.allianceId;
        }

        return NextResponse.json({ alliances, myAllianceId });
    } catch (error) {
        console.error("Alliance List Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
