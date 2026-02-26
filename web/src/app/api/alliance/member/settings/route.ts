
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

    const { allianceId, autoSubscribeEvents } = await req.json();

    try {
        const update = await prisma.allianceMember.update({
            where: {
                userId_allianceId: {
                    userId: session.user.id,
                    allianceId: allianceId
                }
            },
            data: {
                autoSubscribeEvents: autoSubscribeEvents
            }
        });

        return NextResponse.json({ success: true, settings: update });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
