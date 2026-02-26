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
        // Check if user is already in ANY alliance
        const existingMembership = await prisma.allianceMember.findFirst({
            where: { userId: session.user.id }
        });

        if (existingMembership) {
            return NextResponse.json({ error: "You are already in an alliance. Leave it first." }, { status: 400 });
        }

        const member = await prisma.allianceMember.create({
            data: {
                userId: session.user.id,
                allianceId: allianceId,
                role: "R1", // Default role
            },
        });

        return NextResponse.json({ success: true, member });
    } catch (error) {
        console.error("Alliance Join Error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
