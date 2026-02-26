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

    const { allianceId, name, minRole, minReadRole } = await req.json();

    if (!allianceId || !name) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    try {
        // Verify R5 or R4 status
        const membership = await prisma.allianceMember.findUnique({
            where: {
                userId_allianceId: {
                    userId: session.user.id,
                    allianceId
                }
            }
        });

        if (!membership || !["R5", "R4"].includes(membership.role)) {
            return NextResponse.json({ error: "Only R5/R4 can create channels" }, { status: 403 });
        }

        const channel = await prisma.allianceChannel.create({
            // @ts-ignore
            data: {
                name: name.toLowerCase().replace(/\s+/g, '-'), // Slugify
                type: "TEXT",
                allianceId,
                minRole: minRole || "R1",
                minReadRole: minReadRole || "R1"
            }
        });

        return NextResponse.json({ success: true, channel });
    } catch (error) {
        console.error("Channel Create Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
